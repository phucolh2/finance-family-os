// Cloud Snapshot & Backup Service for Finance Family OS
// Manages real-time cloud-persisted snapshots in Firestore under family/shared_state/snapshots
// Enables instant 1-click restore, JSON export, and protects against data overwrite

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { PersistedAppState } from '../types/finance';
import { createDataSummary, type DataSummary } from '../utils/dataSummary';
import { saveToFirestore } from './firestoreSync';

const PARENT_COLLECTION = 'family';
const PARENT_DOC_ID = 'shared_state';
const SNAPSHOTS_SUBCOLLECTION = 'snapshots';
const MAX_CLOUD_SNAPSHOTS = 20;

export interface CloudSnapshotItem {
  id: string;
  createdAt: string;
  createdBy: string;
  label: string;
  reason: 'manual' | 'auto_schedule' | 'pre_sync_safety' | 'conflict_backup';
  summary?: DataSummary;
  data: PersistedAppState;
}

/**
 * Saves a full snapshot of the app state to Firestore cloud vault.
 * Automatically rotates out snapshots older than MAX_CLOUD_SNAPSHOTS.
 */
export async function saveCloudSnapshot(
  persisted: PersistedAppState,
  createdBy: string,
  label?: string,
  reason: 'manual' | 'auto_schedule' | 'pre_sync_safety' | 'conflict_backup' = 'manual'
): Promise<CloudSnapshotItem | null> {
  if (!db) return null;

  try {
    const now = new Date();
    const timestampStr = now.toISOString();
    const cleanId = `snap_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`;
    const displayLabel = label || `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`;

    const dataToSave = JSON.parse(JSON.stringify(persisted.data));
    delete dataToSave.resolvedMonthlyDb;
    delete dataToSave.resolvedMonthlyDbMap;

    const summary = createDataSummary(dataToSave);

    const snapshotItem: CloudSnapshotItem = {
      id: cleanId,
      createdAt: timestampStr,
      createdBy: createdBy || 'Gia đình',
      label: displayLabel,
      reason,
      summary,
      data: {
        schemaVersion: persisted.schemaVersion,
        updatedAt: persisted.updatedAt || timestampStr,
        lastUpdatedBy: persisted.lastUpdatedBy || createdBy,
        data: dataToSave,
      },
    };

    const snapshotDocRef = doc(db, PARENT_COLLECTION, PARENT_DOC_ID, SNAPSHOTS_SUBCOLLECTION, cleanId);
    await setDoc(snapshotDocRef, snapshotItem);

    // Clean up older snapshots asynchronously to prevent unbounded storage
    pruneOldCloudSnapshots().catch((err) => {
      console.warn('[CloudBackup] Pruning old snapshots failed:', err);
    });

    return snapshotItem;
  } catch (error) {
    console.error('[CloudBackup] Failed to save cloud snapshot:', error);
    return null;
  }
}

/**
 * Lists the most recent cloud snapshots from Firestore.
 */
export async function listCloudSnapshots(maxCount = MAX_CLOUD_SNAPSHOTS): Promise<CloudSnapshotItem[]> {
  if (!db) return [];

  try {
    const subColRef = collection(db, PARENT_COLLECTION, PARENT_DOC_ID, SNAPSHOTS_SUBCOLLECTION);
    const q = query(subColRef, orderBy('createdAt', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);

    const list: CloudSnapshotItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CloudSnapshotItem);
    });

    return list;
  } catch (error) {
    console.error('[CloudBackup] Failed to list cloud snapshots:', error);
    return [];
  }
}

/**
 * Deletes a specific cloud snapshot by its ID.
 */
export async function deleteCloudSnapshot(snapshotId: string): Promise<boolean> {
  if (!db || !snapshotId) return false;

  try {
    const docRef = doc(db, PARENT_COLLECTION, PARENT_DOC_ID, SNAPSHOTS_SUBCOLLECTION, snapshotId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('[CloudBackup] Failed to delete cloud snapshot:', error);
    return false;
  }
}

/**
 * Restores a cloud snapshot to become the active shared_state in Firestore.
 */
export async function restoreCloudSnapshot(
  snapshotId: string,
  restoredByActor: string
): Promise<PersistedAppState | null> {
  if (!db || !snapshotId) return null;

  try {
    const docRef = doc(db, PARENT_COLLECTION, PARENT_DOC_ID, SNAPSHOTS_SUBCOLLECTION, snapshotId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Bản sao lưu không tồn tại hoặc đã bị xóa');
    }

    const item = docSnap.data() as CloudSnapshotItem;
    const targetData = item.data;

    // Save as current state with attribution
    const attribution = `${restoredByActor} (Khôi phục từ "${item.label}")`;
    await saveToFirestore('family', targetData.data, targetData.schemaVersion, attribution);

    return targetData;
  } catch (error) {
    console.error('[CloudBackup] Failed to restore cloud snapshot:', error);
    throw error;
  }
}

/**
 * Trims snapshots collection to MAX_CLOUD_SNAPSHOTS.
 */
async function pruneOldCloudSnapshots(): Promise<void> {
  if (!db) return;
  try {
    const subColRef = collection(db, PARENT_COLLECTION, PARENT_DOC_ID, SNAPSHOTS_SUBCOLLECTION);
    const q = query(subColRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.size > MAX_CLOUD_SNAPSHOTS) {
      const docsToDelete = snapshot.docs.slice(MAX_CLOUD_SNAPSHOTS);
      await Promise.all(docsToDelete.map((d) => deleteDoc(d.ref)));
    }
  } catch (err) {
    console.warn('[CloudBackup] Prune error:', err);
  }
}

/**
 * Trigger client-side download of a cloud snapshot as a .json file.
 */
export function downloadSnapshotAsJson(snapshot: CloudSnapshotItem): void {
  try {
    const blob = new Blob([JSON.stringify(snapshot.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateFormatted = snapshot.createdAt.slice(0, 10);
    const cleanLabel = snapshot.label.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    a.download = `finance_family_snapshot_${dateFormatted}_${cleanLabel}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[CloudBackup] Failed to download snapshot file:', err);
  }
}

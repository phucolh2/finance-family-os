// Firestore sync service for Finance Family OS
// Handles read/write/subscribe to Firestore with localStorage fallback

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { AppState, PersistedAppState } from '../types/finance';

const COLLECTION = 'family';
const DOC_ID = 'shared_state';

/**
 * Save app state to Firestore for a given user.
 * The data is stored at: family/shared_state
 */
export async function saveToFirestore(
  _userId: string,
  state: AppState,
  schemaVersion: number
): Promise<void> {
  if (!db) return;

  const dataToSave = JSON.parse(JSON.stringify(state));
  // Không lưu bộ nhớ cache tính toán khổng lồ lên Cloud để tránh vượt quá giới hạn 40,000 indexes của Firestore!
  delete dataToSave.resolvedMonthlyDb;
  delete dataToSave.resolvedMonthlyDbMap;

  const persisted: PersistedAppState = {
    schemaVersion,
    updatedAt: new Date().toISOString(),
    data: dataToSave,
  };

  const docRef = doc(db, COLLECTION, DOC_ID);
  await setDoc(docRef, persisted);
}

/**
 * Load app state from Firestore for a given user.
 * Returns null if no data exists or Firebase is not configured.
 */
export async function loadFromFirestore(
  _userId: string
): Promise<PersistedAppState | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, COLLECTION, DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as PersistedAppState;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Failed to load state:', error);
    return null;
  }
}

/**
 * Subscribe to real-time changes on a user's app state in Firestore.
 * Returns an unsubscribe function.
 */
export function subscribeToFirestore(
  _userId: string,
  onUpdate: (persisted: PersistedAppState) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  const docRef = doc(db, COLLECTION, DOC_ID);

  return onSnapshot(
    docRef,
    { includeMetadataChanges: false },
    (docSnap) => {
      if (docSnap.exists()) {
        // Skip updates from our own writes (hasPendingWrites = true)
        if (docSnap.metadata.hasPendingWrites) return;
        const data = docSnap.data() as PersistedAppState;
        onUpdate(data);
      }
    },
    (error) => {
      console.error('[Firestore] Subscription error:', error);
      onError?.(error);
    }
  );
}

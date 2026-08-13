import type { PersistedAppState } from '../types/finance';
import { addBackupHistoryEntry } from './backupHistory';
import { createDataSummary } from './dataSummary';

const AUTO_BACKUP_KEY = 'family_finance_os_auto_backup';
const AUTO_BACKUP_CONFIG_KEY = 'family_finance_os_backup_config';
const MAX_BACKUP_SLOTS = 3;

export interface AutoBackupSlot {
  timestamp: string;
  label: string;
  data: PersistedAppState;
}

export interface AutoBackupConfig {
  enabled: boolean;
  intervalHours: number; // 6, 12, 24, 48
  lastBackupTimestamp?: string;
}

const DEFAULT_CONFIG: AutoBackupConfig = {
  enabled: true,
  intervalHours: 24,
};

/**
 * Reads the auto-backup configuration.
 */
export function getAutoBackupConfig(): AutoBackupConfig {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves the auto-backup configuration.
 */
export function saveAutoBackupConfig(config: AutoBackupConfig): void {
  try {
    localStorage.setItem(AUTO_BACKUP_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save auto-backup config:', err);
  }
}

/**
 * Reads all auto-backup slots from localStorage.
 */
export function getAutoBackupSlots(): AutoBackupSlot[] {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Creates a new auto-backup, rotating out the oldest if > MAX_BACKUP_SLOTS.
 */
export function createAutoBackup(persisted: PersistedAppState): AutoBackupSlot | null {
  try {
    const slots = getAutoBackupSlots();
    const now = new Date();
    const label = now.toLocaleString('vi-VN');
    
    const newSlot: AutoBackupSlot = {
      timestamp: now.toISOString(),
      label,
      data: persisted,
    };

    slots.unshift(newSlot);
    
    // Trim to max slots
    while (slots.length > MAX_BACKUP_SLOTS) {
      slots.pop();
    }

    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(slots));

    // Update config with last backup timestamp
    const config = getAutoBackupConfig();
    config.lastBackupTimestamp = now.toISOString();
    saveAutoBackupConfig(config);

    // Log to backup history
    const summary = persisted.data ? createDataSummary(persisted.data) : undefined;
    addBackupHistoryEntry({
      action: 'auto_backup',
      status: 'success',
      summary,
    });

    return newSlot;
  } catch (err) {
    console.error('Failed to create auto-backup:', err);
    return null;
  }
}

/**
 * Checks if an auto-backup is due based on configuration interval.
 */
export function isBackupDue(): boolean {
  const config = getAutoBackupConfig();
  if (!config.enabled) return false;

  if (!config.lastBackupTimestamp) return true;

  const lastBackup = new Date(config.lastBackupTimestamp).getTime();
  const now = Date.now();
  const intervalMs = config.intervalHours * 60 * 60 * 1000;

  return (now - lastBackup) >= intervalMs;
}

/**
 * Deletes a specific auto-backup slot by timestamp.
 */
export function deleteAutoBackupSlot(timestamp: string): void {
  try {
    const slots = getAutoBackupSlots().filter(s => s.timestamp !== timestamp);
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(slots));
  } catch (err) {
    console.error('Failed to delete auto-backup slot:', err);
  }
}

/**
 * Clears all auto-backup slots.
 */
export function clearAllAutoBackups(): void {
  try {
    localStorage.removeItem(AUTO_BACKUP_KEY);
  } catch (err) {
    console.error('Failed to clear auto-backups:', err);
  }
}

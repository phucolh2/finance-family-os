import type { DataSummary } from './dataSummary';

const HISTORY_KEY = 'family_finance_os_backup_history';
const MAX_ENTRIES = 50;

export type BackupAction = 'export' | 'import' | 'reset' | 'auto_backup';

export interface BackupHistoryEntry {
  id: string;
  timestamp: string;
  action: BackupAction;
  status: 'success' | 'error';
  summary?: DataSummary;
  filename?: string;
  errorMessage?: string;
}

/**
 * Reads backup history from localStorage.
 */
export function getBackupHistory(): BackupHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Adds a new entry to backup history (FIFO, max 50 entries).
 */
export function addBackupHistoryEntry(entry: Omit<BackupHistoryEntry, 'id' | 'timestamp'>): BackupHistoryEntry {
  const history = getBackupHistory();
  const newEntry: BackupHistoryEntry = {
    ...entry,
    id: `bh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  history.unshift(newEntry); // newest first

  // Trim to max entries
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save backup history:', err);
  }

  return newEntry;
}

/**
 * Clears all backup history entries.
 */
export function clearBackupHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear backup history:', err);
  }
}

/**
 * Returns a human-readable label for a backup action.
 */
export function getActionLabel(action: BackupAction): string {
  switch (action) {
    case 'export': return 'Xuất dữ liệu';
    case 'import': return 'Nhập dữ liệu';
    case 'reset': return 'Xóa/Khôi phục';
    case 'auto_backup': return 'Sao lưu tự động';
    default: return action;
  }
}

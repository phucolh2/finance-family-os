/**
 * Kho trạng thái "Chốt sổ tháng" dạng module-level để các hàm thuần (periodGuard)
 * đọc được mà không cần đổi chữ ký hàm ở ~10 nơi gọi.
 *
 * Nguồn dữ liệu thật nằm ở state.toolConfigs.monthLock (đồng bộ Firestore);
 * AppProvider chép sang đây mỗi lần state đổi.
 */
export interface MonthLockEntry {
  by: string;   // 'husband' | 'wife'
  at: string;   // ISO timestamp
}

export type MonthLockMap = Record<string, MonthLockEntry>;

let currentLocks: MonthLockMap = {};

export function setMonthLocks(locks: MonthLockMap | undefined | null): void {
  currentLocks = locks && typeof locks === 'object' ? locks : {};
}

export function isPeriodKeyLocked(periodKey: string | undefined | null): boolean {
  if (!periodKey) return false;
  return Boolean(currentLocks[periodKey]);
}

export function isMonthYearLocked(month: number, year: number): boolean {
  return isPeriodKeyLocked(`${year}-${String(month).padStart(2, '0')}`);
}

export function getLockedKeys(): string[] {
  return Object.keys(currentLocks).sort();
}

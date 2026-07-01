export interface YearMonth {
  year: number;
  month: number;
}

/**
 * Formats year and month to YYYY-MM period key.
 * Example: (2026, 10) -> "2026-10"
 */
export function formatPeriodKey(year: number, month: number): string {
  const paddedMonth = String(month).padStart(2, '0');
  return `${year}-${paddedMonth}`;
}

/**
 * Parses YYYY-MM period key to YearMonth.
 */
export function parsePeriodKey(key: string): YearMonth {
  const [yearStr, monthStr] = key.split('-');
  return {
    year: parseInt(yearStr, 10) || 2026,
    month: parseInt(monthStr, 10) || 10,
  };
}

/**
 * Calculates total months elapsed between two periods.
 * Example: (10/2026 to 12/2026) -> 2 months difference
 */
export function monthsBetween(start: YearMonth, end: YearMonth): number {
  return (end.year - start.year) * 12 + (end.month - start.month);
}

/**
 * Adds months to a YearMonth period and returns the new period.
 */
export function addMonths(start: YearMonth, delta: number): YearMonth {
  const totalMonths = start.year * 12 + (start.month - 1) + delta;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return { year: newYear, month: newMonth };
}

/**
 * Checks if p1 is equal to or before p2.
 */
export function isBeforeOrEqual(p1: YearMonth, p2: YearMonth): boolean {
  if (p1.year !== p2.year) {
    return p1.year < p2.year;
  }
  return p1.month <= p2.month;
}

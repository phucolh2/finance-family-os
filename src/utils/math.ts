/**
 * Safe numeric conversion to prevent NaN or undefined crashes.
 * If value is not a valid finite number, returns fallback (default 0).
 */
export function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Checks if a value is NaN or infinite.
 */
export function isInvalidNumber(val: any): boolean {
  if (val === null || val === undefined) return true;
  const num = Number(val);
  return !Number.isFinite(num);
}

/**
 * Safe array helper to ensure we always have a valid array.
 */
export function safeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

/**
 * Safe object helper.
 */
export function safeObject<T extends object>(obj: T | null | undefined, fallback: T): T {
  return obj && typeof obj === 'object' ? obj : fallback;
}

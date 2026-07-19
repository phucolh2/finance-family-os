/**
 * Safe numeric conversion to prevent NaN or undefined crashes.
 * If value is not a valid finite number, returns fallback (default 0).
 */
export function safeNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Checks if a value is NaN or infinite.
 */
export function isInvalidNumber(val: unknown): boolean {
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

/**
 * Calculates the monthly payment for an amortizing loan.
 * P = Principal, r = monthly interest rate, n = total months.
 * PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculatePMT(principal: number, annualRatePercent: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRatePercent <= 0) return principal / termMonths;
  
  const r = (annualRatePercent / 100) / 12;
  const num = principal * r * Math.pow(1 + r, termMonths);
  const den = Math.pow(1 + r, termMonths) - 1;
  return num / den;
}

export function calculateNonTermInterest(
  principal: number,
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  schedule?: { startMonth: number, startYear: number, rateAnnual: number }[]
): number {
  if (principal <= 0) return 0;
  
  const startTotalMonths = startYear * 12 + startMonth;
  const endTotalMonths = endYear * 12 + endMonth;
  if (endTotalMonths <= startTotalMonths) return 0;
  if (!schedule || schedule.length === 0) return 0;

  let interest = 0;
  for (let m = startTotalMonths; m < endTotalMonths; m++) {
    let activeRate = 0;
    for (const p of schedule) {
      if ((p.startYear * 12 + p.startMonth) <= m) {
        activeRate = p.rateAnnual;
      }
    }
    interest += principal * (activeRate / 100 / 12);
  }
  
  return interest;
}

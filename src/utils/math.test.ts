import { describe, it, expect } from 'vitest';
import { safeNumber, isInvalidNumber, safeArray, safeObject, calculatePMT, calculateTermMonths, calculateNonTermInterest } from './math';

describe('math utilities', () => {
  describe('safeNumber', () => {
    it('should return the number if it is valid', () => {
      expect(safeNumber(42)).toBe(42);
      expect(safeNumber('42')).toBe(42);
      expect(safeNumber(0)).toBe(0);
    });

    it('should return the fallback if it is invalid', () => {
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber('abc', 10)).toBe(10);
    });
  });

  describe('isInvalidNumber', () => {
    it('should correctly identify invalid numbers', () => {
      expect(isInvalidNumber(NaN)).toBe(true);
      expect(isInvalidNumber(null)).toBe(true);
      expect(isInvalidNumber(undefined)).toBe(true);
      expect(isInvalidNumber('abc')).toBe(true);
    });

    it('should return false for valid numbers', () => {
      expect(isInvalidNumber(0)).toBe(false);
      expect(isInvalidNumber(42)).toBe(false);
      expect(isInvalidNumber('42')).toBe(false);
    });
  });

  describe('safeArray', () => {
    it('should return the array if valid', () => {
      expect(safeArray([1, 2, 3])).toEqual([1, 2, 3]);
      expect(safeArray([])).toEqual([]);
    });
    
    it('should return empty array if invalid', () => {
      expect(safeArray(null)).toEqual([]);
      expect(safeArray(undefined)).toEqual([]);
      expect(safeArray('not array' as any)).toEqual([]);
    });
  });

  describe('safeObject', () => {
    it('should return the object if valid', () => {
      const obj = { a: 1 };
      expect(safeObject(obj, { a: 2 })).toEqual({ a: 1 });
    });
    
    it('should return fallback if invalid', () => {
      const fallback = { a: 2 };
      expect(safeObject(null, fallback)).toEqual(fallback);
      expect(safeObject(undefined, fallback)).toEqual(fallback);
      expect(safeObject('not object' as any, fallback)).toEqual(fallback);
    });
  });

  describe('calculatePMT', () => {
    it('should calculate correct PMT for valid inputs', () => {
      // 100,000 at 5% for 12 months
      const pmt = calculatePMT(100000, 5, 12);
      expect(pmt).toBeCloseTo(8560.75, 2);
    });

    it('should return 0 if principal or terms are <= 0', () => {
      expect(calculatePMT(0, 5, 12)).toBe(0);
      expect(calculatePMT(-100, 5, 12)).toBe(0);
      expect(calculatePMT(100, 5, 0)).toBe(0);
      expect(calculatePMT(100, 5, -5)).toBe(0);
    });

    it('should return principal/terms if rate is 0', () => {
      expect(calculatePMT(1200, 0, 12)).toBe(100);
      expect(calculatePMT(1200, -1, 12)).toBe(100);
    });
  });

  describe('calculateTermMonths', () => {
    it('should return 0 if principal or monthly payment is <= 0', () => {
      expect(calculateTermMonths(0, 5, 100)).toBe(0);
      expect(calculateTermMonths(-100, 5, 100)).toBe(0);
      expect(calculateTermMonths(100, 5, 0)).toBe(0);
      expect(calculateTermMonths(100, 5, -100)).toBe(0);
    });

    it('should divide principal by monthly payment if annualRate is <= 0', () => {
      expect(calculateTermMonths(1200, 0, 100)).toBe(12);
      expect(calculateTermMonths(1200, -1, 100)).toBe(12);
      expect(calculateTermMonths(1000, 0, 300)).toBe(4); // ceil(1000 / 300) = 4
    });

    it('should return Infinity if monthly payment is <= minimum interest', () => {
      // 100k, 12% annual = 1% monthly = 1000 interest.
      expect(calculateTermMonths(100000, 12, 1000)).toBe(Infinity);
      expect(calculateTermMonths(100000, 12, 500)).toBe(Infinity);
    });

    it('should correctly calculate number of months for valid inputs', () => {
      // P = 2000, r = 9.5%, PMT = 18.64259
      // Wait, let's use exact PMT for 20 years (240 months).
      const pmt = calculatePMT(2000, 9.5, 240); // 18.64259
      expect(calculateTermMonths(2000, 9.5, pmt)).toBe(240);
    });
  });

  describe('calculateNonTermInterest', () => {
    it('should calculate interest across months given a schedule', () => {
      const schedule = [{ startMonth: 1, startYear: 2026, rateAnnual: 6 }];
      // 10000 at 6% = 50 per month.
      // From 1/2026 to 3/2026 is 2 months (m=1 to m<3). So 50 * 2 = 100.
      expect(calculateNonTermInterest(10000, 1, 2026, 3, 2026, schedule)).toBeCloseTo(100, 2);
    });

    it('should handle rate changes in schedule', () => {
      const schedule = [
        { startMonth: 1, startYear: 2026, rateAnnual: 6 },
        { startMonth: 2, startYear: 2026, rateAnnual: 12 }
      ];
      // Month 1: 6% of 10000 = 50
      // Month 2: 12% of 10000 = 100
      // Total for 1/2026 to 3/2026 (2 months) = 150
      expect(calculateNonTermInterest(10000, 1, 2026, 3, 2026, schedule)).toBeCloseTo(150, 2);
    });

    it('should return 0 if invalid inputs', () => {
      expect(calculateNonTermInterest(0, 1, 2026, 3, 2026)).toBe(0);
      expect(calculateNonTermInterest(1000, 3, 2026, 1, 2026)).toBe(0);
      expect(calculateNonTermInterest(1000, 1, 2026, 3, 2026, [])).toBe(0);
      expect(calculateNonTermInterest(1000, 1, 2026, 3, 2026)).toBe(0); // undefined schedule
    });
  });
});

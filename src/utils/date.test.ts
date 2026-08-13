import { describe, it, expect } from 'vitest';
import { formatPeriodKey, parsePeriodKey, monthsBetween, addMonths, isBeforeOrEqual } from './date';

describe('date utilities', () => {
  describe('formatPeriodKey', () => {
    it('should format single digit months with leading zero', () => {
      expect(formatPeriodKey(2026, 1)).toBe('2026-01');
      expect(formatPeriodKey(2026, 9)).toBe('2026-09');
    });

    it('should format double digit months correctly', () => {
      expect(formatPeriodKey(2026, 10)).toBe('2026-10');
      expect(formatPeriodKey(2026, 12)).toBe('2026-12');
    });
  });

  describe('parsePeriodKey', () => {
    it('should parse valid period keys', () => {
      expect(parsePeriodKey('2026-01')).toEqual({ year: 2026, month: 1 });
      expect(parsePeriodKey('2026-12')).toEqual({ year: 2026, month: 12 });
    });

    it('should fallback to default if format is invalid', () => {
      // 2026, 10 is the fallback in the implementation
      expect(parsePeriodKey('invalid')).toEqual({ year: 2026, month: 10 });
      expect(parsePeriodKey('2027-invalid')).toEqual({ year: 2027, month: 10 });
    });
  });

  describe('monthsBetween', () => {
    it('should calculate difference correctly in same year', () => {
      expect(monthsBetween({ year: 2026, month: 1 }, { year: 2026, month: 5 })).toBe(4);
    });

    it('should calculate difference correctly across years', () => {
      expect(monthsBetween({ year: 2026, month: 10 }, { year: 2027, month: 2 })).toBe(4);
      expect(monthsBetween({ year: 2026, month: 1 }, { year: 2028, month: 1 })).toBe(24);
    });

    it('should return negative if start is after end', () => {
      expect(monthsBetween({ year: 2026, month: 10 }, { year: 2026, month: 9 })).toBe(-1);
    });
  });

  describe('addMonths', () => {
    it('should add months within the same year', () => {
      expect(addMonths({ year: 2026, month: 1 }, 5)).toEqual({ year: 2026, month: 6 });
    });

    it('should wrap around years correctly', () => {
      expect(addMonths({ year: 2026, month: 10 }, 4)).toEqual({ year: 2027, month: 2 });
      expect(addMonths({ year: 2026, month: 1 }, 24)).toEqual({ year: 2028, month: 1 });
    });

    it('should handle negative delta', () => {
      expect(addMonths({ year: 2026, month: 5 }, -2)).toEqual({ year: 2026, month: 3 });
      expect(addMonths({ year: 2026, month: 2 }, -4)).toEqual({ year: 2025, month: 10 });
    });
  });

  describe('isBeforeOrEqual', () => {
    it('should compare correctly across different years', () => {
      expect(isBeforeOrEqual({ year: 2025, month: 12 }, { year: 2026, month: 1 })).toBe(true);
      expect(isBeforeOrEqual({ year: 2027, month: 1 }, { year: 2026, month: 12 })).toBe(false);
    });

    it('should compare correctly within same year', () => {
      expect(isBeforeOrEqual({ year: 2026, month: 5 }, { year: 2026, month: 6 })).toBe(true);
      expect(isBeforeOrEqual({ year: 2026, month: 6 }, { year: 2026, month: 6 })).toBe(true);
      expect(isBeforeOrEqual({ year: 2026, month: 7 }, { year: 2026, month: 6 })).toBe(false);
    });
  });
});

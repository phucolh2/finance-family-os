import { describe, it, expect } from 'vitest';
import { safeNumber, isInvalidNumber } from './math';

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
});

import { describe, it, expect } from 'vitest';
import {
  safeNumber,
  formatMoneyVNDMillion,
  formatAxisMoneyVNDMillion,
  formatTooltipMoneyVNDMillion,
  formatTableMoneyVNDMillion,
  formatKpiMoneyVNDMillion,
  formatVND,
  formatPercent
} from './format';

describe('format utilities', () => {
  describe('safeNumber', () => {
    it('should return number for valid numeric inputs', () => {
      expect(safeNumber(42)).toBe(42);
      expect(safeNumber(-15.5)).toBe(-15.5);
      expect(safeNumber(0)).toBe(0);
    });

    it('should parse valid string numbers', () => {
      expect(safeNumber('42')).toBe(42);
      expect(safeNumber(' -15.5 ')).toBe(-15.5);
      expect(safeNumber('0')).toBe(0);
    });

    it('should return fallback for invalid inputs', () => {
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber(Infinity)).toBe(0);
      expect(safeNumber('abc')).toBe(0);
      expect(safeNumber('')).toBe(0);
      expect(safeNumber('   ')).toBe(0);
      expect(safeNumber({})).toBe(0);
      expect(safeNumber([], 10)).toBe(10);
    });
  });

  describe('formatMoneyVNDMillion', () => {
    it('should return fallback for invalid values', () => {
      expect(formatMoneyVNDMillion(null)).toBe('—');
      expect(formatMoneyVNDMillion(undefined)).toBe('—');
      expect(formatMoneyVNDMillion(NaN)).toBe('—');
      expect(formatMoneyVNDMillion(Infinity)).toBe('—');
      expect(formatMoneyVNDMillion('abc', { fallback: 'N/A' })).toBe('N/A');
    });

    it('should format values < 1000 in millions', () => {
      expect(formatMoneyVNDMillion(80)).toBe('80 triệu');
      expect(formatMoneyVNDMillion(80.5)).toBe('80.5 triệu');
      expect(formatMoneyVNDMillion(0)).toBe('0 triệu');
      expect(formatMoneyVNDMillion(-50)).toBe('-50 triệu');
    });

    it('should format values >= 1000 in billions', () => {
      expect(formatMoneyVNDMillion(1500)).toBe('1.5 tỷ');
      expect(formatMoneyVNDMillion(1000)).toBe('1 tỷ');
      expect(formatMoneyVNDMillion(12345)).toBe('12.35 tỷ'); // defaults to 2 decimals
    });

    it('should handle different modes', () => {
      expect(formatMoneyVNDMillion(1500, { mode: 'million' })).toBe('1,500 triệu');
      expect(formatMoneyVNDMillion(80, { mode: 'billion' })).toBe('0.08 tỷ');
      expect(formatMoneyVNDMillion(1500, { mode: 'raw', showUnit: false })).toBe('1,500');
      // compact mode behaves like auto but shortUnit=true
      expect(formatMoneyVNDMillion(1500, { mode: 'compact' })).toBe('1.5 tỷ');
    });

    it('should respect decimals', () => {
      expect(formatMoneyVNDMillion(1500.555, { decimals: 1 })).toBe('1.5 tỷ');
      expect(formatMoneyVNDMillion(1500.555, { decimals: 3 })).toBe('1.501 tỷ');
    });

    it('should handle sign correctly', () => {
      expect(formatMoneyVNDMillion(80, { signed: true })).toBe('+80 triệu');
      expect(formatMoneyVNDMillion(-80, { signed: true })).toBe('-80 triệu');
      expect(formatMoneyVNDMillion(0, { signed: true })).toBe('0 triệu');
    });

    it('should strip trailing zeroes', () => {
      // 1.00 -> 1
      expect(formatMoneyVNDMillion(1000, { decimals: 2 })).toBe('1 tỷ');
      // 1.20 -> 1.2
      expect(formatMoneyVNDMillion(1200, { decimals: 2 })).toBe('1.2 tỷ');
    });

    it('should include thousand separators', () => {
      expect(formatMoneyVNDMillion(1500000, { mode: 'million' })).toBe('1,500,000 triệu');
    });
  });

  describe('Specialized formatters', () => {
    it('formatAxisMoneyVNDMillion', () => {
      expect(formatAxisMoneyVNDMillion(80)).toBe('80 triệu');
      expect(formatAxisMoneyVNDMillion(1500)).toBe('1.5 tỷ');
      expect(formatAxisMoneyVNDMillion(NaN)).toBe('—');
    });

    it('formatTooltipMoneyVNDMillion', () => {
      expect(formatTooltipMoneyVNDMillion(80)).toBe('80 triệu đồng');
      expect(formatTooltipMoneyVNDMillion(1500)).toBe('1.5 tỷ đồng');
      expect(formatTooltipMoneyVNDMillion(null)).toBe('—');
    });

    it('formatTableMoneyVNDMillion & formatKpiMoneyVNDMillion', () => {
      expect(formatTableMoneyVNDMillion(80)).toBe('80 triệu');
      expect(formatKpiMoneyVNDMillion(1500)).toBe('1.5 tỷ');
    });

    it('formatVND', () => {
      expect(formatVND(80)).toBe('80 triệu');
      expect(formatVND(1550, true)).toBe('1.6 tỷ'); // compact = true (1 decimal)
    });
  });

  describe('formatPercent', () => {
    it('should return fallback for invalid values', () => {
      expect(formatPercent(null)).toBe('—');
      expect(formatPercent(NaN)).toBe('—');
      expect(formatPercent(undefined)).toBe('—');
      expect(formatPercent('abc')).toBe('—');
    });

    it('should format percentage correctly', () => {
      expect(formatPercent(40)).toBe('40%');
      expect(formatPercent(40.5)).toBe('40.5%');
      expect(formatPercent(40.55, 2)).toBe('40.55%');
    });

    it('should strip trailing zeroes', () => {
      expect(formatPercent(40.0)).toBe('40%');
      expect(formatPercent(40.10, 2)).toBe('40.1%');
    });
  });
});

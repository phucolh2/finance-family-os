import { describe, it, expect } from 'vitest';
import { calculateFire } from './fireEngine';
import type { ProjectionYearlyRow } from '../types/projection';

describe('fireEngine', () => {
  it('should calculate FIRE target based on expenses and withdrawal rate (percentage)', () => {
    const result = calculateFire({
      expensesMonthly: 1000,
      netWorth: 100000,
      withdrawalRate: 4 // 4%
    });

    // Annual expense = 12000
    // Target = 12000 / 0.04 = 300000
    expect(result.fireTarget).toBe(300000);
    // Progress = 100000 / 300000 = 33.33%
    expect(result.fireProgress).toBeCloseTo(33.33, 2);
    // Gap = 200000
    expect(result.fireGap).toBe(200000);
    expect(result.expectedFireYear).toBeNull();
  });

  it('should handle withdrawalRate passed as decimal', () => {
    const result = calculateFire({
      expensesMonthly: 1000,
      netWorth: 100000,
      withdrawalRate: 0.04 // 4%
    });

    expect(result.fireTarget).toBe(300000);
  });

  it('should handle zero withdrawal rate safely', () => {
    const result = calculateFire({
      expensesMonthly: 1000,
      netWorth: 100000,
      withdrawalRate: 0
    });

    expect(result.fireTarget).toBe(0);
    expect(result.fireProgress).toBe(0);
    expect(result.fireGap).toBe(0);
  });

  it('should derive expected FIRE year from yearly rows', () => {
    const mockRows = [
      { year: 2026, nominalNetWorth: 100000, fireTarget: 300000 } as ProjectionYearlyRow,
      { year: 2027, nominalNetWorth: 200000, fireTarget: 310000 } as ProjectionYearlyRow,
      { year: 2028, nominalNetWorth: 350000, fireTarget: 320000 } as ProjectionYearlyRow, // Crosses here
      { year: 2029, nominalNetWorth: 400000, fireTarget: 330000 } as ProjectionYearlyRow
    ];

    const result = calculateFire({
      expensesMonthly: 1000,
      netWorth: 100000,
      withdrawalRate: 4,
      yearlyRows: mockRows
    });

    expect(result.expectedFireYear).toBe(2028);
  });

  it('should return 0 gap if net worth exceeds target', () => {
    const result = calculateFire({
      expensesMonthly: 1000,
      netWorth: 500000,
      withdrawalRate: 4
    });

    expect(result.fireTarget).toBe(300000);
    expect(result.fireGap).toBe(0); // Cannot be negative
    expect(result.fireProgress).toBeCloseTo(166.67, 2);
  });
});

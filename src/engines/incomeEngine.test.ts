import { describe, it, expect } from 'vitest';
import { calculateIncome } from './incomeEngine';
import type { TimelinePeriod, IncomeScheduleItem } from '../types/finance';

describe('incomeEngine', () => {
  const mockPeriod: TimelinePeriod = {
    index: 0,
    key: '2026-05',
    month: 5,
    year: 2026,
    husbandAge: 30,
    wifeAge: 28
  };

  it('should sum all active incomes for the current period', () => {
    const schedule: IncomeScheduleItem[] = [
      { id: '1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 100, incomeType: 'fulltime_salary', status: 'active', note: '' },
      { id: '2', effectiveMonth: 5, effectiveYear: 2026, incomeMonthly: 50, incomeType: 'freelance', status: 'active', note: '' },
      { id: '3', effectiveMonth: 6, effectiveYear: 2026, incomeMonthly: 30, incomeType: 'business_profit', status: 'active', note: '' } // future
    ];

    const result = calculateIncome({
      period: mockPeriod, // 5/2026
      incomeSchedule: schedule
    });

    expect(result.incomeMonthly).toBe(150);
    expect(result.activeScheduleIds).toEqual(['1', '2']);
    expect(result.breakdown).toEqual({
      fulltime_salary: 100,
      freelance: 50
    });
  });

  it('should ignore cancelled or planned incomes', () => {
    const schedule: IncomeScheduleItem[] = [
      { id: '1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 100, incomeType: 'fulltime_salary', status: 'cancelled', note: '' },
      { id: '2', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 50, incomeType: 'freelance', status: 'planned', note: '' }
    ];

    const result = calculateIncome({
      period: mockPeriod,
      incomeSchedule: schedule
    });

    expect(result.incomeMonthly).toBe(0);
    expect(result.activeScheduleIds).toHaveLength(0);
  });

  it('should respect end dates of income schedules', () => {
    const schedule: IncomeScheduleItem[] = [
      { id: '1', effectiveMonth: 1, effectiveYear: 2025, endMonth: 4, endYear: 2026, incomeMonthly: 100, incomeType: 'fulltime_salary', status: 'active', note: '' }, // ended
      { id: '2', effectiveMonth: 1, effectiveYear: 2025, endMonth: 5, endYear: 2026, incomeMonthly: 50, incomeType: 'freelance', status: 'active', note: '' }, // active exactly at end
      { id: '3', effectiveMonth: 1, effectiveYear: 2025, endMonth: 6, endYear: 2026, incomeMonthly: 30, incomeType: 'business_profit', status: 'active', note: '' } // still active
    ];

    const result = calculateIncome({
      period: mockPeriod, // 5/2026
      incomeSchedule: schedule
    });

    expect(result.incomeMonthly).toBe(80); // 50 + 30
    expect(result.activeScheduleIds).toEqual(['2', '3']);
  });

  it('should fallback to fulltime_salary if incomeType is missing', () => {
    const schedule = [
      { id: '1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 100, status: 'active', note: '' } as IncomeScheduleItem
    ];

    const result = calculateIncome({
      period: mockPeriod,
      incomeSchedule: schedule
    });

    expect(result.breakdown).toEqual({
      fulltime_salary: 100
    });
  });
});

import type { TimelinePeriod, IncomeScheduleItem } from '../types/finance';
import { safeNumber, safeArray } from '../utils/math';

export interface IncomeEngineInput {
  period: TimelinePeriod;
  incomeSchedule: IncomeScheduleItem[];
}

export interface IncomeOutput {
  incomeMonthly: number;
  activeScheduleId: string;
  activeScheduleIds: string[];
  breakdown: Record<string, number>;
  warnings: string[];
}

/**
 * Resolves the monthly income for a specific timeline period by summing
 * all active concurrent income streams.
 */
export function calculateIncome(input: IncomeEngineInput): IncomeOutput {
  const warnings: string[] = [];
  const period = input.period;
  const schedule = safeArray(input.incomeSchedule);

  const breakdown: Record<string, number> = {};

  let totalIncome = 0;
  const activeScheduleIds: string[] = [];

  schedule.forEach((item) => {
    // 1. Ignore if cancelled or planned (planned = ghi chú dự kiến, chưa ghi nhận vào thu nhập thực)
    if (item.status === 'cancelled' || item.status === 'planned') {
      return;
    }

    // 2. Check start date (must be start month or later)
    const startKey = item.effectiveYear * 12 + item.effectiveMonth;
    const currentKey = period.year * 12 + period.month;

    if (currentKey < startKey) {
      return;
    }

    // 3. Check end date (if specified)
    if (item.endYear !== undefined && item.endMonth !== undefined) {
      const endKey = item.endYear * 12 + item.endMonth;
      if (currentKey > endKey) {
        return;
      }
    }

    // Accumulate active stream
    const type = item.incomeType || 'fulltime_salary';
    const amount = safeNumber(item.incomeMonthly, 0);

    breakdown[type] = (breakdown[type] || 0) + amount;
    totalIncome += amount;
    activeScheduleIds.push(item.id);
  });

  return {
    incomeMonthly: totalIncome,
    activeScheduleId: activeScheduleIds.join(','),
    activeScheduleIds,
    breakdown,
    warnings,
  };
}

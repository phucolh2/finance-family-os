import type { TimelinePeriod, IncomeScheduleItem } from '../types/finance';
import { monthsBetween, isBeforeOrEqual } from '../utils/date';
import { safeNumber, safeArray } from '../utils/math';

export interface IncomeEngineInput {
  period: TimelinePeriod;
  incomeSchedule: IncomeScheduleItem[];
}

export interface IncomeOutput {
  incomeMonthly: number;
  activeScheduleId: string;
  warnings: string[];
}

/**
 * Resolves the monthly income for a specific timeline period.
 * Selects the active schedule item and applies compounding annual growth.
 */
export function calculateIncome(input: IncomeEngineInput): IncomeOutput {
  const warnings: string[] = [];
  const period = input.period;
  const schedule = safeArray(input.incomeSchedule);

  if (schedule.length === 0) {
    return {
      incomeMonthly: 0,
      activeScheduleId: '',
      warnings: ['Không có lịch trình thu nhập nào được cấu hình.'],
    };
  }

  // 1. Filter schedule items whose effective date is <= current period
  const pastOrActiveItems = schedule.filter((item) => {
    return isBeforeOrEqual(
      { year: item.effectiveYear, month: item.effectiveMonth },
      { year: period.year, month: period.month }
    );
  });

  if (pastOrActiveItems.length === 0) {
    // If current period is before the first schedule item, use the first schedule item as fallback
    // but generate a warning.
    const sortedAll = [...schedule].sort((a, b) => {
      if (a.effectiveYear !== b.effectiveYear) {
        return a.effectiveYear - b.effectiveYear;
      }
      return a.effectiveMonth - b.effectiveMonth;
    });
    
    const fallback = sortedAll[0];
    warnings.push(`Mốc thời gian hiện tại (${period.year}-${String(period.month).padStart(2, '0')}) trước thời điểm hiệu lực của nguồn thu nhập đầu tiên. Dùng tạm nguồn thu nhập khởi điểm.`);
    return {
      incomeMonthly: safeNumber(fallback.incomeMonthly, 0),
      activeScheduleId: fallback.id,
      warnings,
    };
  }

  // 2. Sort past/active items to find the latest active one
  pastOrActiveItems.sort((a, b) => {
    if (a.effectiveYear !== b.effectiveYear) {
      return a.effectiveYear - b.effectiveYear;
    }
    return a.effectiveMonth - b.effectiveMonth;
  });

  const activeItem = pastOrActiveItems[pastOrActiveItems.length - 1];
  const baseIncome = safeNumber(activeItem.incomeMonthly, 0);

  return {
    incomeMonthly: baseIncome,
    activeScheduleId: activeItem.id,
    warnings,
  };
}

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
    warnings.push(`Mốc thời gian hiện tại (${period.year}-${String(period.month).padStart(2, '0')}) trước thời điểm hiệu lực của nguồn thu nhập đầu tiên. Đã áp dụng Thu nhập = 0.`);
    return {
      incomeMonthly: 0,
      activeScheduleId: '',
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
  let baseIncome = safeNumber(activeItem.incomeMonthly, 0);

  // Lifecycle check
  if (activeItem.status === 'cancelled') {
    baseIncome = 0;
    warnings.push(`Nguồn thu nhập đã bị hủy.`);
  } else if (activeItem.endYear !== undefined && activeItem.endMonth !== undefined) {
    const isEnded = period.year > activeItem.endYear || (period.year === activeItem.endYear && period.month > activeItem.endMonth);
    if (isEnded) {
      baseIncome = 0;
      warnings.push(`Nguồn thu nhập đã kết thúc vào ${activeItem.endMonth}/${activeItem.endYear}.`);
    }
  }

  return {
    incomeMonthly: baseIncome,
    activeScheduleId: activeItem.id,
    warnings,
  };
}

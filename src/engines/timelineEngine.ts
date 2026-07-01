import type { TimelinePeriod } from '../types/finance';
import { formatPeriodKey, monthsBetween, addMonths } from '../utils/date';

export interface TimelineInput {
  planningStartMonth: number;
  planningStartYear: number;
  planningEndMonth: number;
  planningEndYear: number;
  husbandAgeAtStart: number;
  wifeAgeAtStart: number;
}

export interface TimelineOutput {
  periods: TimelinePeriod[];
  warnings: string[];
}

/**
 * Pure, deterministic timeline generator.
 * Creates monthly TimelinePeriods from start month/year to end month/year.
 * Handles invalid ranges defensively by returning warnings instead of crashing.
 */
export function generateTimeline(input: TimelineInput): TimelineOutput {
  const warnings: string[] = [];
  const periods: TimelinePeriod[] = [];

  const startMonth = input.planningStartMonth;
  const startYear = input.planningStartYear;
  const endMonth = input.planningEndMonth;
  const endYear = input.planningEndYear;

  // Defensive validation of input month ranges
  if (startMonth < 1 || startMonth > 12) {
    warnings.push('Tháng bắt đầu không hợp lệ (phải từ 1 đến 12).');
  }
  if (endMonth < 1 || endMonth > 12) {
    warnings.push('Tháng kết thúc không hợp lệ (phải từ 1 đến 12).');
  }

  const startPeriod = { year: startYear, month: startMonth };
  const endPeriod = { year: endYear, month: endMonth };

  const totalMonths = monthsBetween(startPeriod, endPeriod);

  if (totalMonths < 0) {
    warnings.push('Thời gian kết thúc nhỏ hơn thời gian bắt đầu. Không thể khởi tạo timeline dự phóng.');
    return { periods, warnings };
  }

  // Prevent memory allocation blowup (cap at 100 years / 1200 months)
  if (totalMonths > 1200) {
    warnings.push('Thời gian lập kế hoạch vượt quá giới hạn 100 năm. Tự động thu gọn về 100 năm.');
  }

  const limitMonths = Math.min(totalMonths, 1200);

  for (let i = 0; i <= limitMonths; i++) {
    const current = addMonths(startPeriod, i);
    const yearsElapsed = Math.floor(i / 12);

    periods.push({
      index: i,
      key: formatPeriodKey(current.year, current.month),
      month: current.month,
      year: current.year,
      husbandAge: input.husbandAgeAtStart + yearsElapsed,
      wifeAge: input.wifeAgeAtStart + yearsElapsed,
    });
  }

  return { periods, warnings };
}

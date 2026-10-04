import { isMonthYearLocked, isPeriodKeyLocked } from './monthLockStore';

/**
 * Kiểm tra xem tháng/năm mục tiêu có được phép thay đổi không:
 *  - Tháng đã "Chốt sổ" → KHÔNG cho phép (bấm "Mở khóa" ở thanh quan sát để chỉnh sửa).
 *  - Tháng mục tiêu phải >= tháng quan sát.
 * @returns true nếu hợp lệ (cho phép thay đổi), false nếu vi phạm.
 */
export function isWithinObservationPeriod(
  targetMonth: number,
  targetYear: number,
  selectedPeriodKey: string | undefined
): boolean {
  if (isMonthYearLocked(targetMonth, targetYear)) return false;
  if (!selectedPeriodKey) return true; // Chưa chọn tháng QS → cho phép tự do
  const [obsYear, obsMonth] = selectedPeriodKey.split('-').map(Number);
  const targetValue = targetYear * 12 + targetMonth;
  const obsValue = obsYear * 12 + obsMonth;
  return targetValue >= obsValue;
}

/**
 * Thông báo lỗi chuẩn khi vi phạm rule.
 */
export function getPeriodGuardMessage(selectedPeriodKey: string | undefined): string {
  if (!selectedPeriodKey) return 'Tháng này đã chốt sổ. Bấm "Mở khóa" ở thanh Tháng quan sát để điều chỉnh.';
  const [y, m] = selectedPeriodKey.split('-');
  if (isPeriodKeyLocked(selectedPeriodKey)) {
    return `Tháng ${parseInt(m)}/${y} đã chốt sổ. Bấm "Mở khóa" ở thanh Tháng quan sát để điều chỉnh.`;
  }
  return `Không thể thao tác trước tháng quan sát (T${parseInt(m)}/${y}). Vui lòng chọn lại tháng quan sát phù hợp để điều chỉnh dữ liệu quá khứ.`;
}

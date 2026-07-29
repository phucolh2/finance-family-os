/**
 * Kiểm tra xem tháng/năm mục tiêu có >= tháng quan sát không.
 * @returns true nếu hợp lệ (cho phép thay đổi), false nếu vi phạm.
 */
export function isWithinObservationPeriod(
  targetMonth: number,
  targetYear: number,
  selectedPeriodKey: string | undefined
): boolean {
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
  if (!selectedPeriodKey) return '';
  const [y, m] = selectedPeriodKey.split('-');
  return `Không thể thao tác trước tháng quan sát (T${parseInt(m)}/${y}). Vui lòng chọn lại tháng quan sát phù hợp để điều chỉnh dữ liệu quá khứ.`;
}

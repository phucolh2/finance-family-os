/**
 * Kiểm tra xem tháng/năm mục tiêu có được phép chỉnh sửa hay không.
 * Nó phụ thuộc vào 2 yếu tố:
 * 1. Tháng quan sát (selectedPeriodKey) - UX guard.
 * 2. Khóa sổ (lockedUntilPeriod) - Data lock guard.
 */
export function isWithinObservationPeriod(
  targetMonth: number,
  targetYear: number,
  selectedPeriodKey: string | undefined,
  lockedUntilPeriod?: string
): boolean {
  const targetKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  
  // 1. Data lock guard (Chốt sổ)
  if (lockedUntilPeriod && targetKey <= lockedUntilPeriod) {
    return false;
  }

  // 2. UX guard (Tháng quan sát)
  if (!selectedPeriodKey) return true;
  const [obsYear, obsMonth] = selectedPeriodKey.split('-').map(Number);
  const targetValue = targetYear * 12 + targetMonth;
  const obsValue = obsYear * 12 + obsMonth;
  return targetValue >= obsValue;
}

/**
 * Thông báo lỗi chuẩn khi vi phạm rule.
 */
export function getPeriodGuardMessage(selectedPeriodKey: string | undefined, lockedUntilPeriod?: string, targetMonth?: number, targetYear?: number): string {
  if (lockedUntilPeriod && targetMonth && targetYear) {
    const targetKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    if (targetKey <= lockedUntilPeriod) {
      const [y, m] = lockedUntilPeriod.split('-');
      return `Dữ liệu thuộc tháng đã chốt sổ (đến T${parseInt(m)}/${y}).`;
    }
  }

  if (!selectedPeriodKey) return '';
  const [y, m] = selectedPeriodKey.split('-');
  return `Không thể thao tác trước tháng quan sát (T${parseInt(m)}/${y}). Vui lòng chọn lại tháng quan sát phù hợp để điều chỉnh dữ liệu quá khứ.`;
}

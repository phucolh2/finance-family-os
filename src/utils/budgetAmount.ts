/**
 * Tiện ích quy đổi giữa "% tỷ lệ" và "số tiền (triệu VND)" cho màn hình Phân bổ ngân sách.
 *
 * Nguồn sự thật vẫn là `ratioPercent` (lưu trong BudgetTreeNode). Số tiền chỉ là
 * giá trị suy ra: amount = base × ratioPercent / 100 (khớp budgetEngine).
 */

/** Làm tròn 2 chữ số thập phân (0,01% ~ 0,008 triệu ở gốc 80 triệu). */
export const roundRatio = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
};

/** Gốc hợp lệ để quy đổi (> 0 và hữu hạn). */
export const isValidBase = (base: number | undefined | null): base is number =>
  typeof base === 'number' && Number.isFinite(base) && base > 0;

/** % → số tiền (triệu). Gốc không hợp lệ trả về 0. */
export const percentToAmount = (percent: number, base: number): number => {
  if (!isValidBase(base) || !Number.isFinite(percent)) return 0;
  return (base * percent) / 100;
};

/** Số tiền (triệu) → % (làm tròn 2 chữ số, kẹp trong 0..100). Gốc không hợp lệ trả về 0. */
export const amountToPercent = (amount: number, base: number): number => {
  if (!isValidBase(base) || !Number.isFinite(amount)) return 0;
  const pct = (amount / base) * 100;
  return Math.max(0, Math.min(100, roundRatio(pct)));
};

/** Làm tròn số tiền hiển thị/nhập tới 2 chữ số thập phân. */
export const roundAmount = (amount: number): number => {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
};

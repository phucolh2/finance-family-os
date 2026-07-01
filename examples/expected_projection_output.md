# Expected Projection Output

## Rule

Projection chạy theo tháng.

Yearly table chỉ aggregate từ monthly rows.

## Required Fields per Monthly Row

- key
- month
- year
- incomeMonthly
- expensesMonthly
- investmentMonthly
- savingMonthly
- childCostMonthly
- netCashflow
- investmentBalance
- savingBalance
- portfolioBalance
- netWorth
- realNetWorthTodayValue
- fireTarget
- fireProgress
- warnings

## Acceptance

- Đổi planningStartMonth thì monthlyRows thay đổi.
- Đổi income schedule thì income các tháng tương lai thay đổi.
- Đổi budget ratio thì allocation các tháng tương lai thay đổi.
- Thêm child 2031 thì childCostMonthly active từ 01/2031.
- Không có child 2035.

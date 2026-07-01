# 08 — FEATURE SPEC

## 1. Dashboard

### Purpose

Hiển thị toàn cảnh tài chính gia đình tại tháng/năm đang chọn.

### Inputs

- selectedMonth
- selectedYear
- resolved projection
- budget output
- FIRE output
- portfolio output

### Sections

1. Family Hero
2. KPI Grid
3. Budget Allocation Bars
4. Net Worth Chart
5. FIRE Progress
6. AI Summary
7. Warnings

### KPI Cards

- Thu nhập tháng
- Chi cơ bản/tháng
- Đầu tư/tháng
- Tiết kiệm/tháng
- Chi phí con/tháng nếu active
- Net Worth
- FIRE Progress
- Quỹ bình an
- Xác suất FIRE

### Acceptance

- Không tự tính toán.
- Lấy toàn bộ từ engines.
- Có selector tháng/năm.
- Khi đổi tháng/năm, dashboard update.

---

## 2. Thu nhập theo thời gian

### Purpose

Quản lý income schedule.

### Fields

- effectiveMonth
- effectiveYear
- incomeMonthly
- incomeGrowthRateAnnual
- note

### Features

- Add row
- Edit row
- Delete row
- Sort by effective date
- Show active row for selected month

### Acceptance

- Income projection update realtime.
- No hardcoded income.

---

## 3. Phân bổ ngân sách

### Purpose

Quản lý current budget allocation.

### Default Groups

- Nhà cửa & sinh hoạt cơ bản
- Tương lai & đầu tư
- Bình an & dự phòng
- Gia đình & trải nghiệm
- Sức khỏe & phát triển

### Features

- Edit ratio
- Edit rule type
- Edit cap
- Add category
- Disable category
- Warning if total ratio != 100%
- Warning if allocation > income

### Acceptance

- Amount derives from income * ratio.
- No fixed default money.
- Dashboard and Projection use same budget output.

---

## 4. Lịch sử tỷ lệ ngân sách

### Purpose

Quản lý BudgetRatioSchedule theo tháng hiệu lực.

### Features

- Add schedule effective date
- Clone from previous
- Edit ratios
- Compare two schedules
- Validate total ratio

### Acceptance

- Projection uses correct active schedule by month.
- Changing schedule updates future months only.

---

## 5. Giai đoạn linh hoạt

### Purpose

Quản lý life stages.

### Example

- 10/2026–12/2027: thuê nhà 7tr fixed
- 01/2028–12/2030: tăng thu nhập, chuẩn bị mua nhà
- 01/2031 onward: có con
- after property purchase: rent = 0

### Fields

- fromMonth/fromYear
- toMonth/toYear
- hasHouse
- rentMode
- rentMonthly
- foodBaseMonthly
- foodInflationAnnual
- foodCapMonthly
- transportMonthly
- travelMonthly
- healthFundCap
- liquidityFundCap

### Acceptance

- Life stage resolves by month.
- Projection updates when stage changes.

---

## 6. Kịch bản gốc

### Purpose

Base scenario không có con.

### Displays

- Yearly projection
- Net worth
- FIRE year
- Investment path
- Warnings

### Acceptance

- Uses scenarioEngine with no child event.
- No separate formula.

---

## 7. Kịch bản có con 2031

### Purpose

Scenario sinh con năm 2031.

### Displays

- Child cost by year
- Child age
- Cashflow impact
- Net worth impact
- FIRE impact

### Acceptance

- No 2035 scenario.
- No unrealistic 63tr/month default.
- Child cost category separate.
- Investment not directly reduced by child cost.

---

## 8. Quản lý kịch bản

### Features

- Create scenario
- Clone scenario
- Delete scenario
- Compare scenario
- Add overrides

### Compare Metrics

- Net worth final
- FIRE date
- FIRE probability
- Total child cost
- Total investment
- Total health cost
- Months with deficit

---

## 9. Dự phóng tài sản

### Purpose

Main projection table and charts.

### Inputs

- start month/year
- end month/year
- assumptions
- selected scenario

### Table Columns

- Year
- Husband age
- Wife age
- Income monthly end year
- Total income year
- Total expenses year
- Avg investment monthly
- Avg saving monthly
- Investment balance
- Saving balance
- Portfolio balance
- Event impact
- Net worth
- Real net worth today value
- FIRE target
- FIRE progress
- Notes

### Acceptance

- Monthly engine, yearly aggregation.
- Chart tooltip.
- Updates realtime when start/end changes.

---

## 10. Danh mục đầu tư

### Assets

- USD
- Crypto
- Bất động sản
- Chứng khoán

### Features

- Target allocation
- Expected return
- Actual return
- Actual contribution
- Balance override
- PnL calculation

### Displays

- Allocation pie
- Growth line
- Asset table
- Yearly PnL table

---

## 11. FIRE Center

### Displays

- FIRE target
- FIRE progress
- Expected FIRE date
- FIRE gap
- Rule 4% explanation
- Monte Carlo probability
- P10/P50/P90 year

### Acceptance

- No hardcoded FIRE year.
- Uses future expenses with inflation.

---

## 12. Bệnh tật & hậu sự

### Purpose

Plan health risk and final rest readiness.

### Inputs

- healthFundCap
- liquidityFundCap
- medicalInflationRate
- finalRestCostToday
- finalRestInflationRate
- insuranceMonthly
- bhytMonthly

### Displays

- Health fund progress
- Liquidity fund progress
- Projected medical cost
- Projected final rest cost
- Readiness score

---

## 13. Knowledge Center

### Concepts

- Life Cycle Hypothesis
- Permanent Income Hypothesis
- Modern Portfolio Theory
- Behavioral Finance
- Prospect Theory
- Household Economics
- Easterlin Paradox
- Harvard Study of Adult Development
- OECD Better Life Index
- Trinity Study / Rule 4%

### Acceptance

- Easy Vietnamese explanation.
- Practical family examples.
- Links to related modules.

---

## 14. Settings

### Features

- Export JSON
- Import JSON
- Reset default
- Schema version display
- Assumptions editor
- Currency setting

---

## 15. Global Acceptance

- No crash
- No NaN
- No undefined
- Build pass
- Warm UI
- Consistent engine output

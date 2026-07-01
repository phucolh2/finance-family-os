# 12 — TEST CASES

## 1. Purpose

Tài liệu này liệt kê test cases để kiểm tra Family Financial OS.

Các test này giúp đảm bảo:

- không hardcode
- engine tính đúng
- UI không crash
- scenario hoạt động đúng
- projection realtime
- child cost hợp lý
- FIRE không hiển thị năm cứng

---

## 2. Timeline Tests

### TC-TL-001 — Generate timeline normal

Input:

- start: 10/2026
- end: 12/2026

Expected:

- 3 periods
- 2026-10
- 2026-11
- 2026-12

### TC-TL-002 — Generate long timeline

Input:

- start: 10/2026
- end: 12/2060

Expected:

- no crash
- monthly periods generated
- index increasing

### TC-TL-003 — Invalid end before start

Input:

- start: 01/2030
- end: 12/2029

Expected:

- warning/error
- no white screen

---

## 3. Income Tests

### TC-IN-001 — Resolve base income

Schedule:

- 10/2026: 80tr, growth 5%

Period:

- 10/2026

Expected:

- income = 80

### TC-IN-002 — Income changes by effective date

Schedule:

- 10/2026: 80
- 01/2028: 95

Period:

- 12/2027 → use 80 schedule
- 01/2028 → use 95 schedule

### TC-IN-003 — Income growth applies

Schedule:

- 10/2026: 80, growth 12%/year

Expected:

- 10/2027 approx 89.6 if annual growth compounded monthly

---

## 4. Budget Tests

### TC-BG-001 — Default ratio with income 80

Default ratios:

- Housing/basic 29%
- Future/investing 40%
- Safety 10%
- Family/experience 11%
- Health/growth 10%

Expected:

- investment = 32
- total allocation = 80
- total ratio = 100

### TC-BG-002 — Default ratio with income 100

Expected:

- investment = 40
- health/growth = 10
- no amount stuck at income 80 value

### TC-BG-003 — Ratio total less than 100

Input ratios total 95%.

Expected:

- warning visible
- no crash

### TC-BG-004 — Ratio total greater than 100

Input ratios total 110%.

Expected:

- warning deficit risk
- no crash

### TC-BG-005 — No hardcoded removed category

Expected:

- no "Tài sản phụ & hình ảnh"
- it is merged into "Sức khỏe & phát triển"

---

## 5. Cap Fund Tests

### TC-CAP-001 — Health fund below cap

Health fund current = 300, cap = 700.

Expected:

- contribution active

### TC-CAP-002 — Health fund reaches cap

Health fund current = 700, cap = 700.

Expected:

- contribution stops or follows reallocation rule
- warning/note visible

### TC-CAP-003 — Liquidity fund reaches cap

Same expected as health fund.

---

## 6. Child Engine Tests

### TC-CH-001 — Before child birth

Child birth: 2031-01  
Period: 2030-12

Expected:

- childCost inactive
- childCost = 0

### TC-CH-002 — Child birth month

Period: 2031-01

Expected:

- childCost active
- childAge = 0

### TC-CH-003 — Premium lifestyle cap

Lifestyle premium cap = 35tr/month.

Expected:

- totalMonthly <= 35 unless user override explicitly allows more

### TC-CH-004 — University not unrealistic

Period when child age 18.

Expected:

- default university cost in reasonable VN range
- not 63tr/month unless user selects international/du học

### TC-CH-005 — Post-grad support decreases

Ages:

- 22 → 10
- 23 → 7
- 24 → 5
- 25 → 0

---

## 7. Cashflow Tests

### TC-CF-001 — Child cost is not subtracted from investment directly

Expected:

- budget has child category
- investment category determined by budget ratio/schedule
- no formula investment - childCost

### TC-CF-002 — Deficit warning

If expenses > income.

Expected:

- warning visible
- no crash

---

## 8. Housing Event Tests

### TC-HO-001 — Buy property from cash

Event:

- buy property 3.5 tỷ
- source cash
- affectsNetWorth true

Expected:

- cash/investment balance decreases
- property asset increases
- net worth impact depends on asset recognition

### TC-HO-002 — After house owned rent zero

If hasHouse true after event.

Expected:

- rent = 0 if rule configured

---

## 9. Portfolio Tests

### TC-PF-001 — Expected return used if no actual

Asset expected 8%.

Expected:

- monthly return approx 8/12 percent

### TC-PF-002 — Actual return overrides expected

Actual return for year = -20%.

Expected:

- use -20%, not expected return

### TC-PF-003 — Balance override

If user inputs actual balance.

Expected:

- engine uses actual balance as base from that period

### TC-PF-004 — PnL calculated

Expected:

```txt
pnl = (beginning + contribution * 0.5) * return
```

---

## 10. Projection Tests

### TC-PR-001 — Projection recalculates when start month changes

Change start from 10/2026 to 01/2027.

Expected:

- monthly rows change
- yearly table changes
- dashboard updates

### TC-PR-002 — Projection yearly aggregation

Expected:

- table rows per year
- monthly data still source

### TC-PR-003 — Real value calculation

With inflation 4%.

Expected:

- real net worth < nominal net worth over time

---

## 11. FIRE Tests

### TC-FR-001 — FIRE target

Expense = 50tr/month.

Expected:

- annual = 600
- target = 15,000tr

### TC-FR-002 — No hardcoded FIRE year

Expected:

- FIRE date derived from projection crossing target

### TC-FR-003 — FIRE future inflation

Expected:

- future FIRE target uses future expense

---

## 12. Scenario Tests

### TC-SC-001 — Base scenario no child

Expected:

- child cost 0
- no 2035 scenario

### TC-SC-002 — Child 2031 scenario

Expected:

- child active from 2031
- same engines used

### TC-SC-003 — Scenario overrides income

Expected:

- base unchanged
- scenario projection changes

---

## 13. UI Stability Tests

### TC-UI-001 — Empty chart data

Expected:

- empty state, no crash

### TC-UI-002 — Old LocalStorage schema

Expected:

- migrate or reset
- no white screen

### TC-UI-003 — Undefined categories

Expected:

- defensive component
- no crash

### TC-UI-004 — Mobile layout

Expected:

- sidebar usable
- tables scroll horizontally

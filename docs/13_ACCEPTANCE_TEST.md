# 13 — ACCEPTANCE TEST

## 1. Definition of Done

Một tính năng chỉ hoàn thành khi:

- build pass
- không console error nghiêm trọng
- không NaN trên UI
- không undefined crash
- dùng đúng engine
- không hardcode số tiền
- UI responsive
- warning hiển thị rõ
- LocalStorage không làm trắng màn hình

---

## 2. Global Acceptance Checklist

### Architecture

- [ ] UI không tính toán tài chính
- [ ] Engine không phụ thuộc React
- [ ] Dashboard chỉ render engine output
- [ ] Scenario dùng same engines
- [ ] Projection chạy monthly, aggregate yearly

### Data

- [ ] Income có effective month/year
- [ ] Budget ratio có effective month/year
- [ ] Default allocation là ratio
- [ ] Không còn category "Tài sản phụ & hình ảnh"
- [ ] Không còn scenario child 2035

### Validation

- [ ] Ratio total warning
- [ ] Deficit warning
- [ ] Empty state for chart/table
- [ ] LocalStorage migration
- [ ] No NaN

### Build

- [ ] npm run build pass
- [ ] TypeScript pass
- [ ] No broken import

---

## 3. Page Acceptance

## 3.1 Dashboard

- [ ] Có selector tháng/năm
- [ ] KPI đọc từ engine
- [ ] Allocation bars đọc từ budgetEngine
- [ ] Net worth chart có tooltip
- [ ] FIRE progress không hardcode
- [ ] Warning hiển thị

## 3.2 Thu nhập theo thời gian

- [ ] Add/edit/delete income schedule
- [ ] Growth rate editable
- [ ] Effective date works
- [ ] Projection update realtime

## 3.3 Phân bổ ngân sách

- [ ] Ratio editable
- [ ] Amount auto derives from income
- [ ] Total ratio visible
- [ ] Warning if ratio != 100
- [ ] No fixed amount default
- [ ] No old "Tài sản phụ & hình ảnh"

## 3.4 Giai đoạn linh hoạt

- [ ] Add/edit/delete life stage
- [ ] From/to month-year
- [ ] Rent fixed/owned
- [ ] Food inflation + cap
- [ ] Health/liquidity cap
- [ ] Projection uses active stage

## 3.5 Projection

- [ ] Start/end month editable
- [ ] Table yearly
- [ ] Monthly source
- [ ] Event impact column
- [ ] Real value column
- [ ] FIRE target/progress
- [ ] Tooltip chart

## 3.6 Child 2031 Scenario

- [ ] Child active from 2031
- [ ] Child cost reasonable
- [ ] Child category separate
- [ ] No direct investment subtraction
- [ ] No 2035 scenario

## 3.7 Portfolio

- [ ] USD/Crypto/BĐS/Chứng khoán
- [ ] Target allocation
- [ ] Expected return
- [ ] Actual return override
- [ ] Contribution input
- [ ] PnL displayed

## 3.8 FIRE Center

- [ ] Rule 4% explanation
- [ ] FIRE target from expenses
- [ ] FIRE year from projection
- [ ] Monte Carlo probability
- [ ] P10/P50/P90 if available

## 3.9 Health & Final Rest

- [ ] Health fund cap
- [ ] Liquidity fund cap
- [ ] Medical inflation
- [ ] Final rest projection
- [ ] Readiness score

## 3.10 Knowledge Center

- [ ] 10 concepts
- [ ] Simple Vietnamese
- [ ] Family examples
- [ ] No long academic walls

---

## 4. Release Acceptance

Before release:

```bash
npm run build
```

Manual checks:

- [ ] Change income from 80 to 100 → investment changes from 32 to 40 if ratio 40%
- [ ] Change start month → projection changes
- [ ] Add child 2031 → projection changes
- [ ] Add buy house event → balances update
- [ ] Set health fund cap reached → contribution stops
- [ ] Import old JSON → no white screen

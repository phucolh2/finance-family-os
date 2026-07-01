# 06 — UI/UX SPEC

## 1. Design Philosophy

Family Financial OS phải có cảm giác:

- ấm áp
- dễ hiểu
- gia đình
- có chiều sâu
- không corporate lạnh lùng
- không giống app trading
- không giống dashboard BI khô cứng

Ứng dụng dành cho **hai vợ chồng cùng xem**, nên UI phải giúp người không chuyên tài chính vẫn hiểu được bức tranh.

---

## 2. Visual Identity

### 2.1 Tone

- Family-first
- Calm
- Warm
- Trustworthy
- Practical
- Explainable

### 2.2 Color Palette

Giữ template từ HTML prototype.

```css
:root {
  --bg: #fff8ef;
  --bg2: rgba(255,255,255,0.88);
  --bg3: #fff0dd;
  --bg4: #f7dec1;

  --border: rgba(125, 83, 45, 0.13);
  --border2: rgba(125, 83, 45, 0.20);

  --text: #2f241d;
  --text2: #6f5d50;
  --text3: #9c816d;

  --accent: #d97706;
  --accent2: #b45309;

  --green: #4d7c0f;
  --yellow: #f59e0b;
  --red: #dc2626;
  --purple: #8b5cf6;
  --teal: #0f766e;
}
```

### 2.3 Background

Nền nên dùng gradient nhẹ:

```css
background:
  radial-gradient(circle at top left, rgba(251,191,36,.22), transparent 32%),
  radial-gradient(circle at top right, rgba(244,114,182,.15), transparent 30%),
  linear-gradient(135deg, #fff8ef 0%, #fffdf8 48%, #f0fdf4 100%);
```

---

## 3. Typography

Recommended:

- Body: `Be Vietnam Pro`
- Display: `DM Serif Display` hoặc serif nhẹ cho heading

Fallback:

```css
font-family: "Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

Heading:

```css
font-family: "DM Serif Display", Georgia, serif;
```

---

## 4. Layout

### 4.1 App Shell

Desktop:

```txt
Sidebar 260px | Main content
```

Mobile:

```txt
Top nav / collapsible sidebar
Main content full width
```

### 4.2 Sidebar

Sidebar gồm:

1. Dashboard
2. Thu nhập theo thời gian
3. Phân bổ ngân sách
4. Lịch sử tỷ lệ ngân sách
5. Giai đoạn linh hoạt
6. Kịch bản gốc
7. Kịch bản có con 2031
8. Quản lý kịch bản
9. Dự phóng tài sản
10. Danh mục đầu tư
11. FIRE Center
12. Bệnh tật & hậu sự
13. Knowledge Center
14. Settings

Không hiển thị kịch bản có con 2035.

### 4.3 Main Content

Mỗi page có:

- PageHeader
- PageDescription
- KPI cards
- Main content section
- Warnings nếu có
- Footer helper text nếu cần

---

## 5. Core Components

### 5.1 PageHeader

Props:

```ts
type PageHeaderProps = {
  title: string
  subtitle?: string
  badge?: string
}
```

### 5.2 KPI Card

Props:

```ts
type KpiCardProps = {
  label: string
  value: string
  subLabel?: string
  icon?: ReactNode
  tone?: "blue" | "green" | "yellow" | "purple" | "red" | "teal"
  warning?: boolean
}
```

Rule:

- KPI card chỉ render value đã được engine tính.
- Không tính toán trong card.

### 5.3 BudgetAllocationBars

Props:

```ts
type BudgetAllocationBarsProps = {
  categories: BudgetCategoryOutput[]
  incomeMonthly: number
}
```

Rules:

- Không hardcode category.
- Không hardcode amount.
- Nếu categories rỗng → empty state.
- Nếu tổng ratio != 100 → warning.

### 5.4 BudgetDetailTable

Columns:

- Nhóm
- Danh mục
- Tỷ lệ
- Số tiền/tháng
- Số tiền/năm
- Rule type
- Cap
- Trạng thái

### 5.5 ProjectionTable

Columns:

- Năm
- Tuổi chồng
- Tuổi vợ
- Thu nhập tháng cuối năm
- Tổng thu nhập năm
- Tổng chi phí năm
- Đầu tư TB/tháng
- Tiết kiệm TB/tháng
- Số dư đầu tư
- Số dư tiết kiệm
- Biến động sự kiện
- Net Worth
- Sức mua hiện tại
- FIRE Target
- FIRE Progress
- Ghi chú

### 5.6 WarningBox

Types:

- info
- warning
- danger
- success

Warnings không được chỉ console. Các warning tài chính phải hiển thị cho user.

---

## 6. Chart UX

Use Recharts.

All charts must have:

- Tooltip
- Legend if multiple lines
- ResponsiveContainer
- Empty state
- Human-friendly number formatting

### 6.1 Net Worth Chart

Lines:

- Net worth danh nghĩa
- Sức mua hiện tại
- FIRE target

### 6.2 Cashflow Chart

Bars:

- Income
- Expenses
- Investment
- Saving

### 6.3 Portfolio Chart

Pie:

- USD
- Crypto
- Bất động sản
- Chứng khoán

Line:

- Portfolio value over time
- PnL by year

### 6.4 FIRE Chart

- FIRE progress
- Probability distribution
- P10/P50/P90 year

---

## 7. Input UX

Inputs phải rõ tháng hiệu lực.

### 7.1 Effective Date Row

Mỗi schedule row cần:

- Effective month
- Effective year
- Value
- Growth / ratio / note

### 7.2 Inline Editing

Cho phép chỉnh trực tiếp:

- incomeMonthly
- incomeGrowthRateAnnual
- budget ratio
- allocation cap
- asset return
- actual return
- actual contribution

### 7.3 Save Behavior

MVP:

- Auto-save LocalStorage
- Manual Save button
- Reset default
- Export JSON
- Import JSON

---

## 8. Dashboard UX

Dashboard phải trả lời nhanh:

1. Hiện tại gia đình đang ổn không?
2. Mỗi tháng đầu tư bao nhiêu?
3. Có âm dòng tiền không?
4. Quỹ bình an đủ chưa?
5. FIRE progress bao nhiêu?
6. Con 2031 ảnh hưởng thế nào?
7. Tài sản tương lai ra sao?

Dashboard không được quá nhiều bảng.

Use:

- KPI grid
- allocation bars
- net worth chart
- warnings
- AI summary

---

## 9. Knowledge UX

Knowledge Center phải dùng ngôn ngữ dễ hiểu.

Mỗi concept:

- Tên
- Tác giả
- Ý nghĩa đơn giản
- Ứng dụng vào gia đình
- Ví dụ số
- Link nội bộ tới module liên quan

Ví dụ:

Rule 4% → link FIRE Center  
Modern Portfolio Theory → link Portfolio  
Life Cycle Hypothesis → link Projection

---

## 10. Accessibility

- Text contrast đủ
- Table readable
- Button focus state
- Mobile scroll tốt
- Không rely chỉ vào màu để thể hiện rủi ro
- Tooltip không chứa thông tin duy nhất

---

## 11. Responsive Rules

Mobile:

- Sidebar collapsible
- KPI cards 1 column
- Tables horizontal scroll
- Charts height tối thiểu 260px
- Inputs full width

Tablet:

- 2-column KPI
- Charts full width

Desktop:

- Sidebar + main grid

---

## 12. UI Acceptance Criteria

- Warm family-first theme preserved
- No cold corporate dashboard
- No hardcoded number in UI
- All charts have tooltip
- All tables have empty state
- All warnings visible
- Mobile usable
- No scenario 2035

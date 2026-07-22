---
name: impact-analysis
description: >
  Quy trình bắt buộc khi thực hiện bất kỳ thay đổi nào trong dự án Finance Family OS.
  Phân tích tác động (Impact Analysis), đồng bộ hóa module liên quan, và kiểm thử hồi quy (Regression Testing)
  trước khi commit. Dự án đang ở giai đoạn pre-release, mọi thay đổi phải được kiểm soát chặt chẽ.
---

# 🛡️ Impact Analysis & Regression Prevention

> **Giai đoạn: PRE-RELEASE** — Mọi thay đổi, dù nhỏ nhất, đều phải đi qua quy trình này.

## Mục đích

Đảm bảo mỗi lần chỉnh sửa code:
1. **Không phá vỡ** các module/trang đang hoạt động ổn định.
2. **Đồng bộ** các module có dữ liệu chung (shared state) khi thay đổi cấu trúc.
3. **Kiểm thử** tất cả thành phần liên quan trước khi commit/push.

---

## Bước 1: Xác định Phạm vi Thay đổi (Scope Identification)

Trước khi viết bất kỳ dòng code nào, xác định rõ:

- [ ] **File nào sẽ bị sửa?** Liệt kê cụ thể.
- [ ] **Thuộc Layer nào?** (Type → Engine → Hook → Component → Page)
- [ ] **Thay đổi thuộc loại gì?** (UI only / Logic / Data model / State)

---

## Bước 2: Phân tích Bản đồ Phụ thuộc (Dependency Map)

### 2.1 Kiến trúc Hệ thống (Architecture Layers)

Dự án tuân theo kiến trúc phân lớp chặt chẽ. Thay đổi ở lớp dưới sẽ ảnh hưởng lan rộng lên lớp trên:

```
Layer 0 (Nền tảng):  types/       → Định nghĩa interface, type
Layer 1 (Dữ liệu):  data/        → Default values, constants
Layer 2 (Nghiệp vụ): engines/    → Business logic, tính toán
Layer 3 (Trạng thái): hooks/     → State management (useAppState)
                      context/    → React Context (AppContext)
Layer 4 (Giao diện):  components/ → UI components
Layer 5 (Trang):      pages/     → Page-level compositions
```

> **Quy tắc vàng:** Thay đổi ở Layer N → PHẢI kiểm tra tất cả Layer N+1 trở lên.

### 2.2 Bản đồ Phụ thuộc Theo Module Chức năng

Dưới đây là bản đồ liên kết giữa các module. Khi thay đổi một module, BẮT BUỘC kiểm tra tất cả module có mũi tên `→` trỏ tới:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED STATE (useAppState)                   │
│  state.profile, state.incomeSchedule, state.budgetSchedule,    │
│  state.assets, state.assumptions, state.investmentDeals,       │
│  state.savingsDeposits, state.sinkingFunds, state.lifeEvents,  │
│  state.fundTransfers, state.debts, state.expenseSchedule,      │
│  state.lifeStages, state.projectionAdjustments                 │
└──────────────┬──────────────────────────────────────────────────┘
               │ (tất cả đều chảy qua)
               ▼
┌──────────────────────────┐
│   projectionEngine.ts    │ ◄── TRÁI TIM hệ thống
│   (runProjection)        │     Thay đổi ở đây ảnh hưởng MỌI THỨ
└──────────┬───────────────┘
           │
     ┌─────┼──────────┬──────────────┬──────────────┐
     ▼     ▼          ▼              ▼              ▼
Dashboard Portfolio  SavingsAndDebt CashflowQuadrant  FireCenter
     │     │          │              │              │
     │     ├─ ExpertPortfolioCharts  │              │
     │     ├─ PortfolioRadarChart    │              │
     │     ├─ SinkingFundModule ◄────┤              │
     │     ├─ SavingsDepositModule ◄─┤              │
     │     ├─ DebtLiabilityModule ◄──┤              │
     │     └─ TransferForm ◄─────────┤              │
     │                               │              │
     └── BudgetHistory               │              │
     └── IncomeSchedule ─────────────┘              │
     └── LifeStages ───────────────────────────────┘
```

### 2.3 Bảng Tra cứu Nhanh: Thay đổi → Ảnh hưởng

| Khi thay đổi...                        | PHẢI kiểm tra...                                                                 |
|-----------------------------------------|----------------------------------------------------------------------------------|
| `types/finance.ts`                      | **TẤT CẢ** engines, hooks, components, pages                                    |
| `types/portfolio.ts`                    | portfolioEngine, projectionEngine, Portfolio.tsx, ExpertPortfolioCharts, RadarChart, Settings (AssetAllocation) |
| `projectionEngine.ts`                   | **TẤT CẢ** pages (Dashboard, Portfolio, CashflowQuadrant, FireCenter, SavingsAndDebt, LifeStages) |
| `useAppState.ts` / `AppContext`         | **TẤT CẢ** components và pages sử dụng `useAppContext()`                        |
| `SinkingFundModule.tsx`                 | Portfolio.tsx, SavingsAndDebt.tsx, TransferForm.tsx (nguồn tiền dropdown)         |
| `SavingsDepositModule.tsx`              | Portfolio.tsx, SavingsAndDebt.tsx, TransferForm.tsx (nguồn tiền dropdown)         |
| `DebtLiabilityModule.tsx`               | SavingsAndDebt.tsx, TransferForm.tsx                                             |
| `TransferForm.tsx`                      | FundTransfers.tsx, projectionEngine (fundTransfers logic)                         |
| `investmentDeals` (state)               | Portfolio.tsx, TransferForm.tsx, projectionEngine, ExpertPortfolioCharts          |
| `assets` (state)                        | Portfolio.tsx, PortfolioRadarChart, ExpertPortfolioCharts, Settings.tsx, databaseResolver, monteCarloEngine |
| `budgetSchedule` (state)                | BudgetHistory.tsx, projectionEngine, Dashboard                                   |
| `incomeSchedule` (state)                | IncomeSchedule.tsx, projectionEngine, CashflowQuadrant, Dashboard                |
| `lifeEvents` (state)                    | EventLedger.tsx, projectionEngine, TransferForm (nguồn sự kiện)                  |
| `assumptions` (state)                   | Settings.tsx, projectionEngine, SinkingFundModule, SavingsDepositModule           |
| `fundingSources.ts` (constants)         | SinkingFundModule, SavingsDepositModule, DebtLiabilityModule                     |
| `format.ts` (utils)                     | **TẤT CẢ** components hiển thị tiền tệ                                          |
| `math.ts` (utils)                       | Các engine tính toán, SinkingFundModule, SavingsDepositModule                    |
| `defaultInputs.ts`                      | useAppState (initial state), migration.ts, Settings.tsx                           |
| `migration.ts`                          | useAppState (import/load), Settings.tsx (import/reset)                            |

---

## Bước 3: Thực hiện Thay đổi (Implementation)

### Nguyên tắc bắt buộc:

1. **Sửa từ dưới lên:** Nếu thay đổi liên quan nhiều Layer, bắt đầu từ Layer thấp nhất (types → engines → hooks → components → pages).
2. **Giữ nguyên contract:** Khi sửa function signature hoặc interface, kiểm tra TẤT CẢ nơi gọi hàm đó.
3. **Đồng bộ format:** Nếu thay đổi cách hiển thị tiền tệ/số liệu ở một module, kiểm tra TẤT CẢ module khác có hiển thị tương tự.
4. **Đồng bộ selectedPeriodKey:** Mọi module tính toán theo thời gian PHẢI đọc `selectedPeriodKey` từ Context thay vì dùng `new Date()`. Đây là lỗi đã xảy ra nhiều lần.
5. **Đồng bộ Dropdown:** Khi thêm/sửa/xoá một loại tài sản hoặc quỹ, PHẢI cập nhật dropdown nguồn tiền ở TransferForm.tsx, SinkingFundModule.tsx, SavingsDepositModule.tsx.

---

## Bước 4: Kiểm thử Hồi quy (Regression Testing)

### 4.1 Build Check (Bắt buộc)

```bash
npm run build
```

Nếu build thất bại → **KHÔNG ĐƯỢC commit**. Fix hết lỗi TypeScript trước.

### 4.2 Kiểm thử Chức năng Theo Module

Dựa trên Bảng Tra cứu ở Bước 2, chạy kiểm thử cho TẤT CẢ module bị ảnh hưởng:

**Checklist kiểm thử cho từng nhóm chức năng:**

#### 📊 Dashboard
- [ ] Biểu đồ Tổng quan tài sản hiển thị đúng
- [ ] Số liệu tóm tắt khớp với dữ liệu chi tiết từng module
- [ ] Slider thời gian (ObservationControls) hoạt động đúng

#### 💰 Portfolio (Danh mục Đầu tư)
- [ ] Biểu đồ Pie/Radar phản ánh đúng tỷ trọng thực tế vs mục tiêu
- [ ] SinkingFundModule: Tạo/Sửa/Xóa quỹ hoạt động đúng
- [ ] SinkingFundModule: Số dư = Vốn ban đầu + Phân bổ tích luỹ + Lãi
- [ ] SinkingFundModule: Giải ngân đầu tư chuyển đúng sang thương vụ
- [ ] Thương vụ đầu tư: Tạo/Tất toán hoạt động đúng
- [ ] Nguồn tiền dropdown không bị trùng lặp (duplicate)

#### 🏦 Tiết kiệm & Nợ (SavingsAndDebt)
- [ ] SavingsDepositModule: Mở/Tất toán sổ tiết kiệm đúng
- [ ] SavingsDepositModule: Tính lãi suất đúng theo kỳ hạn
- [ ] DebtLiabilityModule: Hiển thị và quản lý nợ đúng
- [ ] Nguồn tiền dropdown đồng bộ với Portfolio

#### 🔄 Điều chuyển Dòng tiền (TransferForm)
- [ ] Dropdown Nguồn (TỪ) và Đích (ĐẾN) hiển thị đồng nhất
- [ ] Số dư khả dụng cập nhật đúng theo thời gian quan sát
- [ ] Chuyển tiền thành công không phá vỡ cân bằng tổng

#### 📈 Dòng tiền & Thu nhập
- [ ] IncomeSchedule: Thêm/sửa/xoá mốc thu nhập đúng
- [ ] CashflowQuadrant: Biểu đồ tứ phân vị khớp dữ liệu
- [ ] BudgetHistory: Lịch sử ngân sách hiển thị đúng

#### ⚙️ Cấu hình Hệ thống (Settings)
- [ ] Asset Allocation Target: Chỉnh tỷ trọng → Radar Chart cập nhật
- [ ] Income Categories: Thêm/sửa/xoá danh mục thu nhập
- [ ] Assumptions: Lãi suất không kỳ hạn áp dụng đúng
- [ ] Import/Export: Dữ liệu backup/restore không mất mát
- [ ] Reset: Khôi phục mặc định không lỗi

### 4.3 Kiểm thử Xuyên Module (Cross-Module)

- [ ] Kéo Slider thời gian từ đầu → cuối: Tất cả số liệu biến thiên mượt mà, không có giá trị NaN, Infinity, hoặc nhảy số bất thường.
- [ ] Tạo quỹ mới ở SinkingFundModule → Quỹ xuất hiện đúng trong dropdown nguồn tiền ở TransferForm.
- [ ] Tất toán sổ tiết kiệm → Tiền quay về đúng nơi và cân bằng tổng tài sản.
- [ ] Thay đổi asset allocation ở Settings → Radar Chart ở Portfolio cập nhật ngay.

---

## Bước 5: Commit & Push

### Template Commit Message

```
<type>(<scope>): <mô tả ngắn>

Impact Analysis:
- Affected: <danh sách module bị ảnh hưởng>
- Synced: <danh sách module đã đồng bộ>
- Tested: <danh sách module đã kiểm thử>
```

**Ví dụ:**
```
fix(SinkingFundModule): Sync getFundBalance with selectedPeriodKey

Impact Analysis:
- Affected: SinkingFundModule, Portfolio.tsx, TransferForm
- Synced: SavingsDepositModule (cùng pattern time-sync)
- Tested: Portfolio page, SavingsAndDebt page, TransferForm dropdown
```

---

## Phụ lục: Các Lỗi Đã Từng Xảy Ra (Lessons Learned)

Danh sách các lỗi thực tế đã xảy ra trong dự án để cảnh giác:

| # | Lỗi                                                  | Nguyên nhân gốc                              | Module bị ảnh hưởng                    |
|---|-------------------------------------------------------|----------------------------------------------|----------------------------------------|
| 1 | Nguồn tiền dropdown bị trùng lặp (duplicate options) | Nhiều module cùng duyệt mảng nhưng filter khác nhau | SinkingFundModule, SavingsDepositModule |
| 2 | Số dư hiển thị 0 khi quan sát tháng tương lai        | Dùng `new Date()` thay vì `selectedPeriodKey` | SinkingFundModule, SavingsDepositModule |
| 3 | Tiền lãi không kỳ hạn tính sai                       | Dùng `initMonth/initYear` thay vì observed month | SinkingFundModule                      |
| 4 | Số dư nguồn hiển thị "X Tr Tr" (lặp đơn vị)         | Nối chuỗi thủ công + hàm format đã có sẵn đơn vị | TransferForm                           |
| 5 | Dropdown Nguồn vs Đích dùng từ ngữ không đồng nhất   | Viết text ad-hoc không theo quy chuẩn        | TransferForm                           |
| 6 | Vốn ban đầu quỹ nhập vào nhưng không hiển thị trên card | UI card thiếu trường hiển thị            | SinkingFundModule                      |
| 7 | Tỷ trọng mục tiêu hardcode, người dùng không chỉnh được | Thiếu UI cấu hình trong Settings          | Settings, PortfolioRadarChart           |

---

## Quy tắc Tối thượng

> **"Không có thay đổi nào là quá nhỏ để bỏ qua kiểm tra."**
>
> Trong giai đoạn pre-release, mỗi commit phải đảm bảo:
> 1. ✅ Build thành công (`npm run build`)
> 2. ✅ Tất cả module liên quan đã được kiểm tra
> 3. ✅ Không có regression ở module không liên quan
> 4. ✅ Dữ liệu đồng bộ xuyên suốt toàn bộ ứng dụng

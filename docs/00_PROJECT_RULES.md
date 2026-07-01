# 00 — PROJECT RULES

Tài liệu này là luật tối cao của dự án.

## 1. Product identity

Family Financial OS là Financial Digital Twin, Family Wealth Planner, Life Event Simulator, Scenario Engine và AI-assisted decision system.

Không phải app ghi chép chi tiêu đơn giản.

## 2. Architecture rules

### R-001 — Timeline-first

Tất cả mô phỏng chạy theo tháng. Bảng năm chỉ là aggregate từ monthly rows.

### R-002 — Effective-dated input

Income, budget ratio, life stage, portfolio allocation, insurance, assumptions đều phải có tháng/năm hiệu lực.

### R-003 — Engine-based

UI chỉ render. Engine mới tính.

### R-004 — Single source of truth

Một công thức chỉ tồn tại một nơi. FIRE target chỉ ở fireEngine. Child cost chỉ ở childEngine/budget integration.

### R-005 — Data-driven categories

Category không hardcode trong component.

## 3. Financial rules

### R-101 — Default allocation is ratio-based

Sau khi gộp “Tài sản phụ & hình ảnh” vào “Sức khỏe & phát triển”, default groups:

| Group | Default Ratio |
|---|---:|
| Nhà cửa & sinh hoạt cơ bản | 29% |
| Tương lai & đầu tư | 40% |
| Bình an & dự phòng | 10% |
| Gia đình & trải nghiệm | 11% |
| Sức khỏe & phát triển | 10% |

Tổng = 100%.

Công thức: `amountMonthly = incomeMonthly * ratioPercent / 100`.

### R-102 — No fixed default amount

Không default 23.2tr, 32tr, 8tr... Các số này chỉ là kết quả khi income = 80tr.

### R-103 — Child cost is category

Chi phí con là category riêng, không trừ trực tiếp từ investment.

### R-104 — Cap funds stop contributing

Quỹ y tế/quỹ thanh khoản đạt cap thì contribution = 0 hoặc chuyển theo rule.

## 4. Validation rules

- Không NaN
- Không undefined crash
- Ratio tổng khác 100% phải warning
- Allocation vượt income phải warning âm dòng tiền
- Chart/table rỗng phải có empty state

## 5. LocalStorage rules

- Có schemaVersion
- Có migration
- Nếu migrate fail thì reset default an toàn

## 6. AI coding rules

- Audit trước khi code
- Fix tối thiểu đúng nguyên nhân
- Chạy `npm run build` sau mỗi phase
- Không rewrite toàn app khi bugfix

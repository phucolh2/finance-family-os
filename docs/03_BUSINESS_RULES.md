# 03 — BUSINESS RULES

## Timeline rules

### BR-001
Mọi calculation chạy theo monthly timeline.

### BR-002
Yearly table là aggregation từ monthly data.

## Income rules

### BR-101
Thu nhập là IncomeSchedule có effectiveMonth/effectiveYear.

### BR-102
incomeEngine lấy dòng hiệu lực gần nhất nhưng không vượt quá tháng đang tính.

### BR-103
Growth annual được áp dụng theo tháng sau effective date.

## Budget rules

### BR-201
Budget ratio cũng là schedule có effective date.

### BR-202
Default groups:

| Group | Ratio |
|---|---:|
| Nhà cửa & sinh hoạt cơ bản | 29% |
| Tương lai & đầu tư | 40% |
| Bình an & dự phòng | 10% |
| Gia đình & trải nghiệm | 11% |
| Sức khỏe & phát triển | 10% |

### BR-203
Amount = incomeMonthly × ratioPercent / 100.

### BR-204
Không lưu số tiền default cố định.

### BR-205
Tổng ratio khác 100% phải warning.

## Cap rules

### BR-301
Quỹ thanh khoản nằm trong Bình an & dự phòng, đạt cap thì dừng góp.

### BR-302
Quỹ y tế nằm trong Bình an & dự phòng, đạt cap thì dừng góp.

## Housing rules

### BR-401
Rent có thể fixed theo life stage.

### BR-402
Nếu hasHouse=true, rent có thể về 0.

### BR-403
Mua BĐS giảm cash nhưng tăng property asset; net worth không nhất thiết giảm.

## Child rules

### BR-501
Sinh con là event hoặc childConfig.

### BR-502
Child cost là category riêng.

### BR-503
Không được lấy investment - childCost.

### BR-504
Lifestyle bands:

| Lifestyle | Monthly Cost |
|---|---:|
| Bình dân | 8–12tr |
| Khá | 15–20tr |
| Cao vừa phải | 25–35tr |
| Quốc tế/du học | 40–80tr |

Default: Cao vừa phải, cap 35tr/tháng, không mặc định RMIT/du học.

## Portfolio rules

Assets MVP: USD, Crypto, Bất động sản, Chứng khoán.

Nếu có actual return/balance thì dùng actual; nếu không thì dùng expected.

## FIRE rules

FIRE Target = Annual Expense / Withdrawal Rate. Default withdrawal = 4%.

FIRE year không được hardcode.

## Scenario rules

Scenario = input overrides + same engines. Không có kịch bản con 2035.

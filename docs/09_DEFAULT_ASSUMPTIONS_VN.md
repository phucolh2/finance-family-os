# 09 — DEFAULT ASSUMPTIONS VN

## 1. Purpose

Tài liệu này định nghĩa các giả định mặc định cho bối cảnh Việt Nam.

Quan trọng: đây chỉ là default có thể chỉnh. Không được hardcode như chân lý.

---

## 2. Currency

MVP dùng:

```txt
VND million
```

Ví dụ:

- 80 = 80 triệu VND
- 3,500 = 3.5 tỷ VND

---

## 3. Inflation Assumptions

| Item | Default |
|---|---:|
| General living inflation | 4%/year |
| Medical inflation | 6%/year |
| Education inflation | 6%/year |
| Final rest inflation | 5%/year |
| Housing/rent inflation | 4%/year |

### Notes

Các giả định này nên có input trong Settings.

Không được khóa cứng.

---

## 4. Income Growth

Default:

| Item | Default |
|---|---:|
| Family income growth | 5%/year |

User có thể tạo income schedule mới từ tháng hiệu lực khác.

---

## 5. Budget Ratios

Sau khi gộp "Tài sản phụ & hình ảnh" vào "Sức khỏe & phát triển":

| Group | Default Ratio |
|---|---:|
| Nhà cửa & sinh hoạt cơ bản | 29% |
| Tương lai & đầu tư | 40% |
| Bình an & dự phòng | 10% |
| Gia đình & trải nghiệm | 11% |
| Sức khỏe & phát triển | 10% |

Tổng = 100%.

---

## 6. Budget Group Meaning

### Nhà cửa & sinh hoạt cơ bản

Bao gồm:

- thuê nhà
- ăn uống
- điện nước
- internet
- mobile
- đi lại
- sinh hoạt gia đình

### Tương lai & đầu tư

Bao gồm:

- chứng khoán
- USD
- Crypto
- BĐS
- quỹ mua nhà
- các tài sản tăng trưởng

### Bình an & dự phòng

Bao gồm:

- quỹ thanh khoản
- quỹ y tế
- quỹ bệnh nặng
- BHYT
- bảo hiểm sức khỏe
- khẩn cấp gia đình

### Gia đình & trải nghiệm

Bao gồm:

- cha mẹ hai bên
- lễ tết
- sinh nhật
- sự kiện
- du lịch
- hẹn hò
- trải nghiệm cùng con

### Sức khỏe & phát triển

Bao gồm:

- thể thao
- gym/yoga
- khám định kỳ
- vitamin
- học tập
- tiếng Anh
- AI/tools
- sách
- khóa học
- self-care
- quần áo
- chăm sóc ngoại hình

---

## 7. Child Cost Assumptions

Lifestyle bands:

| Lifestyle | Monthly Cost |
|---|---:|
| Bình dân | 8–12 |
| Khá | 15–20 |
| Cao vừa phải | 25–35 |
| Quốc tế/du học | 40–80 |

Default:

```txt
Cao vừa phải
Cap = 35 triệu/tháng
```

Không mặc định:

- RMIT
- VinUni
- du học
- 63 triệu/tháng đại học

Đại học VN chất lượng:

```txt
15–25 triệu/tháng
```

---

## 8. Health Fund Assumptions

Default:

| Fund | Cap |
|---|---:|
| Liquidity fund | 700 triệu |
| Health fund | 700 triệu |

Nếu đạt cap:

- stop contribution
- hoặc user chọn chuyển phần contribution sang đầu tư

---

## 9. Portfolio Assumptions

Default asset classes:

| Asset | Example Expected Return |
|---|---:|
| USD | 2–4% |
| Crypto | 10–20% high volatility |
| Bất động sản | 6–10% |
| Chứng khoán | 8–12% |

Không được xem expected return là chắc chắn.

Portfolio Engine phải cho actual override.

---

## 10. FIRE Assumptions

Default withdrawal rate:

```txt
4%/year
```

Formula:

```txt
FIRE Target = Annual Expenses / 4%
```

Ví dụ:

```txt
Chi phí 50tr/tháng
= 600tr/năm
FIRE target = 600 / 0.04 = 15 tỷ
```

---

## 11. Monte Carlo Defaults

MVP defaults:

| Input | Default |
|---|---:|
| simulations | 1,000 |
| return mean | portfolio weighted return |
| return volatility | 15% |
| inflation mean | 4% |
| inflation volatility | 2% |

All editable.

---

## 12. Important Rule

All assumptions must be editable.

No assumption should be hidden hardcode.

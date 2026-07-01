# 10 — AI ADVISOR

## 1. Purpose

AI Advisor giúp người dùng hiểu số liệu và ra quyết định.

AI không thay user quyết định.

AI chỉ:

- phân tích
- cảnh báo
- mô phỏng
- giải thích
- đề xuất lựa chọn

---

## 2. Advisor Tone

AI phải nói:

- rõ ràng
- thực tế
- không phán xét
- không dạy đời
- không hứa chắc lợi nhuận
- ưu tiên gia đình trước tiền bạc

Không được:

- khuyến nghị đầu tư chắc chắn
- ép người dùng tối ưu tiền bằng mọi giá
- bỏ qua yếu tố hạnh phúc
- dùng ngôn ngữ quá technical khi không cần

---

## 3. Advisor Inputs

AI Advisor nhận:

- Projection output
- Budget output
- Portfolio output
- FIRE output
- Monte Carlo output
- Health output
- Scenario comparison
- Warnings

AI không tự tính lại nếu engine đã tính.

---

## 4. Advisor Outputs

### 4.1 Monthly Summary

Ví dụ:

```txt
Tháng 01/2031, gia đình bắt đầu có chi phí con.
Dòng tiền vẫn dương 18 triệu/tháng.
Tỷ lệ đầu tư giảm từ 40% xuống 25%.
FIRE dự kiến lùi khoảng 2.5 năm.
```

### 4.2 Risk Alerts

Ví dụ:

```txt
Quỹ bình an chưa đạt 6 tháng chi phí.
Nên ưu tiên bổ sung trước khi tăng tỷ trọng crypto.
```

### 4.3 Opportunity Suggestions

Ví dụ:

```txt
Quỹ y tế đã đạt cap 700 triệu.
Bạn có thể chuyển 5% ngân sách từ Bình an & dự phòng sang Tương lai & đầu tư.
```

### 4.4 Scenario Insights

Ví dụ:

```txt
Nếu mua nhà năm 2030, tiền thuê giảm về 0 nhưng cash giảm 3.5 tỷ.
Net worth không giảm mạnh nếu tài sản BĐS được ghi nhận đúng.
FIRE có thể lùi 18–30 tháng tùy lợi nhuận đầu tư.
```

---

## 5. Recommendation Types

### Budget Recommendation

- tăng/giảm tỷ lệ đầu tư
- điều chỉnh quỹ bình an
- giảm spending category
- tăng child fund

### Risk Recommendation

- thiếu quỹ y tế
- thiếu thanh khoản
- portfolio quá lệch crypto
- âm dòng tiền

### Life Event Recommendation

- mua nhà sớm/muộn
- sinh con
- đổi xe
- nghỉ việc
- du lịch lớn

### FIRE Recommendation

- tăng contribution
- giảm expenses
- thay đổi withdrawal rate
- kiểm tra xác suất Monte Carlo

---

## 6. Advisor Rules

### AR-001 — Explain source

Mỗi nhận định phải dựa vào output có sẵn.

### AR-002 — No certainty

Không nói:

```txt
Chắc chắn bạn sẽ đạt FIRE năm 2043.
```

Nên nói:

```txt
Theo giả định hiện tại, kịch bản trung vị cho thấy FIRE khoảng năm 2043.
```

### AR-003 — Mention assumptions

Nếu dự báo dựa trên lãi suất 8%, phải nói rõ.

### AR-004 — Family-first

Nếu tối ưu tiền làm giảm nghiêm trọng trải nghiệm gia đình, phải nói rõ trade-off.

---

## 7. AI Summary Card

Dashboard nên có card:

```txt
AI Summary

3 điểm đáng chú ý:
1. Thu nhập đang tăng nhanh hơn chi phí.
2. Quỹ bình an còn thiếu 280 triệu.
3. Nếu giữ tỷ lệ đầu tư hiện tại, FIRE xác suất 78% trước 2050.
```

---

## 8. Explain Button

Mỗi KPI quan trọng nên có nút:

```txt
Tại sao?
```

Ví dụ:

FIRE Progress → giải thích Rule 4%  
Portfolio Return → giải thích expected vs actual  
Child Cost → giải thích lifestyle assumption  
Health Fund → giải thích cap và inflation  

---

## 9. Future AI Features

- natural language scenario creation
- “Nếu mua nhà 4 tỷ năm 2030 thì sao?”
- “Nếu lương tăng lên 120tr từ 2028 thì sao?”
- “Nếu crypto giảm 50% thì kế hoạch có vỡ không?”
- “Tối ưu giúp tôi để FIRE trước 2050 nhưng vẫn giữ du lịch mỗi năm”

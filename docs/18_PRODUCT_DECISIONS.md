# 18 — PRODUCT DECISIONS

Tài liệu này lưu các quyết định sản phẩm quan trọng để AI không lặp lại lỗi cũ.

---

## Decision 001 — Remove Child 2035 Scenario

### Status

Accepted

### Context

Ban đầu app có kịch bản sinh con 2035.

User đã quyết định loại bỏ.

### Decision

Không còn kịch bản sinh con 2035 ở:

- sidebar
- dashboard
- scenario compare
- code
- docs
- default data

### Reason

Gia đình tập trung vào mục tiêu sinh con tuổi Hợi năm 2031.

---

## Decision 002 — Budget Default Uses Ratios, Not Amounts

### Status

Accepted

### Context

Có lỗi khi fallback allocation dùng số tiền cố định như 23.2tr, 32tr.

### Decision

Default chỉ lưu tỷ lệ.

Amount = income * ratio / 100.

### Reason

Nếu income đổi từ 80 lên 100, amount phải đổi tương ứng.

---

## Decision 003 — Merge "Tài sản phụ & hình ảnh"

### Status

Accepted

### Context

Nhóm "Tài sản phụ & hình ảnh" gây mơ hồ.

### Decision

Gộp vào "Sức khỏe & phát triển".

### New Default Groups

- Nhà cửa & sinh hoạt cơ bản: 29%
- Tương lai & đầu tư: 40%
- Bình an & dự phòng: 10%
- Gia đình & trải nghiệm: 11%
- Sức khỏe & phát triển: 10%

---

## Decision 004 — Child Cost Is Not Subtracted from Investment

### Status

Accepted

### Context

Có lỗi logic lấy 32tr đầu tư trừ chi phí con.

### Decision

Child cost là budget category riêng.

Cashflow phải tính từ toàn bộ phân bổ ngân sách.

### Reason

Gia đình có thể tái phân bổ nhiều nhóm, không chỉ đầu tư.

---

## Decision 005 — Projection Runs Monthly

### Status

Accepted

### Context

Bảng hiển thị theo năm, nhưng cần tính chính xác theo tháng.

### Decision

Projection chạy monthly, aggregate yearly.

### Reason

Income, budget, event đều có tháng hiệu lực.

---

## Decision 006 — Dashboard Does Not Calculate

### Status

Accepted

### Decision

Dashboard chỉ render engine output.

### Reason

Tránh mỗi màn hình một kiểu tính.

---

## Decision 007 — Warm Family UI

### Status

Accepted

### Decision

Giữ template màu kem/cam/ấm áp từ HTML prototype.

### Reason

Ứng dụng dùng cho gia đình, không phải trading terminal.

---

## Decision 008 — Local-first MVP

### Status

Accepted

### Decision

MVP dùng LocalStorage.

### Future

Supabase/PostgreSQL cho cloud sync.

---

## Decision 009 — AI Advisor Explains, Does Not Decide

### Status

Accepted

### Decision

AI chỉ phân tích, cảnh báo, mô phỏng.

Không quyết định thay user.

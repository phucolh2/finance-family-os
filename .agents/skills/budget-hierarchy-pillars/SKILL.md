---
name: budget-hierarchy-pillars
description: Kim chỉ nam bắt buộc về Hệ thống Ngân sách 4 Trụ cột (Budget Hierarchy Pillars). Yêu cầu đọc và hiểu rõ trước khi làm việc với UI/logic liên quan đến dòng tiền.
---

# Bối cảnh & Kim Chỉ Nam (Compass)

Dự án **Finance Family OS** được xây dựng dựa trên nguyên lý cốt lõi: **Hệ thống Ngân sách 4 Trụ cột (4 Pillars)**.
Bất kỳ thành phần giao diện (UI), báo cáo, biểu đồ, hay logic tính toán (Engine) nào xử lý dòng tiền đều **bắt buộc** phải phân tách và hiển thị đủ 4 trụ cột này. 

## 1. Bốn Trụ cột (Level 1 - Cao nhất và Cố định)
Đây là các `classification` gốc rễ. Người dùng **KHÔNG** thay đổi được Level 1 về mặt logic cốt lõi. Bất kỳ khoản tiền nào được phân bổ đều phải chảy vào 1 trong 4 trụ cột này và đổ về các màn hình đích (Target Screens) tương ứng:

1. **Chi phí (Expense)** - `classification: 'expense'`
   - Điểm đến (Target Screen): **Sự kiện cuộc đời** (id: `life_stages`)
   - Dành cho sinh hoạt cơ bản, chăm lo ông bà, sức khỏe, yêu thương & sự kiện...
   - Màu hiển thị: **Đỏ (Red)** `#f87171`
2. **Đầu tư (Investment)** - `classification: 'investment'`
   - Điểm đến (Target Screen): **Danh mục đầu tư** (id: `portfolio`)
   - Dành cho tích lũy tài sản dài hạn, mua nhà, chứng khoán, crypto...
   - Màu hiển thị: **Xanh dương (Blue)** `#3b82f6`
3. **Tiết kiệm (Savings)** - `classification: 'savings'`
   - Điểm đến (Target Screen): **Tiết kiệm** (id: `savings`)
   - Dành cho gửi tiết kiệm an toàn, quỹ con cái, quỹ khẩn cấp...
   - Màu hiển thị: **Xanh lá (Emerald)** `#10b981`
4. **Dự phòng / Chưa phân bổ (Reserve)** - `classification: 'debt_reserve'`
   - Điểm đến (Target Screen): **Quỹ Dự phòng** (id: `reserves`)
   - Dành cho dòng tiền linh động, dòng tiền dôi ra ngoài dự kiến, tiền mặt chờ phân bổ, hoặc người dùng cố tình tạo ra để làm Quỹ Dự Phòng rỗng chờ tiền tràn vào.
   - Khi một Nhóm cấp 1 (Root node) KHÔNG được gán nhãn chủ động (nghĩa là gán = rỗng/mặc định), hệ thống tự động quy nó về **Dự phòng (debt_reserve)**.
   - Màu hiển thị: **Cam Vàng (Amber)** `#f59e0b`

## 2. Các Nhóm và Hạng mục (Level 2, Level 3)
- Các tên nhóm như *"Nhà cửa & sinh hoạt cơ bản"*, *"Tương lai & đầu tư"*, *"Chăm lo Ông Bà"*, *"Tiết kiệm"*... chỉ là **tên gọi do người dùng tự đặt**. KHÔNG ĐƯỢC mặc định chúng luôn luôn có mặt trong hệ thống. (KHÔNG ĐƯỢC hardcode logic bằng tên nhóm).
- Người dùng có thể xóa, thêm mới, hoặc đổi tên bất kỳ Node Level 2/3 nào tùy thích.
- Điều quan trọng duy nhất là: Khi người dùng tạo một Nhóm Level 2, họ sẽ **gán một trong 4 Trụ cột (Classification)** cho nhóm đó.
- Nhóm con (Level 3) sẽ tự động kế thừa Trụ cột của Nhóm cha (Level 2), trừ phi người dùng cố tình "bẻ lái" gán Trụ cột khác cho nó.

## 3. Lỗi Đã Từng Xảy Ra (Bài học xương máu)
- **Lỗi 1 (Hallucination):** Agent tự động list ra các nhóm "Tiết kiệm 5% (Chỉ còn lại khoản biếu Cha mẹ)" dựa trên file `defaultInputs.ts`. **Sửa chữa:** Agent không bao giờ được khẳng định cơ cấu tỷ lệ ngân sách của user dựa trên Default Data, vì user CÓ QUYỀN TỰ TẠO CÂY NGÂN SÁCH (như trên UI họ tự tạo nhóm "Chăm lo Ông bà"). Phải yêu cầu user cung cấp/kiểm tra dữ liệu thực tế nếu cần.
- **Lỗi 2 (Missing Pillar):** UI của Biểu đồ bánh (Donut Chart) và thẻ KPI chỉ render 3 trụ cột Chi phí, Đầu tư, Tiết kiệm; bỏ quên mất Dự phòng. **Sửa chữa:** Luôn luôn đảm bảo mảng tính toán `data` của Recharts và lưới hiển thị UI render đủ 4 hạng mục (Chi phí, Đầu tư, Tiết kiệm, Dự phòng).
- **Lỗi 3 (Undefined fallback):** Khi UI lưu nhóm cấp 1 không có nhãn (undefined), hệ thống trước đây ngó lơ khoản tiền đó. **Sửa chữa:** Cả `budgetEngine.ts`, `BudgetDonutChart`, và `BudgetHistory` đều đã được code lại để ép `classification = undefined` trên Root Node trở thành `debt_reserve`. Giữ nguyên thiết kế này!

## 4. Hành Động Tiêu Chuẩn (SOP)
Bất kỳ lúc nào bạn cần động vào tính toán tổng (reduce) dòng tiền:
1. Luôn dùng vòng lặp cho **4 Classification** (expense, investment, savings, debt_reserve).
2. Khi map màu, luôn theo quy chuẩn Đỏ, Dương, Lá, Cam.
3. Không tự tin "đọc vẹt" cây ngân sách default, hãy coi nó chỉ là template mẫu.

# Project Rules

## UI/UX Rule: Info Tooltips on Charts and Modules
- **Requirement:** Tất cả các biểu đồ (charts), thành phần trực quan (visual components) và các module chức năng chính đều BẮT BUỘC phải có một biểu tượng dấu chấm hỏi (`HelpCircle` hoặc `Info` icon) nằm cạnh tiêu đề.
- **Tương tác:** Khi người dùng di chuột (hover) hoặc bấm (click) vào biểu tượng này, hệ thống phải hiển thị một Tooltip/Popover giải thích ý nghĩa của biểu đồ/module đó và hướng dẫn cách sử dụng, đọc hiểu dữ liệu.
- **Mục đích:** Mang lại trải nghiệm cao cấp (premium, đẳng cấp), giúp người dùng dễ dàng nắm bắt các khái niệm tài chính phức tạp mà không cần đọc tài liệu hướng dẫn riêng.
- **Thực thi:** Sử dụng component `HelpTooltip` đã có sẵn (hoặc tự xây dựng nếu chưa phù hợp) và tích hợp vào mọi component UI hiển thị dashboard, báo cáo.

## Pre-Release Rule: Impact Analysis & Regression Prevention
- **Requirement:** Trước MỌI thay đổi code (dù nhỏ nhất), BẮT BUỘC phải đọc và tuân theo quy trình trong Skill `impact-analysis` tại `.agents/skills/impact-analysis/SKILL.md`.
- **Quy trình bắt buộc:**
  1. **Xác định phạm vi** → File nào sẽ bị sửa, thuộc Layer nào.
  2. **Tra bản đồ phụ thuộc** → Xem bảng "Thay đổi → Ảnh hưởng" để biết module nào cần kiểm tra.
  3. **Đồng bộ module liên quan** → Nếu thay đổi ảnh hưởng nhiều module, sửa TẤT CẢ cho nhất quán.
  4. **Build check** → `npm run build` PHẢI thành công trước khi commit.
  5. **Kiểm thử hồi quy** → Verify tất cả module bị ảnh hưởng vẫn hoạt động đúng.
- **Mục đích:** Dự án đang ở giai đoạn pre-release. Không cho phép regression. Mỗi commit phải an toàn và không phá vỡ bất kỳ chức năng nào đang hoạt động ổn định.
- **Lessons Learned:** Tham khảo bảng "Các Lỗi Đã Từng Xảy Ra" trong Skill để tránh lặp lại sai lầm cũ (VD: dùng `new Date()` thay vì `selectedPeriodKey`, duplicate dropdown, lặp đơn vị tiền tệ...).

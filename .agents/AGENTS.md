# Project Rules

## UI/UX Rule: Info Tooltips on Charts and Modules
- **Requirement:** Tất cả các biểu đồ (charts), thành phần trực quan (visual components) và các module chức năng chính đều BẮT BUỘC phải có một biểu tượng dấu chấm hỏi (`HelpCircle` hoặc `Info` icon) nằm cạnh tiêu đề.
- **Tương tác:** Khi người dùng di chuột (hover) hoặc bấm (click) vào biểu tượng này, hệ thống phải hiển thị một Tooltip/Popover giải thích ý nghĩa của biểu đồ/module đó và hướng dẫn cách sử dụng, đọc hiểu dữ liệu.
- **Mục đích:** Mang lại trải nghiệm cao cấp (premium, đẳng cấp), giúp người dùng dễ dàng nắm bắt các khái niệm tài chính phức tạp mà không cần đọc tài liệu hướng dẫn riêng.
- **Thực thi:** Sử dụng component `HelpTooltip` đã có sẵn (hoặc tự xây dựng nếu chưa phù hợp) và tích hợp vào mọi component UI hiển thị dashboard, báo cáo.

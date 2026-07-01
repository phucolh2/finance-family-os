# ADR-0006: Tái cấu trúc lớp tài sản tích lũy (Portfolio Asset Classes V2)

## Trạng thái
Đã duyệt (Approved)

## Bối cảnh
Trước đây, hệ điều hành tài chính gia đình lưu trữ 4 lớp tài sản cố định: USD, Crypto, Bất động sản và Chứng khoán. Để mô phỏng chân thực và đầy đủ hơn bức tranh tài sản của các gia đình Việt Nam, cần bổ sung tài sản **Vàng** (Gold) như một kênh phòng vệ lạm phát truyền thống quan trọng và tối ưu lại tỷ trọng mặc định toàn hệ thống.

## Quyết định
1. **Danh mục lớp tài sản chuẩn mới**:
   * Dự trữ ngoại hối (USD) (`fx_reserve_usd`)
   * Vàng (`gold`)
   * Bất Động Sản (`real_estate`)
   * Chứng Khoán (`stocks`)
   * Crypto (`crypto`)

2. **Tham số phân bổ và lợi suất mặc định**:
   * USD: Tỷ trọng 20%, Lợi suất 3%/năm.
   * Vàng: Tỷ trọng 10%, Lợi suất 6%/năm.
   * Bất Động Sản: Tỷ trọng 35%, Lợi suất 8%/năm.
   * Chứng Khoán: Tỷ trọng 25%, Lợi suất 10%/năm.
   * Crypto: Tỷ trọng 10%, Lợi suất 15%/năm.

3. **Di cư dữ liệu (Migration)**:
   * Ánh xạ các khóa cũ (USD, BĐS, Chứng khoán) sang khóa chuẩn tiếng Anh.
   * Tự động thêm **Vàng** với số dư ban đầu bằng 0 và tỷ trọng 10% nếu chưa tồn tại.
   * Cân bằng động tổng tỷ trọng mục tiêu đạt đúng 100% khi phát hiện sai lệch.

## Hệ quả
* Toàn bộ động cơ mô phỏng tài sản, công cụ dự phóng dài hạn, và mô hình giả lập ngẫu nhiên Monte Carlo sẽ chạy dựa trên 5 lớp tài sản mới này.
* Legend biểu đồ Recharts cập nhật tương ứng, không gây chồng đè nhãn nhờ áp dụng nhãn viết tắt.

# Finance Family OS - Hệ Thống Quản Lý Tài Chính Gia Đình Toàn Diện

## 🎯 Mục Tiêu Dự Án
**Finance Family OS** không chỉ là một ứng dụng ghi chép thu chi đơn thuần, mà là một "Hệ điều hành" giúp các gia đình lên kế hoạch tài chính trọn đời (với tầm nhìn dự phóng lên đến 100 năm). Mục tiêu cốt lõi của hệ thống bao gồm:
1. **Dự phóng dòng tiền (Cashflow Projection):** Mô phỏng chi tiết dòng tiền thu/chi qua từng tháng, năm dựa trên lạm phát thực tế và các cột mốc thay đổi thu nhập.
2. **Quy hoạch tài sản (Asset Allocation & Portfolio):** Quản lý đa dạng các lớp tài sản (Cổ phiếu, Crypto, Bất động sản, Vàng, USD) với lợi nhuận kỳ vọng và cơ chế tái đầu tư (lãi kép) tự động.
3. **Quản lý sự kiện cuộc đời (Life Events & Sinking Funds):** Dự toán và trích lập quỹ chuẩn bị tài chính cho các sự kiện lớn như: sinh con, mua nhà, mua xe, du lịch, chăm sóc sức khỏe.
4. **Tự do tài chính (FIRE - Financial Independence, Retire Early):** Tự động phân tích điểm giao cắt tự do tài chính, tính toán thời điểm có thể nghỉ hưu an nhàn dựa trên tỷ lệ tích lũy và hiệu suất đầu tư.
5. **Chủ quyền dữ liệu:** Hoạt động hoàn toàn trên trình duyệt của bạn (Local Storage). Không có máy chủ tập trung thu thập dữ liệu, thông tin tài chính của gia đình bạn là bảo mật tuyệt đối.

---

## ⚙️ Cấu Hình Hệ Thống (System Setup)
Dự án được xây dựng trên nền tảng **React + TypeScript + Vite** với kiến trúc module hóa.

### 1. Yêu cầu môi trường
* **Node.js**: Phiên bản 20.x trở lên.
* **npm**: Phiên bản đi kèm với Node.js.

### 2. Cài đặt và Khởi chạy (Dành cho Developer/Local Use)
1. **Cài đặt các gói phụ thuộc (Dependencies):**
   Mở terminal tại thư mục dự án và chạy:
   ```bash
   npm ci --legacy-peer-deps
   ```
2. **Chạy môi trường phát triển (Development mode):**
   ```bash
   npm run dev
   ```
   *Hệ thống sẽ chạy tại địa chỉ: `http://localhost:5173`. Mở trình duyệt để bắt đầu sử dụng.*

3. **Đóng gói dự án (Production Build):**
   ```bash
   npm run build
   ```
4. **Kiểm thử hệ thống (Unit Tests):**
   ```bash
   npm run test
   ```

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết

Hệ thống được chia thành các phân hệ chính (Modules) hoạt động liên kết chặt chẽ với nhau. Để hệ thống dự phóng chính xác nhất, bạn nên thiết lập theo trình tự sau:

### Bước 1: Khởi tạo Hồ Sơ & Giả Định (Profile & Assumptions)
* **Thông tin gia đình:** Nhập độ tuổi hiện tại của vợ/chồng, năm bắt đầu lên kế hoạch và năm dự kiến kết thúc (có thể kéo dài tới 100 tuổi).
* **Các chỉ số giả định (Assumptions):** Thiết lập tỷ lệ lạm phát chung, lạm phát y tế, lạm phát giáo dục và kỳ vọng lợi nhuận trung bình. Đây là "trái tim" của công cụ dự phóng dài hạn, quyết định giá trị của dòng tiền trong tương lai.

### Bước 2: Thiết lập Thu Nhập & Ngân Sách (Income & Budget)
* **Thu Nhập (Income Schedule):** Khai báo các nguồn thu nhập hiện tại và tương lai (Lương, kinh doanh, freelance, v.v.). Bạn có thể thiết lập tháng/năm bắt đầu và kết thúc cho từng nguồn thu.
* **Phân bổ Ngân Sách (Budget Ratios):** Hệ thống sử dụng quy tắc phân bổ ngân sách (VD: 50% thiết yếu / 30% linh hoạt / 20% tích lũy). Hệ thống sẽ tự động tính ra số tiền được phép chi tiêu mỗi tháng dựa trên tổng thu nhập.
* **Dòng tiền dư (Free Cashflow):** Hệ thống lấy (Tổng Thu - Ngân sách chi tiêu - Trả nợ) để tính ra Dòng tiền tự do dùng cho đầu tư.

### Bước 3: Tích lũy Mục Tiêu & Sự Kiện (Sinking Funds & Life Events)
* **Sinking Funds (Quỹ tích lũy mục tiêu):** Thiết lập các quỹ như "Quỹ Mua Nhà 2030", "Quỹ Khẩn Cấp". Hệ thống cho phép trích lập một phần dòng tiền tự do mỗi tháng vào quỹ này cho đến khi đạt mục tiêu.
* **Sự Kiện Cuộc Đời (Life Events):** Khai báo các cột mốc tiêu tiền lớn (Đám cưới, Khởi nghiệp, Du lịch). Dòng tiền của tháng/năm đó sẽ bị trừ đi, giúp bạn nhìn thấy nguy cơ thiếu hụt thanh khoản trước nhiều năm để chuẩn bị.
* **Child Cost Estimator (Dự toán nuôi con):** Nhập năm sinh của con, hệ thống sẽ tự động phân bổ chi phí ăn mặc, y tế, giáo dục từ lúc sơ sinh đến khi học Đại học, tính kèm lạm phát dài hạn.

### Bước 4: Quản Lý Danh Mục Đầu Tư (Portfolio)
* **Cấu trúc danh mục (Asset Allocation):** Định hình tỷ trọng cho các lớp tài sản (VD: 60% Cổ phiếu, 20% Bất động sản, 10% Crypto, 10% Vàng). Dòng tiền rảnh rỗi (sau khi trích lập quỹ) sẽ tự động chảy vào các tài sản này.
* **Thương vụ (Deals & Deposits):** Theo dõi từng khoản tiền gửi tiết kiệm hoặc khoản đầu tư cụ thể. Hệ thống sẽ tự động cộng gộp để tính ra Tổng Tài Sản.

### Bước 5: Phân Tích & Theo Dõi (Dashboards)
* **Bảng Cân Đối (Balance Sheet):** Tóm tắt Tài sản (Assets), Nợ (Liabilities) và Giá trị tài sản ròng (Net Worth).
* **Dự Phóng FIRE:** Bảng tổng hợp số năm còn lại để đạt Tự do tài chính, so sánh giữa Dòng tiền thụ động sinh ra từ tài sản và Mức chi tiêu thiết yếu của gia đình.

### Bước 6: Sao Lưu & Khôi Phục (Backup & Restore)
* **Lưu ý quan trọng:** Vì hệ thống không dùng server, dữ liệu lưu hoàn toàn trên trình duyệt của bạn (Local Storage).
* Bạn BẮT BUỘC phải vào mục **Cài Đặt (Settings) -> Backup** để tải file `.json` chứa dữ liệu về máy tính định kỳ. 
* Khi đổi máy tính hoặc dùng trình duyệt khác, sử dụng tính năng **Restore** và tải file `.json` lên để tiếp tục quản lý.

---
*Dự án được xây dựng với mục đích trao quyền quản trị gia sản toàn diện cho các gia đình.*

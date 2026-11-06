# 📋 ĐẶC TẢ GIAO DIỆN & TÍNH NĂNG (DỰA TRÊN ẢNH ĐỀ BÀI)
## Dự án: OmniChat AI — VibeCoding 2026 (Đề 04)

Tài liệu này đặc tả chi tiết giao diện và luồng xử lý dựa trên 2 ảnh chụp thực tế từ hệ thống mẫu Kstudy của đề thi.

---

## 1. MÀN HÌNH HỘP THƯ (INBOX) — BỐ CỤC 3 CỘT (Theo Screenshot 23.10.19)

### 1.1. Thanh điều hướng trên cùng (Top Bar)
- **Tiêu đề:** `Hộp thư` kèm badge trạng thái số lượng (ví dụ: `18 đang mở`).
- **Nút chuyển đổi góc trên:**
  - `Kênh chat` (icon tin nhắn).
  - `Bot tư vấn khách` (icon bot/robot - click để sang trang cấu hình bot).
- **Ô tìm kiếm toàn cục:** `Tìm nhanh... (Cmd + K)`.

---

### 1.2. Cột 1: Danh sách hội thoại (Bên trái ~25-30% độ rộng)
- **Ô tìm kiếm:** Input `Tên, SĐT, nội dung... Ctrl+K`.
- **Hàng Tab phân loại:**
  - `Tất cả (18)`
  - `Cần xử lý (6)`
  - `Của tôi (6)`
- **Thanh Tag lọc thông minh (Pill Filters):**
  - Dropdown `Kênh v`: Lựa chọn checkbox `Facebook`, `Web`, `Zalo`.
  - Pill `Có lịch hẹn` (bấm để toggle lọc).
  - Pill `Có SĐT/email` (bấm để toggle lọc).
- **Danh sách item hội thoại:** Mỗi item gồm:
  - Avatar khách hàng.
  - Tên khách hàng (ví dụ: *Dũ Chanh*, *Hoàng Tú Anh*, *Khách web C83D*, *Vũ Huyền Trang*...).
  - Icon kênh xuất xứ: Facebook (xanh dương), Zalo (xanh dương đậm), Web (icon địa cầu).
  - Trạng thái chờ / SLA: (ví dụ: `chờ 9 giờ`, `chờ 35 giờ`, `chờ 85 giờ` dạng badge cảnh báo).
  - Preview dòng tin nhắn mới nhất.
  - Thời gian tin nhắn cuối (ví dụ: `13:30`, `10:33`, `08:35`).
  - Badge tag phụ trách / phân loại: (ví dụ: `NK`, `Lưu trữ`...).

---

### 1.3. Cột 2: Khung Chat 2 chiều (Ở giữa ~45-50% độ rộng)
- **Header cuộc trò chuyện:**
  - Avatar + Tên khách + badge cảnh báo thời gian (`chờ 9 giờ`).
  - Dòng trạng thái: `Facebook · Học viện Kstudy`.
  - **Công tắc Switch AI:** Bật/tắt AI tự động trực chat ngay tại cuộc hội thoại (`AI [ON/OFF]`).
  - Các nút tác vụ nhanh: Nút đánh dấu đã xong (Checkmark), Nút lưu trữ (Archive), Nút mở rộng (Expand).
- **Vùng tin nhắn (Chat Stream):**
  - Phân cách mốc thời gian: `Thứ hai, 02/11 22:49`, `12:53`...
  - **Bong bóng tin nhắn Khách hàng (bên trái):** Nền xám nhạt, chữ đen, kèm avatar nhỏ.
  - **Bong bóng tin nhắn Tư vấn viên / Bot (bên phải):** Nền xanh dương đậm (`bg-primary`), chữ trắng.
  - Hỗ trợ icon react thả tim ❤️ dưới tin nhắn.
- **Khung soạn thảo (Footer Chat Input):**
  - Textarea / Input: Placeholder `Nhắn tin...`.
  - Hàng nút công cụ bên dưới:
    - Icon chèn cảm xúc (Emoji 😊).
    - Icon gửi ảnh / đính kèm file (🖼️).
    - **Nút Soạn nháp AI (`✨ Soạn nháp`):** Bấm vào -> AI tự đọc tin nhắn gần nhất và ngữ cảnh Kstudy để điền câu trả lời gợi ý vào ô nhập -> Sales chỉ cần đọc lướt, chỉnh sửa nếu muốn rồi bấm gửi.
    - Nút `/ Kho tin`: Mở nhanh các mẫu câu tư vấn chuẩn.
    - Nút `Gửi`: Gửi tin nhắn.

---

### 1.4. Cột 3: Panel Thông tin chi tiết Lead (Bên phải ~20-25% độ rộng)
- **Tiêu đề:** `Thông tin`.
- **Thanh Action Icon nhanh:** Email, Chuyển tiếp, Link liên kết, Lịch hẹn (Calendar 📅), Đánh giá AI.
- **Box "Tóm tắt" (Summary):**
  - `Học viện Kstudy · 0 tin chưa đọc · hội thoại đang mở`.
- **Box "Ghi chú nội bộ":**
  - Chú thích: `Khách không thấy.`
  - Ô Textarea nhập ghi chú màu vàng nhạt (`Ghi chú cho đội...`).
  - Nút `Lưu ghi chú`.
- **Box "Chưa định danh" / Bóc tách Lead tự động (Key Feature):**
  - Tự động quét nội dung chat nhận diện: `SĐT/email trong tin: 339516196, vhuyntrang231@gmail.com`.
  - Nút hành động: `Tạo khách mới` (hoặc `Lưu Lead & Tạo lịch hẹn`).

---

## 2. MÀN HÌNH BOT TƯ VẤN KHÁCH (Theo Screenshot 23.10.43)

### 2.1. Cột cấu hình (Bên trái)
1. **Công tắc tổng:** Bật/tắt bot toàn hệ thống.
2. **Tab 1 - Bot nói thế nào:**
   - Textarea nhập Persona bot: Giọng điệu, tên bot, quy tắc xưng hô, kết thúc bằng câu hỏi mở.
   - Nút `✨ Dùng mẫu Kstudy` (nạp nhanh prompt mẫu).
   - Cài đặt giờ trực: `Trực từ (giờ): 8` | `Đến (giờ): 21`.
   - `Câu hẹn ngoài giờ`: Textbox nhập câu trả lời khi ngoài giờ.
   - Nút `Lưu`.
3. **Tab 2 - Bot biết gì:** Quản lý danh sách câu hỏi & câu trả lời FAQ.
4. **Tab 3 - Bot không được làm gì:** Bộ nguyên tắc an toàn (Guardrails - cấm hứa hẹn giá sai, cấm cam kết ngoài chính sách, tuyệt đối không trả lời lung tung khi ngoài phạm vi tri thức mà tự động ngắt chế độ AI chuyển giao nhân viên thật tiếp quản).
5. **Tab 4 - Bật bot trên kênh:** Bật/tắt riêng từng kênh (Zalo, Facebook, Web).

### 2.2. Cột "Thử bot" (Simulator trực quan bên phải)
- Tabs chọn kênh: `Zalo`, `Facebook`, `Web`.
- Tag chế độ: `Trong giờ` / `Ngoài giờ`.
- Các nút câu hỏi mẫu một chạm để test nhanh:
  - `Học phí khóa ENTD01 bao nhiêu?`
  - `Khóa này học gì, học xong làm được gì?`
  - `Khi nào khai giảng?`
  - `Có giảm giá không?`
  - `Cho trả góp được không?`
  - `Số em là 0912345678`
- Khung chat test trực tiếp và nút `Gửi`.

---

## 3. MÀN HÌNH QUẢN LÝ LEAD & LỊCH HẸN (`/leads`)

- **Tab 1: Bảng Quản lý Lead (CRM Table):**
  - Các cột: Tên khách hàng | SĐT | Email | Kênh nguồn (FB/Zalo/Web) | Trạng thái (Mới, Đang liên hệ, Đã hẹn, Thành công, Hủy) | Nhu cầu tư vấn | Ngày tạo | Hành động.
- **Tab 2: Quản lý Lịch hẹn (Bookings):**
  - Hiển thị danh sách cuộc hẹn tư vấn hoặc học thử 1-1.
  - Các nút: `Duyệt lịch`, `Đổi giờ hẹn`, `Hủy hẹn`.

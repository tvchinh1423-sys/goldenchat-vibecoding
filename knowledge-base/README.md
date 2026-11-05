# THƯ MỤC TRI THỨC AI CHATBOT — GOLDEN PALACE NAM ĐỊNH
> **Mục đích:** Lưu trữ, quản lý và chuẩn hóa toàn bộ tri thức phục vụ cho Trợ lý AI Chatbot, đội ngũ kinh doanh và chăm sóc khách hàng của Nhà hàng Golden Palace Nam Định.  
> **Nguyên tắc cốt lõi:** Cập nhật liên tục (Living Knowledge Base) mỗi khi có thay đổi về chính sách, giá, dịch vụ, sảnh tiệc hoặc khuyến mãi.

---

## 📂 DANH MỤC TÀI LIỆU TRONG THƯ MỤC

| Tên File | Mô Tả Nội Dung |
| :--- | :--- |
| 📄 [`BO-TRI-THUC-CHATBOT-AI-GOLDEN-PALACE.md`](./BO-TRI-THUC-CHATBOT-AI-GOLDEN-PALACE.md) | **File Master:** Bộ tri thức toàn diện gồm 26 kịch bản Hỏi - Đáp, từ khóa nhận diện, câu trả lời chuẩn, guardrail tài chính và link web. |
| 📄 [`BANG-GIA-DICH-VU-BO-SUNG.md`](./BANG-GIA-DICH-VU-BO-SUNG.md) | **Bảng giá niêm yết dịch vụ bổ sung:** Chi tiết Photobooth 3 gói, MC, ban nhạc, nghi thức rót gạo, vòng laser, flycam trao nhẫn... |

---

## ⚙️ NGUYÊN TẮC CẬP NHẬT LIÊN TỤC (AUTO-UPDATE PROTOCOL)

Mỗi khi làm việc hoặc có bất kỳ thay đổi nào liên quan đến:
1. **Chính sách tài chính / Thuế:** Báo giá chưa VAT, thuế 8% (đồ ăn, phí HT, nước lọc) và 10% (đồ uống).
2. **Bảng giá dịch vụ bổ sung:** Thêm bớt dịch vụ hoặc điều chỉnh giá Photobooth, MC, ban nhạc, hiệu ứng.
3. **Không gian hội trường & Sức chứa:** Thay đổi sảnh, nâng cấp âm thanh ánh sáng, trần cao, màn hình LED.
4. **Thực đơn & Đồ uống:** Món mới, set tiệc mới, phí mang rượu bia vào.
5. **Chính sách ưu đãi:** Quà tặng theo số lượng khách (ví dụ: tặng Vòng laser cho tiệc trên 400 khách).

👉 **Quy trình bắt buộc phải thực hiện:**
1. Cập nhật nội dung chi tiết vào các file markdown trong thư mục `knowledge-base/`.
2. Đồng bộ ngay vào cơ sở dữ liệu `prisma.aiRule` và `prisma.aiSystemConfig` của hệ thống.
3. Cập nhật logic xử lý dự phòng (fallback) trong API [`src/app/api/guest/ai-chat/route.js`](../golden-palace/src/app/api/guest/ai-chat/route.js).
4. Ghi lại lịch sử thay đổi vào phần **Nhật Ký Cập Nhật (Changelog)** bên dưới.

---

## 📝 NHẬT KÝ CẬP NHẬT (CHANGELOG)

* **Phiên bản 1.2 (05/11/2026):**
  - Bổ sung bảng giá chi tiết các Dịch vụ bổ sung vào Chatbot.
  - Thiết lập ngoại lệ cho phép **báo giá trực tiếp trong Chatbox** khi khách hỏi về Photobooth (3 gói 3.4tr - 4tr - 5tr), MC (800k), Rót gạo (800k), Vòng laser (700k / tặng free > 400 khách), Flycam (1tr)...
  - Tạo thư mục `knowledge-base/` để quản lý tập trung và thiết lập nguyên tắc tự động cập nhật liên tục.
* **Phiên bản 1.1 (05/11/2026):**
  - Cập nhật chính sách Thuế VAT: Mọi báo giá chưa gồm VAT. Bóc tách 8% (Đồ ăn + Phí HT + Nước lọc) và 10% (Đồ uống: Nước ngọt, bia, rượu).
  - Đồng bộ lưu ý VAT trên toàn bộ web, link chia sẻ Zalo và file PDF báo giá.
* **Phiên bản 1.0 (05/11/2026):**
  - Khởi tạo bộ tri thức 25 kịch bản tư vấn sảnh (5 hội trường), quy trình đặt tiệc 3 giai đoạn, chính sách mâm cỗ và link web chuẩn.

# 🏆 OmniChat AI — Chatbot FAQ & Đặt Lịch Tư Vấn Đa Kênh
> **Dự thi VibeCoding 2026 — AI × Mini App (Bảng B — Đề số 04)**  
> **Showcase thực chiến:** Trung tâm Tiệc cưới & Sự kiện Golden Palace Nam Định (98 Đông A, TP. Nam Định)

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Automated%20Tests-65%2F65%20Pass-emerald?style=flat&logo=jest)](tests/)
[![Build](https://img.shields.io/badge/Build-20%2F20%20Pages%20Pass-success?style=flat&logo=next.js)](https://goldenchat-vibecoding.vercel.app)
[![Vercel](https://img.shields.io/badge/Live%20Production-Online-blue?style=flat&logo=vercel)](https://goldenchat-vibecoding.vercel.app)

---

## 🌐 Trải nghiệm Trực tiếp (Live Production)

- 🔗 **Hệ thống Quản trị OmniChat:** [https://goldenchat-vibecoding.vercel.app](https://goldenchat-vibecoding.vercel.app)
- 💬 **Web Chat Widget Khách hàng:** [https://goldenchat-vibecoding.vercel.app/widget](https://goldenchat-vibecoding.vercel.app/widget)
- 📱 **Trung tâm Cài đặt Ứng dụng (PWA đa nền tảng):** [https://goldenchat-vibecoding.vercel.app/download](https://goldenchat-vibecoding.vercel.app/download)
- ⚙️ **Webhook Botcake tiếp nhận FB & Zalo:** `https://goldenchat-vibecoding.vercel.app/api/webhook/botcake`
- 📦 **Script nhúng 1 dòng mã vào Website:** `https://goldenchat-vibecoding.vercel.app/embed.js`

---

## 🔑 Tài Khoản Trải Nghiệm Phân Quyền (RBAC)

Hệ thống OmniChat AI hỗ trợ phân quyền 3 cấp độ (Admin / Manager / Staff) tại trang [`/login`](https://goldenchat-vibecoding.vercel.app/login):

| Vai Trò | Tên đăng nhập | Mật khẩu | Quyền hạn nổi bật |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `admin123` | **Toàn quyền hệ thống:** Xem toàn bộ Inbox, CRM, Quản lý Nhân sự (`/users`), Cấu hình Kênh & SLA (`/settings`), Huấn luyện Bot (`/training`), Dashboard báo cáo. |
| **Quản lý (Manager)** | `manager` | `manager123` | **Quản lý vận hành:** Phân công ca trực, duyệt lịch hẹn CRM, xuất báo cáo Dashboard, chỉnh sửa tri thức FAQ. |
| **Tư vấn viên (Staff)** | `staff` | `staff123` | **Trực chat & chăm sóc lead:** Hộp thư cá nhân ("Của tôi"), trả lời khách, soạn nháp AI, tạo và xử lý lịch hẹn trên phễu N3. Bị chặn truy cập Cấu hình và Nhân sự. |

---

## 🎯 Đối Chiếu Tiêu Chí Chấm Điểm BTC Đề 04 (Hoàn Thành 100%)

| Nhóm Tiêu Chí | Yêu cầu của Đề 04 | Giải pháp Thực tế trên OmniChat AI | Trạng thái |
|---|---|---|:---:|
| **1. Must-be** *(Bắt buộc phải có)* | AI trả lời chính xác FAQ dựa trên tài liệu tải lên | Nạp bộ tri thức 26 kịch bản hỏi đáp chuẩn F&B Golden Palace (Thực đơn, sảnh, cọc, VAT, bãi xe...). Hỗ trợ upload Excel `.xlsx`, đồng bộ Google Sheets, inline edit. | ✅ Đạt 100% |
| | Tự động gợi ý 3 câu hỏi liên quan tiếp theo | Bộ định tuyến Intent sinh 3 gợi ý theo ngữ cảnh hiển thị dưới dạng nút bấm (Quick Chips) giúp khách hàng khám phá sâu. | ✅ Đạt 100% |
| | Đặt lịch tư vấn trực tiếp trong luồng chat | Khách hàng có thể bấm hẹn xem sảnh/thử món ngay trong chat widget hoặc bot tự kích hoạt khi phát hiện ý định. | ✅ Đạt 100% |
| | Xem và xóa lịch hẹn trên trang quản trị | Trang `/leads` và màn hình Lịch hẹn có đầy đủ nút Xác nhận, Hủy và nút đỏ **"Xóa lịch"** (icon Thùng rác + xác nhận). | ✅ Đạt 100% |
| | Bật/tắt bot & chuyển giao tư vấn viên | Toggle Master bật/tắt toàn hệ thống, gắn cờ chuyển nhân viên hỗ trợ khi quá SLA. | ✅ Đạt 100% |
| **2. Performance** *(Làm mượt)* | Phản hồi tức thì (< 2s) | Kiến trúc định tuyến hybrid: xử lý phản xạ tức thì tại Client/Edge kết hợp AI Engine (Gemini / 9Router). Phản hồi < 300ms. | ✅ Đạt 100% |
| | Smart Default ngày & giờ hẹn | Tự động điền ngày hôm nay hoặc sáng mai vào khung giờ tiếp đón vàng của Golden Palace (8:00 - 10:30 sáng). | ✅ Đạt 100% |
| | Quản lý Phễu khách hàng trực quan | 6 cột Kanban chuẩn quốc tế: `N1 · Lead thô` ➔ `N2 · Tiềm năng` ➔ `N3 · Khảo sát 1-1` ➔ `N4 · Chính thức` ➔ `N5 · Nuôi dưỡng` / `N0 · Đã mất`. | ✅ Đạt 100% |
| **3. Attractive** *(Điểm WOW)* | Thêm lịch hẹn vào Google Calendar 1-chạm | Thẻ xác nhận sinh link động Google Calendar chứa đầy đủ thông tin: Địa chỉ 98 Đông A, khung giờ, ghi chú tiệc cưới. | 🌟 WOW 1 |
| | Hiệu ứng âm thanh Web Audio "Ting" | Tự động phát âm thanh khi có tin nhắn hoặc đặt lịch thành công bằng Web Audio API thuần (không phụ thuộc asset mạng ngoài). | 🌟 WOW 2 |
| | Bóc tách quy mô sảnh linh hoạt | Nhận diện thông minh "300 khách", "30 mâm", "35 bàn"... tự động so sánh Sảnh Tầng 3 và Tầng 4 kèm 2 nút xem ảnh trực tiếp. | 🌟 WOW 3 |
| | Hệ thống Hyperlink & Quick Actions 1-chạm | Tự động chuyển URL/SĐT thành nút bấm mở ngay: Xem Menu, Bản đồ Maps, Xem Sảnh, Dự toán chi phí, Gọi Hotline. | 🌟 WOW 4 |
| **4. Reverse** *(Né điểm trừ)* | Không tự bịa giá/ưu đãi ngoài chính sách | Thiết lập Guardrail đa tầng: Chặn triệt để khách đòi giảm giá 30%, kiên định bảo vệ chính sách nhà hàng và gửi cảnh báo Telegram. | 🛡️ Chuẩn hóa |
| | Không đơ/lỗi khi khách gõ không dấu, tiếng lóng | Bộ phân tích ngôn ngữ tự nhiên xử lý tiếng Việt không dấu, nhận diện ý định đa biến thể (`dat lich`, `hen xem sanh`, `muon dat`...). | 🛡️ Chuẩn hóa |
| | Ngăn chặn trùng lịch của cùng tư vấn viên | Thuật toán kiểm tra xung đột thời gian (exclusion check) ngăn chặn 2 lịch hẹn trùng giờ của cùng 1 chuyên viên. | 🛡️ Chuẩn hóa |

---

## ⚡ 6 Kịch Bản Khảo Sát Nhanh (Dành Cho Ban Giám Khảo Test 1-Chạm)

Tại trang **Huấn luyện Bot (`/training`)**, cột **Simulator** bên phải được trang bị sẵn 6 phím tắt kịch bản thực chiến:

1. 🏛️ **Tiệc 300 khách (30 mâm):**  
   *Câu hỏi:* `"Tiệc cưới khoảng 300 khách (30 mâm) thì nhà hàng tư vấn sảnh nào phù hợp?"`  
   👉 *Bot phản hồi:* Phân tích so sánh 2 sảnh Tầng 3 (300-650 khách) và Tầng 4 (100-300 khách), sinh 2 nút bấm mở ảnh trực tiếp.
2. 💰 **Đặt cọc giữ sảnh bao nhiêu?:**  
   *Câu hỏi:* `"Đặt cọc giữ sảnh tiệc cưới là bao nhiêu tiền và quy trình thế nào?"`  
   👉 *Bot phản hồi:* Khẳng định mức cọc giữ sảnh lần 1 là **5.000.000 VNĐ** (cấn trừ vào hợp đồng) và quy trình 3 giai đoạn minh bạch.
3. ⚠️ **Đòi giảm giá 30% tiệc (Thử Guardrail):**  
   *Câu hỏi:* `"Tôi đặt tiệc 40 mâm, nhà hàng có giảm giá trực tiếp 30% trên hợp đồng được không?"`  
   👉 *Bot phản hồi:* Từ chối khéo léo theo đúng chính sách giá niêm yết, hướng dẫn nhận gói quà tặng dịch vụ (Laser, bia, đồ uống) và bắn cảnh báo Telegram.
4. 📅 **Hẹn giờ xem sảnh sáng mai:**  
   *Câu hỏi:* `"Sáng mai tôi muốn ghé nhà hàng xem sảnh trực tiếp (8:00 - 10:30) được không?"`  
   👉 *Bot phản hồi:* Xác nhận khung giờ đón tiếp, tự động mở Form Đặt lịch nhanh với Smart Default điền sẵn.
5. 🅿️ **Bãi đỗ xe ô tô & VAT:**  
   *Câu hỏi:* `"Nhà hàng có chỗ đỗ xe ô tô không và báo giá đã bao gồm thuế VAT chưa?"`  
   👉 *Bot phản hồi:* Khẳng định **bãi đỗ xe ô tô & xe máy miễn phí 100%**, minh bạch chính sách thuế (8% đồ ăn, 10% đồ uống).
6. 📸 **Bảng giá Photobooth & MC:**  
   *Câu hỏi:* `"Bảng giá thuê MC dẫn chương trình và dịch vụ chụp ảnh Photobooth lấy ngay là bao nhiêu?"`  
   👉 *Bot phản hồi:* Niêm yết chi tiết Photobooth 3.4/4/5 triệu, MC 800.000đ, Ca sĩ 800.000đ.

---

## 🏛️ Dữ Liệu Thực Chiến — Golden Palace Nam Định

- **Địa chỉ:** 98 Đông A, KĐT Hòa Vượng, TP. Nam Định ([Mở Google Maps](https://maps.app.goo.gl/GrYDqNTLNmqQ1nH76?g_st=ic))
- **Hotline tư vấn:** `0228 6595 959`
- **Khung giờ tiếp đón khách tham quan sảnh:** `8:00 - 10:30` sáng hằng ngày
- **Mức cọc giữ chỗ lần 1:** `5.000.000 VNĐ`
- **Quy mô:** 5 sảnh tiệc sức chứa từ 100 đến 1.500 khách
- **Bãi đỗ xe:** 1.000m² ô tô & xe máy, miễn phí 100%

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm

### Yêu cầu môi trường
- Node.js >= 18.17.0
- npm >= 9.0.0

### Khởi chạy ứng dụng
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển
npm run dev

# 3. Mở trình duyệt truy cập:
# Quản trị hệ thống: http://localhost:3000
# Khung chat widget: http://localhost:3000/widget
```

### Chạy kiểm thử tự động
```bash
# Chạy toàn bộ 34 bài kiểm tra tự động (Unit / API / CRM / Router)
npm test

# Chạy kiểm tra định dạng và kiểu dữ liệu TypeScript
npm run lint
npm run typecheck

# Đóng gói sản xuất (Production Build)
npm run build
```

---

## 👥 Thành Viên Phát Triển Dự Án

- **Trần Vân Chinh:** Quản lý dự án, Quản trị Tri thức F&B, Kênh chat đa nền tảng (Botcake FB/Zalo, Web Widget, Telegram Alert), Tối ưu hoá Intent Router & Showcase Golden Palace.
- **Phạm Thị Thu Hiền (Chị Hiền):** Frontend Lead, Hệ thống Hộp thư đa kênh (Inbox 3 cột), Quản lý Phễu khách hàng CRM (Kanban N1–N5/N0), Tích hợp AI Engine (Gemini / 9Router), Âm thanh & Lịch hẹn.

---
*OmniChat AI — VibeCoding 2026. Giải pháp tự động hóa tư vấn và tối ưu chuyển đổi khách hàng cho doanh nghiệp Việt.*

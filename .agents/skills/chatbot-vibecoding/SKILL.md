---
name: chatbot-vibecoding
description: >-
  Skill ngữ cảnh xuyên suốt dự án VibeCoding 2026 Đề 04 (Chatbot FAQ & Đặt lịch tư vấn đa kênh).
  Kích hoạt skill này bất cứ khi nào làm việc với dự án: code, thiết kế, phân chia công việc,
  debug, deploy hoặc chuẩn bị bài nộp. Chứa toàn bộ bối cảnh dự án, kiến trúc, phân chia công việc,
  tiêu chí chấm điểm và quyết định kỹ thuật giữa Chinh và Chị Hiền.
---

# 🎯 DỰ ÁN VIBECODING 2026 — ĐỀ 04: CHATBOT FAQ & ĐẶT LỊCH TƯ VẤN

> [!IMPORTANT]
> **QUY TẮC CỐT LÕI CẦN GHI NHỚ:**
> 1. **DỰ ÁN ĐỘC LẬP:** Đây là sản phẩm dự thi VibeCoding 2026 (Bảng B - Kinh tế). **TUYỆT ĐỐI KHÔNG liên hệ, KHÔNG gán ghép và KHÔNG dùng dữ liệu của Golden Palace.**
> 2. **KẾT NỐI ĐA KÊNH QUA BOTCAKE:** Toàn bộ kênh **Facebook Page VÀ Zalo cá nhân** được kết nối tập trung qua **Botcake API / Webhook**. Đã loại bỏ hoàn toàn `zca-js`.
> 3. **PHỄU LEAD CHUẨN KANBAN (N1 -> N5):** Theo 2 ảnh mẫu giao diện mới nhất ngày 05/11.

---

## 📌 THÔNG TIN DỰ ÁN & TIẾN ĐỘ THỰC TẾ

| Key | Value | Trạng thái |
|-----|-------|:----------:|
| **Cuộc thi** | VibeCoding 2026 — AI × Mini App (Bảng B) | Đang diễn ra |
| **Đề số** | 04 — Chatbot FAQ & Đặt lịch tư vấn | Đã chốt phạm vi |
| **Deadline** | 08/11/2026 (Còn 3.5 ngày) | Gấp |
| **Tên sản phẩm** | **OmniChat AI** | Đã chốt |
| **GitHub Repo** | `https://github.com/tvchinh1423-sys/goldenchat-vibecoding` | ✅ Đã tạo & push origin/main |
| **Môi trường .env** | Đã có `.env.local` và `.env.example` | ✅ Đã cấu hình |
| **Gói bàn giao** | `Ban_Giao_Du_An_OmniChat_Chi_Hien.zip` | ✅ Đã đóng gói |
| **Ảnh UI tham khảo** | Đã có đủ 4 màn hình chuẩn xác | ✅ 100% đầy đủ |

---

## 🖼️ HỆ THỐNG GIAO DIỆN CHUẨN ĐÃ THỐNG NHẤT (4 ẢNH MẪU)

Hệ thống giao diện được định hình 100% dựa trên 4 ảnh thực tế trong workspace:
1. **Màn hình Hộp thư (Inbox 3 cột):**
   - Cột 1: Danh sách hội thoại đa kênh (lọc FB, Zalo, Web, có lịch hẹn, có SĐT/email).
   - Cột 2: Khung chat 2 chiều, toggle bật/tắt AI cho phiên, nút *Soạn nháp AI*, nút *Kho tin/Sổ tay*.
   - Cột 3: Tóm tắt hội thoại AI, Ghi chú nội bộ cho sales, Hộp khách chưa định danh (phát hiện SĐT/Email ➔ Nút *Tạo khách mới*).
2. **Màn hình Huấn luyện Bot (`/training`):**
   - Toggle tổng bật/tắt bot toàn hệ thống.
   - Section 1: Bot nói thế nào (Persona, giờ trực, câu hẹn ngoài giờ).
   - Section 2: Bot biết gì (FAQ, upload Excel, link Google Sheet).
   - Section 3: Bot không được làm gì (Guardrails, cảnh báo Telegram khi vi phạm).
   - Bên phải: Khung Thử bot trực tiếp kèm gợi ý câu hỏi test nhanh.
3. **Màn hình Quản lý Lead — Dạng Danh Sách & Biểu đồ Phễu (`/leads` view 1):**
   - Bên trái: Danh sách hồ sơ khách hàng (bộ lọc: giai đoạn, phụ trách, khóa học, nguồn, lịch hẹn, checkbox *Chưa ai chạm quá 7 ngày*).
   - Bên phải: **Phễu tuyển sinh (Funnel Chart)** thể hiện tỷ lệ chuyển đổi qua từng bậc:
     - `N1 · Lead thô` ➔ `N2 · Tiềm năng` ➔ `N3 · Học thử` ➔ `N4 · Chính thức` ➔ `N5 · Nuôi dưỡng` / `N0 · Đã mất`.
4. **Màn hình Quản lý Lead — Dạng Bảng Phễu Kanban (`/leads` view 2):**
   - Thanh thống kê tỷ lệ % từng giai đoạn trên cùng.
   - 6 cột Kanban kéo thả trực quan:
     - `N1 · LEAD THÔ`
     - `N2 · TIỀM NĂNG`
     - `N3 · HỌC THỬ`
     - `N4 · CHÍNH THỨC`
     - `N5 · NUÔI DƯỠNG`
     - `N0 · ĐÃ MẤT`

---

## 👥 PHÂN CHIA VAI TRÒ & MODULE

```
app-root/
├── app/
│   ├── (dashboard)/
│   │   ├── inbox/        <-- Chị Hiền (Frontend Inbox 3 cột, Realtime chat)
│   │   ├── dashboard/    <-- Chị Hiền (Thống kê biểu đồ hiệu suất)
│   │   ├── leads/        <-- Chị Hiền (Quản lý Lead Funnel & Kanban N1-N5)
│   │   ├── training/     <-- Chinh (Quản trị tri thức, Form huấn luyện bot)
│   │   └── settings/     <-- Chinh (Cấu hình hệ thống, giờ trực, kênh kết nối)
│   ├── api/
│   │   ├── ai/           <-- Chị Hiền (Tích hợp AI Engine 9Router + Gemini)
│   │   ├── leads/        <-- Chị Hiền (API bóc tách lead, CRUD lịch hẹn)
│   │   ├── webhook/      <-- Chinh (Webhook Botcake FB + Zalo)
│   │   └── training/     <-- Chinh (API upload Excel, parse tri thức)
│   └── widget/           <-- Chinh (Giao diện Web chat widget nhúng)
├── lib/
│   ├── ai-engine.ts      <-- Chị Hiền (9Router/Gemini wrapper)
│   ├── lead-extractor.ts <-- Chị Hiền (Logic AI bóc tách SĐT/Email/Nhu cầu)
│   └── supabase.ts       <-- Shared (Chinh + Hiền)
└── handoff/              <-- Thư mục Chinh bàn giao cho Chị Hiền
```

### 1. Trần Vân Chinh (Quản trị tri thức + Kênh chat + Cấu hình)
- Quản trị tri thức: Form persona, upload Excel FAQ, nạp tri thức, Khung Thử bot.
- Kênh chat: Kết nối Botcake (cho cả FB Page & Zalo cá nhân), Webhook `/api/webhook/botcake`, Web chat widget.
- Cấu hình: Giờ trực, phạm vi cấm bot, cảnh báo Telegram, Sổ tay tư vấn, đồng bộ Google Sheet.
- Quản lý & Bàn giao: Repo GitHub, tài liệu README.md, Video demo 2 phút.

### 2. Chị Hiền (Frontend Lead + Tích hợp AI Engine + Lead & Lịch hẹn)
- Frontend Lead: Setup layout Next.js 14 App Router + Tailwind + shadcn/ui, Responsive Mobile/Desktop.
- Hộp thư (Inbox): Dựng đúng chuẩn ảnh mẫu 1 (3 cột, filter, soạn nháp, tóm tắt).
- Lead & Lịch hẹn: Dựng đúng chuẩn ảnh mẫu 3 & 4 (Chuyển đổi linh hoạt giữa Danh sách + Phễu Funnel và Bảng Phễu Kanban N1-N5).
- Tích hợp AI: Kết nối 9Router / Gemini API, tính năng Soạn nháp AI, tự động bóc tách Lead từ chat.

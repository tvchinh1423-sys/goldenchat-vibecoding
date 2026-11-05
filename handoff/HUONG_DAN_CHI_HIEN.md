# 🚀 HƯỚNG DẪN BÀN GIAO CÔNG VIỆC — DÀNH CHO CHỊ HIỀN
## Dự án: OmniChat AI — VibeCoding 2026 (Đề 04: Chatbot FAQ & Đặt lịch tư vấn)

Chào chị Hiền! Đây là toàn bộ tài liệu bàn giao, cấu trúc database và dữ liệu mẫu để chị em mình phối hợp mượt mà nhất. Em đã chuẩn bị sẵn mọi thứ để chị có thể bắt tay vào làm ngay với AI (Cursor / Claude / ChatGPT) một cách nhanh chóng và chính xác nhất.

---

### 📦 TRỌNG TÂM CÔNG VIỆC CỦA CHỊ HIỀN

Chị Hiền sẽ phụ trách 3 module chính:
1. **Frontend Lead (Giao diện Inbox & Dashboard):**
   - **Màn hình Hộp thư (Inbox) 3 cột:** Dựng chuẩn theo ảnh chụp thực tế `Screenshot 23.10.19.png` (Danh sách hội thoại lọc đa kênh | Khung chat 2 chiều có nút *Soạn nháp AI* | Panel thông tin Lead bóc tách SĐT/Email).
   - **Màn hình Dashboard:** Thống kê tổng quan số tin nhắn, số lead mới phát sinh, tỷ lệ AI xử lý tự động, danh sách lịch hẹn sắp tới.
   - Đảm bảo giao diện chuẩn Next.js 14 App Router, Tailwind CSS, shadcn/ui và responsive mượt trên Mobile.
2. **Tích hợp AI Engine (`lib/ai-engine.ts`):**
   - Tích hợp gọi AI (sử dụng 9Router hoặc Gemini API).
   - Tính năng **Soạn nháp AI (`✨ Soạn nháp`)**: Gợi ý câu trả lời cho nhân viên duyệt trước khi gửi.
   - Nút bật/tắt AI tự động tại từng cuộc trò chuyện (tự ngắt AI khi nhân viên nhảy vào chat).
3. **Quản lý Lead & Lịch hẹn (`app/(dashboard)/leads`):**
   - Bảng CRM quản lý Lead: lọc theo trạng thái, tìm kiếm SĐT/Email.
   - Phân hệ Quản lý Lịch hẹn tư vấn / học thử 1-1 (Duyệt lịch, Đổi giờ, Hủy lịch).
   - Hàm bóc tách tự động Tên, SĐT, Email từ nội dung chat.

*(Phần Quản trị tri thức `/training`, Upload Excel FAQ, Webhook Botcake Facebook, Zalo bridge local và Cấu hình hệ thống `/settings` đã có Chinh phụ trách).*

---

### 📂 TRONG TỆP BÀN GIAO NÀY CÓ GÌ?

| Tên file | Mô tả & Cách sử dụng |
|---|---|
| `HUONG_DAN_CHI_HIEN.md` | Tài liệu hướng dẫn này. |
| `SPEC_GIAO_DIEN_TINH_NANG.md` | Đặc tả chi tiết từng nút, từng cột theo đúng ảnh đề bài. |
| `mock_data.json` | Dữ liệu mẫu chuẩn Kstudy (FAQ, Leads, Lịch hẹn, Persona bot). |
| `supabase_schema.sql` | Mã SQL khởi tạo toàn bộ bảng database trên Supabase. |
| `Screenshot 23.10.19.png` | Ảnh chụp màn hình chuẩn của Màn hình Inbox 3 cột. |
| `Screenshot 23.10.43.png` | Ảnh chụp màn hình chuẩn của Màn hình Bot tư vấn & Thử bot. |

---

### 🛠️ 3 BƯỚC BẮT ĐẦU NHANH NHẤT

#### Bước 1: Kéo code từ Git hoặc giải nén thư mục
Mở Terminal trong thư mục dự án và tạo nhánh riêng của chị:
```bash
git checkout -b hien/frontend-ai
```

#### Bước 2: Cài đặt thư viện & Chạy thử
```bash
npm install
npm run dev
```
Truy cập: `http://localhost:3000` để xem giao diện.

#### Bước 3: Nạp Database Supabase
1. Mở file `supabase_schema.sql`.
2. Copy toàn bộ nội dung dán vào mục **SQL Editor** trên Supabase Dashboard và bấm **RUN**.
3. Cấu hình file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=your-gemini-key
   ```

---

### 🤖 1 PROMPT MASTER ĐỂ CHỊ BẮT ĐẦU VỚI AI (CURSOR / CLAUDE / CHATGPT)

Chị Hiền chỉ cần mở công cụ AI (nhấn `Ctrl + L` / `Cmd + L` trong Cursor hoặc mở Claude/ChatGPT) và dán đoạn prompt bên dưới:

```text
Tôi đang phát triển dự án OmniChat AI (Cuộc thi VibeCoding 2026 - Đề 04: Chatbot FAQ & Đặt lịch tư vấn).
Công nghệ sử dụng: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Supabase.

Hãy đọc kỹ 2 file tài liệu có sẵn trong dự án:
1. `SPEC_GIAO_DIEN_TINH_NANG.md` (Đặc tả chi tiết giao diện dựa trên ảnh chụp thực tế của đề bài)
2. `mock_data.json` (Dữ liệu mẫu Kstudy về khóa học, FAQ, hội thoại, lead, booking)

Nhiệm vụ của bạn là hỗ trợ tôi triển khai 3 module sau theo thứ tự:
1. Module 1: Màn hình Hộp thư (Inbox) 3 cột tại `app/(dashboard)/inbox/page.tsx`:
   - Cột 1: Danh sách hội thoại có search, tab (Tất cả, Cần xử lý, Của tôi), bộ lọc kênh (Facebook, Web, Zalo), lọc Có lịch hẹn, Có SĐT/email.
   - Cột 2: Khung chat 2 chiều, header có switch bật/tắt AI, footer có ô nhập tin nhắn và nút "✨ Soạn nháp AI".
   - Cột 3: Panel thông tin có Tóm tắt, Ghi chú nội bộ, và Box "Chưa định danh" tự bóc tách SĐT/Email từ tin nhắn kèm nút "Tạo khách mới".
   - Đảm bảo responsive thu gọn linh hoạt trên Mobile.

2. Module 2: File AI Engine tại `lib/ai-engine.ts`:
   - Hàm `generateBotReply(message, knowledgeBase)`: Trả lời tự động chuẩn FAQ Kstudy.
   - Hàm `generateDraftReply(lastCustomerMessage, chatHistory)`: Sinh câu trả lời gợi ý khi sales bấm nút "✨ Soạn nháp AI".
   - Hàm `extractLeadInfo(chatHistory)`: Trích xuất Họ tên, SĐT, Email, Nhu cầu từ hội thoại chat.

3. Module 3: Màn hình Quản lý Lead & Lịch hẹn tại `app/(dashboard)/leads/page.tsx`:
   - Tab 1: Bảng CRM danh sách Lead lọc theo trạng thái và kênh.
   - Tab 2: Danh sách lịch hẹn tư vấn có nút Duyệt lịch, Đổi giờ hẹn.

Bây giờ hãy bắt đầu từ Module 1: Hãy viết mã nguồn hoàn chỉnh, sạch sẽ và sẵn sàng chạy được cho Màn hình Inbox 3 cột.
```

---

### 🌿 QUY TẮC ĐẨY CODE LÊN GITHUB (TRÁNH XUNG ĐỘT)

1. Luôn làm việc trên nhánh riêng: `hien/frontend-ai`.
2. Khi hoàn thành tính năng:
   ```bash
   git add .
   git commit -m "feat: hoàn thiện màn hình inbox 3 cột và tính năng soạn nháp AI"
   git push origin hien/frontend-ai
   ```
3. Lên GitHub tạo **Pull Request** vào nhánh `main` để Chinh merge.

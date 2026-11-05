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
> 1. **SAAS ĐA NGÀNH:** Doanh nghiệp tự cấu hình Persona, FAQ và Guardrails. Chinh và Hiền đã chốt **Trung tâm Tiệc cưới & Sự kiện Golden Palace (F&B)** làm showcase ngày 05/11/2026. Hội thoại/liên hệ Inbox là dữ liệu minh họa. Quyết định này thay thế quy tắc cấm Golden Palace trước đây.
> 2. **KẾT NỐI ĐA KÊNH QUA BOTCAKE:** Toàn bộ kênh **Facebook Page VÀ Zalo cá nhân** được kết nối tập trung qua **Botcake API / Webhook**. Đã loại bỏ hoàn toàn `zca-js`.
> 3. **PHỄU LEAD CHUẨN KANBAN (N1 -> N5):** Theo 2 ảnh mẫu giao diện mới nhất ngày 05/11.
> 4. **TỰ CẬP NHẬT NGỮ CẢNH & ĐỒNG BỘ GITHUB:** Trong mỗi phiên làm việc, tự đọc cập nhật của đối phương trước khi sửa và tự cập nhật skill, kiểm tra, commit, push sau mỗi task nhỏ hoàn thành. Người dùng đã yêu cầu quy trình này ngày 05/11/2026; không hỏi lại cho các bước đồng bộ thông thường. Thực hiện theo quy trình bên dưới để giữ nguyên công việc đang làm.

---

## 📌 THÔNG TIN DỰ ÁN & TIẾN ĐỘ THỰC TẾ

| Key | Value | Trạng thái |
|-----|-------|:----------:|
| **Cuộc thi** | VibeCoding 2026 — AI × Mini App (Bảng B) | Đang diễn ra |
| **Đề số** | 04 — Chatbot FAQ & Đặt lịch tư vấn | Đã chốt phạm vi |
| **Deadline** | 08/11/2026 (Asia/Saigon; tính thời gian còn lại theo ngày hiện tại) | Gấp |
| **Tên sản phẩm** | **OmniChat AI (SaaS Multi-Industry)** | Đã chốt |
| **Dự án mẫu thực chiến** | **Golden Palace (Tiệc cưới, Hội nghị & F&B)** | ✅ Showcase Client chuẩn |
| **GitHub Repo** | `https://github.com/tvchinh1423-sys/goldenchat-vibecoding` | ✅ Đã tạo & push origin/main |
| **Môi trường .env** | Đã có `.env.local` và `.env.example` | ✅ Đã cấu hình |
| **Màn hình Huấn luyện Bot** | `/training` hỗ trợ Multi-Industry Presets + Golden Palace | ✅ Hoàn thành (Chinh) |
| **Upload Excel FAQ** | `/api/training/upload` parse & mẫu Excel Golden Palace | ✅ Hoàn thành (Chinh) |
| **Webhook Botcake đa kênh** | `/api/webhook/botcake` (Facebook + Zalo cá nhân) | ✅ Hoàn thành (Chinh) |
| **Khung Simulator Thử bot** | Test thực đơn, xem sảnh, guardrail, bóc tách SĐT | ✅ Hoàn thành (Chinh) |
| **Trang Cấu hình Kênh & SLA** | `/settings` quản lý Botcake, Telegram, Web Widget, SLA | ✅ Hoàn thành (Chinh) |
| **Web Chat Widget nhúng** | `/widget` Khung chat nhúng cho website doanh nghiệp | ✅ Hoàn thành (Chinh) |
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
   - Bên phải: **Phễu khách hàng / Phễu tư vấn (Funnel Chart)** thể hiện tỷ lệ chuyển đổi qua từng bậc:
     - `N1 · Lead thô` ➔ `N2 · Tiềm năng` ➔ `N3 · Khảo sát 1-1` ➔ `N4 · Chính thức` ➔ `N5 · Nuôi dưỡng` / `N0 · Đã mất`.
4. **Màn hình Quản lý Lead — Dạng Bảng Phễu Kanban (`/leads` view 2):**
   - Thanh thống kê tỷ lệ % từng giai đoạn trên cùng.
   - 6 cột Kanban kéo thả trực quan:
     - `N1 · LEAD THÔ`
     - `N2 · TIỀM NĂNG`
     - `N3 · KHẢO SÁT 1-1`
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

---

## 🔄 QUY TRÌNH PHỐI HỢP & ĐỒNG BỘ GITHUB (BẮT BUỘC)

Để cả Chinh và Chị Hiền luôn biết đối phương đang làm tới đâu:

### Trước mỗi task và sau mỗi mốc hoàn thành

- Đọc skill này và `git status --short`, xác định nhánh/upstream, chạy `git fetch origin --prune`, xem log/diff mới từ `origin/main` và nhánh làm việc trên origin nếu có. Fetch chỉ tải lịch sử; cần tích hợp các cập nhật liên quan vào nhánh đang làm.
- Nếu có thể tiến thẳng, chạy `git merge --ff-only origin/main` và tương tự với upstream của nhánh. Nếu lịch sử đã phân kỳ, kiểm tra diff rồi merge nhánh liên quan, giải quyết xung đột theo phân công module và chạy kiểm tra phù hợp. Không tự đổi quyết định nghiệp vụ của bên kia.
- Giữ nguyên thay đổi chưa commit và file chưa được theo dõi. Nếu việc tích hợp sẽ đè chúng, tạo checkpoint riêng cho phần đã kiểm tra hoặc dùng worktree tách biệt; không tự stash toàn bộ, reset, clean hay force push. Nếu xung đột cần Chinh quyết định, tiếp tục phần độc lập và báo rõ file/vấn đề.
- Đọc lại skill sau khi nhận thay đổi từ GitHub. Mọi quyết định đã chốt, thay đổi API/schema, chức năng đã làm, kết quả kiểm tra và việc cần Chinh nối tiếp phải được cập nhật vào skill ngay tại mốc tương ứng, trước khi commit. Phân biệt rõ demo cục bộ, đã kiểm tra, đã push và đã tích hợp dịch vụ thật.
- Chỉ stage các file thuộc task đã đọc/kiểm tra, kèm skill khi ngữ cảnh thay đổi; xem `git diff --cached` rồi commit với tiền tố `feat`, `fix`, `docs`, `chore`. Không dùng `git add .` để gom code dở hoặc file môi trường. Không đưa khóa API/token/dữ liệu khách thật lên Git hoặc vào skill.
- Push nhánh hiện tại, thiết lập upstream khi chưa có. Giữ nhánh `hien/frontend-ai` hiện hữu; nhánh mới dùng tiền tố `codex/`. Code tính năng đi qua nhánh/PR để Chinh tích hợp; tài liệu phối hợp chung có thể cập nhật `main` bằng push fast-forward sau khi kiểm tra đúng phạm vi. Không tự merge code chưa kiểm tra lên `main`.
- Nếu push bị từ chối vì có commit mới: fetch, đối chiếu, tích hợp và kiểm tra lại trước khi thử lại; không lặp vô hạn. Nếu lỗi xác thực/mạng, giữ commit cục bộ, báo đúng bước chưa đồng bộ và tiếp tục phần không phụ thuộc. Chỉ báo đã đồng bộ sau khi xác minh hash remote với commit đã push.
- Trước khi kết thúc phiên, fetch lần cuối, kiểm tra phần local/remote còn chênh lệch, cập nhật skill và báo ngắn gọn kết quả cùng điểm cần nối tiếp. Cơ chế này chạy trong các phiên làm việc của agent; chỉ hẹn chạy ngoài phiên khi người dùng yêu cầu một lịch tự động cụ thể.

### Trạng thái phối hợp gần nhất — 05/11/2026 (Asia/Saigon)

- Máy Hiền đã bật lịch tự động mỗi giờ trong chat này: `Đồng bộ OmniChat với Chinh` (automation ID `ng-b-omnichat-v-i-chinh`). Mỗi lượt đọc skill, fetch/tích hợp cập nhật phù hợp, kiểm tra rồi push phần hoàn thành; vẫn đồng bộ trước/sau task. Không tạo lịch trùng và không commit chỉ để ghi lượt kiểm tra không có thay đổi.
- Đã nhận commit `76874b4` từ Chinh trên `origin/main` về quy tắc đồng bộ liên tục.
- Đã fetch commit `0f18646` của Chinh (Training, upload FAQ, Simulator, webhook Botcake). Mốc đồng bộ trước giữ trong worktree riêng; mốc Inbox Module 1 bên dưới đã tích hợp code hai bên. Chưa xác minh các dịch vụ thật.
- Workspace Hiền ở nhánh `hien/frontend-ai`; mốc Inbox bên dưới ghi nhận mã nguồn và kiểm thử mới nhất. Không tự merge tính năng lên main.
- `handoff/supabase_schema.sql` đang có thay đổi cục bộ khác schema N1–N5 trên main; cần đối chiếu trước khi tích hợp, giữ yêu cầu nghiệp vụ phễu N1–N5/N0.
- Người dùng đã hoàn tất đăng nhập Git Credential Manager bằng `ritapham94-cloud` trong phiên này. Khi báo kết quả đồng bộ, luôn kiểm tra push thành công và hash remote; lịch sử commit là nguồn đối chiếu, không lưu hash của chính commit đang tạo vào skill.

### Mốc Inbox Module 1 — 05/11/2026 (Hiền)

- Đã dựng `app/(dashboard)/inbox/page.tsx`, component trong `components/inbox`, UI primitive shadcn/Radix và kiểu dữ liệu/fixture trong `lib/inbox`. Có search không dấu/SĐT, tab, lọc đa kênh/lịch hẹn/liên hệ, chat, ảnh/emoji/thả tim, cờ AI từng hội thoại, ghi chú, phân công, hoàn tất/lưu trữ/khôi phục, form tạo lead kiểm tra dữ liệu. Mobile chuyển danh sách/chat và drawer thông tin.
- Đây là **demo cục bộ**: localStorage có kiểm tra snapshot và báo lỗi lưu; tin nhắn không gửi qua Botcake, lead chưa ghi Supabase, AI switch chỉ lưu cờ. Soạn nháp dùng FAQ trong `mock_data.json` để người dùng duyệt, chưa phải AI Engine. File mẫu không có hội thoại nên đã bổ sung fixture minh họa; không có dữ liệu khách thật.
- Đã kiểm tra riêng Inbox: build Next 14, lint, 8 unit test và 4 Playwright scenario (desktop/mobile; 360–1920 px) đạt. Next 14 trên Windows cần `experimental.webpackBuildWorker: false` để tránh manifest rỗng khi build; giữ workaround trong cấu hình chung.
- Đã tạo checkpoint Inbox và nhận code Training/API của Chinh từ origin/main. Giữ Inbox sở hữu header/viewport riêng trong dashboard layout để tránh hai header; nút Bot mở `/training`. Hợp nhất dependency Radix/Supabase/XLSX, giữ thiết kế Tailwind tương thích hai màn hình. Supabase khởi tạo trễ; API đọc cấu hình/FAQ dùng force-dynamic để build không truy vấn dịch vụ thật. Chưa kiểm thử kết nối Supabase/Botcake thật.
- Kiểm tra **sau tích hợp**: production build (Inbox/Training/Lead placeholder/API routes), lint/TypeScript, 8 unit test, 4 Playwright scenario đều đạt. Có kiểm tra đi từ Inbox sang Training và quay lại; Inbox vẫn chỉ có một header. Không có lỗi runtime ở luồng Inbox đã kiểm tra.
- Giữ nguyên thay đổi schema bàn giao cục bộ, không stage schema trong task giao diện. Lead demo cần ánh xạ sang phễu N1–N5/N0 khi nối CRM/Supabase. Mã hoàn thiện thuộc nhánh `hien/frontend-ai`; trạng thái đồng bộ đối chiếu bằng hash remote, không tự merge vào main. Tiếp theo: Module 2 AI Engine và adapter Inbox/Supabase/Botcake, rồi Module 3 CRM/booking.
- Đã push và xác minh remote `hien/frontend-ai` khớp commit code `457e2b5`. Lần fetch cuối phát hiện `47ac49b` mới trên main đổi Training/API sang SaaS đa ngành và Golden Palace Showcase. Chưa hợp nhất commit nghiệp vụ này vì yêu cầu task hiện tại là Kstudy và quy tắc cốt lõi hiện có vẫn cấm dùng dữ liệu Golden Palace; cần Chinh/Hiền chốt lại phạm vi trước khi thay bộ mẫu. Giữ nguyên bản Inbox Kstudy đã kiểm tra, không tự đổi nghiệp vụ.

### Mốc Golden Palace Showcase — 05/11/2026 (Hiền)

- Đã tích hợp main 49a7c08 (Training đa ngành, Settings, Widget, Inbox hợp nhất). Người dùng xác nhận SaaS đa ngành và Golden Palace showcase; quy tắc cấm Golden Palace cũ hết hiệu lực.
- Inbox dùng BusinessProfile/FAQ từ preset wedding_event chung với Training. Hội thoại phủ thực đơn, sảnh 500 khách ngày 20/11 (cần kiểm tra lịch), đặt cọc, xem sảnh & thử món cuối tuần, tiệc doanh nghiệp. SĐT minh họa xuất hiện trong hộp chưa định danh.
- Khóa localStorage riêng omnichat.inbox.golden-palace.v1 giúp hiện demo mới và giữ nguyên snapshot Kstudy cũ. Chưa gửi Botcake hay ghi lead thật.
- Kiểm tra mốc Inbox Golden Palace: 8 unit test, lint, production build và 4 Playwright scenario desktop/mobile đạt.

### Mốc Module 2 AI Engine — 05/11/2026 (Hiền)

- Đã nhận thêm main a55fb71 (embed.js, Google Sheets FAQ, Telegram Alert).
- lib/ai-engine.ts có generateBotReply/generateDraftReply, Gemini REST hoặc 9Router OpenAI-compatible; dùng Persona/Guardrails và knowledge_base qua lib/ai-context.ts. Đã cấu hình DB mà đọc lỗi thì báo lỗi, không dùng FAQ showcase thay ngành. FAQ rỗng giữ rỗng. Chưa có tenant isolation vì schema hiện tại dùng chung workspace.
- POST /api/ai/draft nối nút Soạn nháp Inbox: chờ/lỗi, hủy kết quả khi sửa/gửi/chuyển/lưu trữ, chỉ điền composer chờ duyệt. Không có khóa thì trả mode demo với FAQ mẫu khi chưa cấu hình DB; lỗi provider không giả làm câu trả lời AI thành công.
- extractLeadInfo export từ engine, logic cục bộ trong lib/lead-extractor.ts: họ tên, SĐT chuẩn hóa, ngày tổ chức giữ nguyên nếu thiếu năm, số bàn; không dùng ngày xem sảnh làm ngày cưới. Cột thông tin/form lead dùng bóc tách từ tin khách.
- Hướng dẫn docs/ai-engine.md, biến môi trường trong .env.example. Máy hiện chưa có khóa Gemini/9Router, Supabase là placeholder; kiểm tra giao thức bằng HTTP mock, chưa xác minh dịch vụ thật. Simulator/Webhook/Widget vẫn giữ adapter của Chinh, chưa gửi tự động qua engine. Guardrails hiện áp dụng bằng system prompt, chưa có kiểm duyệt output độc lập.
- Kiểm tra mốc Module 2: 14 unit/API test (HTTP mock), lint/TypeScript, production build và 5 Playwright scenario đạt; đã xem ảnh desktop Golden Palace. Không cần khóa thật để chạy demo.

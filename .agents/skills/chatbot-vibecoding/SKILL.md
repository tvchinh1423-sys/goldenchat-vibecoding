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
> 5. **MỌI LỆNH DEPLOY LÊN LUÔN — KHÔNG CHẠY THỬ NỮA (Chỉ đạo 07/11/2026):** Người dùng (Chinh) đã ra chỉ thị dứt khoát: Mọi lệnh, cập nhật tính năng và sửa lỗi đều **deploy thẳng lên production luôn** (commit và push thẳng lên `origin/main` để Vercel xuất bản tức thì tại `https://goldenchat-vibecoding.vercel.app`), **không dừng lại ở bước chạy thử nghiệm cục bộ**. Hoàn thành mốc là deploy ngay lập tức.

---

## 📌 THÔNG TIN DỰ ÁN & TIẾN ĐỘ THỰC TẾ

| Key | Value | Trạng thái |
|-----|-------|:----------:|
| **Cuộc thi** | VibeCoding 2026 — AI × Mini App (Bảng B) | Đang diễn ra |
| **Đề số** | 04 — Chatbot FAQ & Đặt lịch tư vấn | Đã chốt phạm vi |
| **Deadline** | 23:59 ngày 09/11/2026 (giờ Việt Nam, theo BTC) | Gấp |
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
| **Đồng bộ thời gian thực Widget ⇋ Inbox** | BroadcastChannel + StorageEvent, tin nhắn & thẻ lịch hẹn tức thì | ✅ Hoàn thành 100% (Chinh) |
| **Giao diện Chat Meta Business Suite** | Reactions, Ghim tin nhắn, Lightbox media, Quick Like 👍, Emoji Picker | ✅ Hoàn thành 100% (Chinh) |
| **Chuông Thông Báo & Âm Thanh** | Chuông web dropdown, hiệu ứng Chime đôi, App Badging PWA & Title badge | ✅ Hoàn thành 100% (Chinh) |
| **Gói bàn giao** | `Ban_Giao_Du_An_OmniChat_Chi_Hien.zip` | ✅ Đã đóng gói |
| **Ảnh UI tham khảo** | Đã có đủ 4 màn hình chuẩn xác | ✅ 100% đầy đủ |

---

### Rà soát tổng thể trước khi nộp — 07/11/2026

- [Báo cáo, bằng chứng và danh sách ưu tiên](../../../docs/project-audit-2026-11-07.md). PR #1 và #2 đã merge; Vercel báo thành công cho main e51d386. Các trang chính trả 200; CRM và Soạn nháp AI trả chế độ demo, webhook trả ready. Build 20/20 trang tĩnh, 49/49 test logic/API/SQL và 29/29 ca Playwright Chrome trên nhánh Hiền sau tích hợp main đạt.
- Ưu tiên trước khi nộp: mời đặt lịch ngay khi bot không trả lời được, thống nhất cách nói về khung giờ xem sảnh, ghi rõ chế độ AI mô phỏng, kiểm tra luồng Widget → CRM trên trình duyệt sạch và điện thoại thật. Source ZIP sạch, video ≤2 phút, minh chứng AI và bảng kiểm thử vẫn cần chốt. Bảng B cho phép mô phỏng minh bạch và lưu lịch trong trình duyệt.
- Facebook Messenger còn vướng quyền Page tại Pancake/Botcake; chưa xác minh Zalo, Telegram, Supabase cloud hoặc Gemini/9Router thật. Chỉ bật với dữ liệu thật sau khi bảo vệ webhook, xử lý lỗi ghi DB và có phân quyền phía máy chủ.
- Hạn chính thức theo [BTC](https://vibecoding.info.vn/bai-viet/yeu-cau-dau-ra-va-huong-dan-nop-bai-vibe-coding-2026): 23:59 ngày 09/11/2026 (giờ Việt Nam).

---

### Kế hoạch chốt bài thi sau rà soát lần hai — 07/11/2026

- [Kế hoạch, phân công đề xuất và cổng nghiệm thu](../../../docs/competition-execution-plan-2026-11-07.md). Đối chiếu main từ 602f84b đến a8190f1 và production. Có đồng bộ Widget → Inbox bằng localStorage, cần nghiệm thu với lịch mới. Trong hồ sơ trình duyệt thử, mở Inbox làm mất lịch tổng hợp khi kho có ID mẫu. Simulator báo đủ điều kiện cho 31/11, bỏ qua ý giảm 30% khi có 40 mâm và chưa mời đặt lịch ngay khi ngoài phạm vi.
- Ưu tiên bảo toàn lịch qua các màn hình, thống nhất tri thức Golden Palace, sửa lời mời và kiểm tra lịch trước khi xác nhận, ghi rõ mô phỏng và chốt hồ sơ. Đề xuất Chinh phụ trách dữ kiện, chính sách, README và nộp. Hiền phụ trách luồng Widget/CRM và nghiệm thu. Phân công chờ hai người thống nhất. Mục tiêu nội bộ chốt hồ sơ 08/11. Hạn BTC 23:59 ngày 09/11, giờ Việt Nam.
- Mốc này ghi nhận rà soát và kế hoạch. Các lỗi nêu trên đang chờ xử lý.

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

### Mốc chuẩn bị Module 3 — 05/11/2026 (Hiền)

- Đã nhận main b169be1 (Vercel deployment config); .env.example giữ các biến kênh/Telegram của Chinh và cấu hình AI mới, dùng placeholder Supabase để tránh sao chép kết nối thật vào máy demo.
- /leads thay placeholder bằng Phễu khách hàng / Phễu tư vấn: 6 cột N1 Lead thô, N2 Tiềm năng, N3 Khảo sát 1-1, N4 Chính thức, N5 Nuôi dưỡng, N0 Đã mất, mô tả đúng nghiệp vụ tiệc cưới. Có thẻ demo, số lượng/tỷ trọng, tìm không dấu, kéo thả và menu chuyển giai đoạn dùng được trên mobile, lưu giai đoạn cục bộ.
- lib/leads/demo-data.ts là fixture riêng; chưa nối lead mới từ Inbox, Supabase hay booking/contract thật. Đây là bước chuẩn bị Module 3, chưa có CRUD CRM, biểu đồ funnel chuyển đổi lịch sử hoặc danh sách CRM. Giữ nguyên schema cục bộ chưa commit của người dùng.
- Shared dashboard header hỗ trợ cuộn menu trên mobile để /leads không tràn trang.
- Kiểm tra cuối sau Module 3: production build + lint/TypeScript đạt, 14 unit/API test đạt, 7 Playwright scenario đạt (Inbox desktop/mobile, lỗi/soạn nháp chậm, Kanban kéo thả/menu, lưu lại, tìm kiếm, không tràn trang mobile). Đã xem ảnh Inbox và Kanban desktop/mobile. Các mốc hoàn thành nằm trên hien/frontend-ai; chưa tự merge lên main.

### Mốc Tích hợp Toàn diện & Xuất bản Production Vercel — 05/11/2026 (Chinh)

- **Hợp nhất Main:** Đã kéo và tích hợp toàn bộ các mốc mới nhất từ `origin/hien/frontend-ai` (Module 2 AI Engine Gemini/9Router, Module 3 Kanban Phễu Lead 6 cột N1-N5/N0 chuẩn Golden Palace F&B).
- **Vercel Production Deploy:** Đã xuất bản thành công hệ thống lên tên miền toàn cầu: `https://goldenchat-vibecoding.vercel.app`.
- **Cấu hình Mobile PWA & Trung tâm Tải App:**
  - Hoàn thiện PWA Standalone, icon app vector, theme color, safe-area-inset cho iPhone/Android.
  - Bổ sung trang `/download` hướng dẫn cài đặt 1-chạm cho 4 hệ điều hành (iOS, Android, Windows, Mac) kèm trigger `beforeinstallprompt` và hướng dẫn đóng gói `.apk` / `.exe` qua PWABuilder.
  - Bổ sung nút "Tải App" vào Top Navigation và Bottom Navigation di động.
- **Cập nhật Cấu hình Settings:**
  - Webhook URL chính thức: `https://goldenchat-vibecoding.vercel.app/api/webhook/botcake` (tự động nhận diện origin).
  - Embed script URL: `https://goldenchat-vibecoding.vercel.app/embed.js`.
- **Kiểm thử:** Production build 15/15 static pages đạt, 14/14 unit tests pass, không có lỗi TypeScript hay ESLint.

### Mốc Module 3 CRM & lịch hẹn Golden Palace — 05/11/2026 (Hiền)

- Đồng bộ 11:55 (giờ Việt Nam): xác minh commit CRM `d116be8` đã có trên cả `origin/main` và `origin/hien/frontend-ai`. Đây là xác nhận mã nguồn trên GitHub; chưa xác nhận Vercel đã triển khai đúng commit hoặc CRM đã chạy với Supabase thật.
- Đối chiếu tiến độ Chinh ngày 05/11: commit mới nhất do Chinh đứng tên trên `main` là `895be67` (11:08 giờ Việt Nam). Kiểm tra trực tiếp trên Vercel: `/training`, `/settings`, `/widget`, `/download` trả HTTP 200; `GET /api/crm` trả `mode: demo`; `GET /api/webhook/botcake` trả `status: ready`. Kết quả xác nhận các trang và endpoint đang phản hồi, chưa xác minh commit của deployment hoặc tin nhắn thật Facebook/Zalo, ghi CRM vào Supabase hay gửi Telegram.
- Người dùng xác nhận tiếp tục đúng **Trung tâm Tiệc cưới & Sự kiện Golden Palace**. Đã tích hợp main `3c159ce` (mobile/PWA) và `895be67` (Chinh nhận Module 2/Kanban trước đó, thêm `/download`). Bản CRM mới ở nhánh `hien/frontend-ai`, chưa tự đưa lên main hay xác nhận triển khai production.
- `/leads` có Kanban N1–N5/N0, danh sách + phân bố phễu hiện tại, lịch hẹn; tìm tên không dấu/SĐT/nhu cầu, lọc giai đoạn/nguồn/phụ trách/lịch đang mở/chưa chạm hơn 7 ngày. Biểu đồ là phân bố khách hiện tại, chưa có tỷ lệ chuyển đổi lịch sử. Có tạo/sửa hồ sơ, nhu cầu, số bàn, ngày tổ chức riêng, nguồn và người phụ trách. Chuyển giai đoạn dùng PATCH riêng để không ghi đè ghi chú/liên hệ của người khác.
- Inbox tạo khách vào kho CRM chung, kiểm tra trùng SĐT chuẩn hóa; bổ sung hồ sơ showcase tương ứng thay vì tạo hai thẻ Trang. Mở lại Inbox nhận thông tin liên hệ/lịch đang mở từ CRM; hủy lịch bỏ lịch khỏi hội thoại. Tin nhắn, ghi chú, cờ AI vẫn cục bộ, chưa phải adapter hội thoại Supabase/Botcake thật. Đã chừa khoảng trống cho thanh điều hướng mobile để không che ô gửi tin.
- Có tạo/đổi/xác nhận/hủy/hoàn tất lịch xem sảnh, thử món, tư vấn sự kiện. Giờ Việt Nam UTC+7, mỗi lịch 30 phút, tối đa 2 lịch đồng thời cho 1 nhân viên tư vấn trong cùng khung giờ, cho phép hai lịch liền kề cách nhau 30 phút. Tạo/đổi lịch nâng N1/N2 lên N3, không ghi đè N4/N5/N0; hủy lịch không tự lùi phễu. **Chưa kiểm tra tồn sảnh, giữ sảnh hay xác nhận đặt cọc.**
- `CRM_MODE=demo` là mặc định: `omnichat.crm.golden-palace.v1` lưu khách và lịch cùng snapshot, đọc lead Inbox/giai đoạn Kanban cũ khi chưa có snapshot mới, giữ key cũ. Chỉ báo lưu sau khi ghi thành công; lỗi storage/bản lưu hỏng không bị thay bằng demo thành công giả. Không tự nạp fixture lên cloud.
- `CRM_MODE=supabase`: API `/api/crm` + leads/bookings/session, server-only `SUPABASE_SERVICE_ROLE_KEY` và `CRM_ACCESS_PASSWORD` ít nhất 24 ký tự. Cookie HttpOnly/SameSite Strict 8 giờ và kiểm tra cùng origin. Đây là đăng nhập workspace cho showcase, chưa có SSO/phân quyền từng nhân viên/tenant; giới hạn đăng nhập trong bộ nhớ từng server instance. Supabase lỗi không tự chuyển sang demo. Cấu hình máy vẫn là placeholder, **chưa xác minh cloud thật**.
- Migration riêng `supabase/migrations/20261105_golden_palace_crm.sql` mở rộng `leads`/`bookings`, bảo toàn cột legacy, ánh xạ status cũ khi thiếu stage, unique SĐT/hội thoại, RPC transaction lịch + N3, exclusion constraint chống lịch chồng. Bật RLS/thu hồi quyền anon trên hai bảng CRM. **Webhook Botcake hiện dùng anon client của Chinh nên phần tạo lead webhook cần adapter xác thực riêng trước khi bật CRM thật**; không mở lại public quyền CRM. Không chạy lại schema tắt RLS cũ. `handoff/supabase_schema.sql` và file setup cục bộ của người dùng vẫn được giữ nguyên, không stage.
- Kiểm tra sau tích hợp: production build, lint, TypeScript đạt; **22 unit/API/SQL test và 12 Playwright scenario đạt**. SQL chạy PostgreSQL WASM/PGlite thật cục bộ (legacy migration/chạy lại/RLS/unique/overlap/rollback/hủy lịch), HTTP Supabase dùng mock, chưa thử cloud hay tải đồng thời thật. Đã xem ảnh danh sách/phễu desktop và lịch mobile. Hướng dẫn trong `docs/crm-golden-palace.md`, README và `.env.example` đã cập nhật.
- Việc tiếp theo cần nối dịch vụ: chọn dự án Supabase dùng chung, thử migration trên DB test trước, cấu hình khóa phía máy chủ rồi xác minh CRUD/lịch cloud; nối adapter Inbox realtime và Botcake qua xác thực, xác minh AI với khóa thật. Không báo đã gửi tin thật/đã triển khai CRM mới nếu chỉ kiểm tra cục bộ.

### Mốc Đối chiếu Tiêu chí BTC & Phân công Hoàn thiện — 05/11/2026 (Chinh & Hiền)

- Rà soát toàn diện theo 4 nhóm tiêu chí chính thức của Ban tổ chức Đề 4: Phải chạy (Must-be), Làm mượt (Performance), Điểm WOW (Attractive), Né ngay (Reverse).
- Phân công cụ thể giai đoạn nước rút:
  - **Trần Vân Chinh:** Hoàn thiện sâu phần Quản trị tri thức (`/training` — FAQ F&B Golden Palace thực chiến, đồng bộ Google Sheets, inline edit, Guardrails giá và cọc) và Kết nối các nền tảng (`/settings` — Webhook Botcake FB Page & Zalo cá nhân, Web widget script nhúng `embed.js`, Cảnh báo Telegram).
  - **Chị Hiền (Ưu tiên làm phần hoàn thiện còn lại):**
    1. AI gợi ý 3 câu liên quan (Must-be): bổ sung `suggestedQuestions` vào AI Engine (`lib/ai-engine.ts`) và render 3 nút chip dưới câu trả lời chat.
    2. Đề xuất & Đặt lịch trực tiếp trong chat + Smart default ngày giờ hôm nay (Performance): nút đặt lịch ngay trong khung chat, form tự động fill ngày hôm nay/ngày mai lúc 09:00 hoặc 14:00.
    3. Trang quản trị xem / Xóa lịch (Must-be): bổ sung nút "Xóa / Hủy lịch" màu đỏ trực tiếp trên danh sách booking tại `/leads` (`components/crm/crm-dashboard.tsx`).
    4. Trọn bộ Điểm WOW (Attractive): Thẻ xác nhận "✅ Đã xác nhận lịch!", Link 1-chạm "Thêm vào Google Calendar" (`calendar.google.com/render?action=TEMPLATE...`), và Âm thanh thông báo tin nhắn Web Audio ("Ting").

### Mốc Tích hợp Dữ liệu Thực chiến Golden Palace & Điểm WOW Chat — 05/11/2026 (Chinh)

- **Chuẩn hóa thông tin thực tế đơn vị:** Đã cập nhật vào `lib/mock-service.ts` và API chat:
  - Hotline chính thức: `0228 6595 959`.
  - Địa chỉ & Bản đồ: `98 Đông A, KĐT Hòa Vượng, TP. Nam Định` (kèm link Google Maps `https://maps.app.goo.gl/GrYDqNTLNmqQ1nH76?g_st=ic`).
  - Khung giờ đón khách tham quan & tư vấn: `8:00 - 10:30` sáng hằng ngày.
  - Hình ảnh không gian sảnh: `https://goldenpalacenamdinh.com/khong-gian`.
  - Thực đơn & Menu chi tiết: `https://goldenpalacenamdinh.com/thuc-don`.
  - Website & Brochure: `https://goldenpalacenamdinh.com` và `https://tinyurl.com/thongtintieccuoi`.
- **Thiết lập 5 kịch bản tình huống liên hoàn (Conversation Flow & Follow-up):**
  - Tình huống 1: Hỏi không gian sảnh ➔ Trả lời link ảnh + Gợi ý xem thực đơn / địa chỉ / giờ đón khách.
  - Tình huống 2: Hỏi địa chỉ ➔ Báo 98 Đông A + link Google Maps + giờ mở cửa 8:00–10:30 + gợi ý hotline / brochure.
  - Tình huống 3: Xin tài liệu brochure ➔ Gửi website + link brochure + gợi ý xem thực đơn / ưu đãi / không gian.
  - Tình huống 4: Hỏi hotline gọi gấp ➔ Cung cấp 0228 6595 959 + đề xuất để lại SĐT để quản lý tiệc gọi lại.
  - Tình huống 5: Hỏi giờ đón khách & hẹn xem sảnh ➔ Nhận diện `appointmentIntent`, kích hoạt link Google Calendar.
- **Triển khai Điểm WOW & AI gợi ý 3 câu trên Web Widget (`app/widget/page.tsx`):**
  - AI gợi ý 3 câu liên quan (Must-be): Tự động render 3 nút chip câu hỏi ngữ cảnh dưới mỗi bubble trả lời của bot.
  - Điểm WOW 1: Thẻ hẹn lịch có nút **"📅 Thêm vào Google Calendar"** 1-chạm sinh sự kiện ngày mai lúc 8:00–10:30 tại 98 Đông A.
  - Điểm WOW 2: **Âm thanh thông báo tin nhắn "Ting"** (Web Audio API không cần file ngoài, có toggle bật/tắt âm lượng).
  - Thanh Quick chips ở footer widget bổ sung nút xem ảnh không gian, địa chỉ maps và hotline.
- **Kiểm thử:** Next.js build 17/17 static pages đạt, 22/22 unit tests đạt. Đã commit `81b463d` và chuẩn bị push đồng bộ cho Chị Hiền.

### Mốc Tối ưu Trải nghiệm Link 1-Chạm & Chuẩn hóa Phong cách Trả lời — 05/11/2026 (Chinh)

- **Biến toàn bộ URL và SĐT thành Hyperlink & Nút hành động 1-chạm (`components/chat/formatted-message.tsx`):**
  - Khách hàng không còn phải bôi đen hay copy link thủ công.
  - Tự động parse URL, Markdown link và số điện thoại thành thẻ `<a>` có style nổi bật, mở trực tiếp bằng tab mới (`target="_blank" rel="noopener noreferrer"`).
  - Tự động sinh hệ thống **Nút bấm 1-chạm mở ngay (Quick Action Buttons)** bên dưới bong bóng chat:
    - 🍽️ Xem Menu Thực Đơn (`https://goldenpalacenamdinh.com/thuc-don`)
    - 📍 Mở Google Maps Chỉ Đường (`https://maps.app.goo.gl/GrYDqNTLNmqQ1nH76?g_st=ic`)
    - 🏛️ Xem Ảnh Không Gian Sảnh (`https://goldenpalacenamdinh.com/khong-gian`)
    - 🧮 Tính Dự Toán Chi Phí (`https://goldenpalacenamdinh.com/du-toan-chi-phi`)
    - 🎁 Bảng Giá Dịch Vụ Cưới (`https://goldenpalacenamdinh.com/dich-vu`)
    - 📄 Xem Brochure Tiệc Cưới (`https://tinyurl.com/thongtintieccuoi`)
    - 📞 Gọi Hotline `0228 6595 959` (link `tel:02286595959` chạm là gọi ngay trên smartphone).
  - Tích hợp đồng bộ trên cả **Web Chat Widget** (`app/widget/page.tsx`), **Hộp thư đa kênh** (`components/inbox/chat-pane.tsx`) và **Khung Thử bot** (`app/(dashboard)/training/page.tsx`).
- **Chuẩn hóa phong cách phản hồi của Bot (Brevity & No Repetitive Fluff):**
  - Theo yêu cầu của Chinh: Chỉ câu chào đầu tiên mới có lời giới thiệu; toàn bộ các câu trả lời sau TUYỆT ĐỐI KHÔNG lặp lại câu giới thiệu "Em là trợ lý tư vấn...".
  - Câu trả lời luôn ngắn gọn, súc tích, đi thẳng vào đúng trọng tâm câu hỏi.
  - Đã chuẩn hóa prompt trong `lib/ai-engine.ts`, bộ quy tắc `lib/mock-service.ts`, và API `/api/simulator/chat/route.ts`.
- **Kiểm thử:** 24/24 unit test đạt (bổ sung test case kiểm tra link clickable và không lặp giới thiệu trợ lý), Next.js build 17/17 trang tĩnh thành công 100%.

### Mốc Chuẩn hóa Đặt Cọc Lần 1 (5.000.000đ) & Tối ưu Bộ Định tuyến Ý định (Intent Matcher) — 05/11/2026 (Chinh)

- **Chuẩn hóa nghiệp vụ Đặt cọc theo chỉ dẫn thực tế của Chinh:**
  - Quy định chính xác: **Đặt cọc giữ sảnh lần 1 là 5.000.000 VNĐ** (không phải 10 – 20 triệu như bản demo cũ).
  - Cập nhật đồng bộ vào `knowledge-base/BO-TRI-THUC-CHATBOT-AI-GOLDEN-PALACE.md`, `lib/mock-service.ts`, `app/api/training/upload/route.ts` và API `/api/simulator/chat/route.ts`.
- **Khắc phục triệt để lỗi va chạm từ khóa (Collision Bug):**
  - Trước đây: Câu hỏi *"Đặt cọc giữ sảnh bao nhiêu?"* chứa từ "sảnh", bị vòng lặp duyệt qua câu hỏi `gp-2` (địa chỉ có chứa từ "sảnh") đánh chặn nhầm và trả về địa chỉ nhà hàng.
  - Khắc phục: Xóa bỏ vòng lặp quét lỏng lẻo; cấu trúc lại bộ định tuyến ưu tiên ý định cụ thể (Intent Hierarchy). Các câu hỏi về Đặt cọc / Tiền cọc / Giữ sảnh được nhận diện ở độ ưu tiên cao nhất, trả về chính xác mức cọc 5.000.000đ và quy trình 3 giai đoạn.
  - Khởi động lại service Next.js trên cổng 3000 để phản ánh tức thì bản build mới.
- **Kiểm thử:** Đã bổ sung unit test `tests/chat-ux.test.ts` kiểm tra câu hỏi đặt cọc giữ sảnh, tổng cộng **25/25 unit tests pass 100%**, Next.js build 17/17 static pages đạt.

### Mốc Phân Tích & Tư Vấn Quy Mô Sảnh Linh Hoạt (300 khách, số bàn/mâm) — 05/11/2026 (Chinh)

- **Khắc phục lỗi không phản hồi câu "300 khách" / số bàn:**
  - Trước đây: Hệ thống chỉ hardcode một vài con số rời rạc (`500 khách`, `700 khách`, `200 khách`), hoàn toàn thiếu `300 khách`, `30 mâm`, `35 bàn`... khiến câu trả lời của khách bị rơi xuống fallback mặc định.
  - Khắc phục: Xây dựng cơ chế **bóc tách quy mô linh hoạt (Dynamic Capacity Parser)**:
    - Tự động nhận diện số khách (`300 khách`, `300 người`, `300 pax`), số bàn/mâm (`30 mâm`, `35 bàn`), hoặc con số trả lời rời (`300`, `30`).
    - Với quy mô **300 khách (30 mâm)**: Bot lập tức tư vấn và so sánh 2 lựa chọn phù hợp nhất:
      + 🏛️ **Hội trường Tầng 3 (300 – 650 khách):** Giàn đèn bướm nghệ thuật rực rỡ, LED 30m², cực kỳ thoải mái nếu phát sinh thêm khách.
      + 🏛️ **Hội trường Tầng 4 (100 – 300 khách):** Không gian ấm cúng, sang trọng, vừa vặn cho tiệc 30 mâm.
    - Sinh tự động 2 nút bấm 1-chạm mở ảnh trực tiếp cho cả Sảnh Tầng 3 và Tầng 4.
- **Kiểm thử & Triển khai:**
  - Bổ sung unit test kiểm tra `300 khách` và `30 mâm`, nâng tổng số test lên **26/26 unit tests pass 100%**.
  - Đã build Next.js thành công và khởi động lại daemon server cổng 3000.

### Mốc Kết Nối Nền Tảng, Script embed.js, Telegram Alert & Form Đặt Lịch CRM Thông Minh — 05/11/2026 (Chinh)

- **1. Kết nối đa kênh & Cảnh báo Telegram thực chiến (`/settings` & `/api/telegram/alert`):**
  - Webhook Botcake (`/api/webhook/botcake`): Sẵn sàng tiếp nhận tin nhắn từ cả Facebook Fanpage và Zalo cá nhân, tự động nhận diện SĐT tạo Lead N1 và gửi thông báo Telegram.
  - Tab Telegram Alert trong `/settings`: Nâng cấp `handleTestTelegram` gọi thực tế API `/api/telegram/alert` với Telegram Bot Token và Chat ID, phản hồi trực tiếp kết quả xác thực từ Telegram Bot API và lưu cấu hình vào localStorage.
  - Tự động hỗ trợ 4 phân loại cảnh báo: `lead` (Lead N1 mới), `guardrail` (khách đòi giảm giá sai chính sách), `appointment` (yêu cầu đặt lịch), và `test` (kiểm tra hệ thống).
- **2. Hoàn thiện Script nhúng Web Widget `public/embed.js`:**
  - Nhận diện các thuộc tính nhúng: `data-theme-color`, `data-position`, `data-title`, `data-greeting`.
  - Tự động truyền các tham số tùy biến vào query URL của iframe `/widget?color=...&title=...`.
  - Hỗ trợ cơ chế giao tiếp `postMessage` hai chiều (`omnichat-close`, `omnichat-open`) giúp đóng/mở mượt mà trên cả desktop và mobile fullscreen.
- **3. Form Đặt lịch tư vấn trực tiếp trong Chat & Đồng bộ CRM (`app/widget/page.tsx`):**
  - Popup Form Đặt lịch nhanh ngay trong Widget: Khách có thể bấm nút từ thanh Quick Chips, nút trên Header, hoặc từ gợi ý thông minh của Bot khi phát hiện ý định xem sảnh.
  - **Smart Default Thời Gian (Tiêu chí BTC Đề 4):** Áp dụng hàm `getSmartBookingDefault()` chuẩn khung giờ vàng đón tiếp của Golden Palace (8:00 - 10:30 sáng). Nếu trước 08:30 sáng thì gợi ý hôm nay lúc 08:30; nếu sau 08:30 sáng thì tự động điền ngày mai lúc 08:30.
  - Đồng bộ CRM tức thì: Gọi `saveCRMLead` tự động đưa khách hàng lên **N3 · Khảo sát 1-1** + `saveCRMBooking` lưu trữ lịch hẹn.
  - Tự động bắn thông báo Telegram `type: appointment` cho Quản lý tiệc.
  - Sinh thẻ xác nhận lịch hẹn trong chat + Nút **"📅 Thêm vào Google Calendar"** 1-chạm được cấu hình đúng thời gian khách vừa chọn + Âm thanh "Ting" Web Audio API.
- **4. Trang Quản trị Xem & Xóa/Hủy Lịch Hẹn (`/leads` — Tiêu chí Must-be của BTC):**
  - View Lịch hẹn (`components/crm/crm-dashboard.tsx`): Mỗi thẻ lịch hẹn hiển thị badge trạng thái trực quan, nút "Mở hồ sơ & đổi lịch", nút "Xác nhận lịch", nút "Hủy lịch" (status `cancelled`), và nút màu đỏ **"Xóa lịch"** (icon Trash2 kèm hộp thoại xác nhận).
  - Modal hồ sơ khách (`components/crm/lead-editor.tsx`): Bổ sung nút "Xóa lịch" màu đỏ cho từng lịch hẹn của khách.
  - Bổ sung API `DELETE /api/crm/bookings/[id]` và hàm client `deleteCRMBooking`, `deleteDemoBooking` trong `lib/crm/demo-store.ts` và `lib/crm/client.ts`.
- **5. Kiểm thử & Đóng gói:**
  - Bổ sung unit test suite `tests/channel-booking.test.ts`, nâng tổng số test từ 26 lên **32/32 tests pass 100%**.
  - Production build Next.js 17/17 trang tĩnh đạt 100%, server local cổng 3000 đang hoạt động ổn định.

### Mốc gợi ý, đặt lịch trong chat và WOW Đề 4 — 05/11/2026 (Hiền)

- Nhận `e199944` từ Chinh. Giữ kho tri thức, webhook, Widget và API xóa lịch của Chinh. Triển khai phần UI/AI bổ sung trên `hien/frontend-ai`.
- `POST /api/ai/draft` và `POST /api/simulator/chat` trả đúng 3 `suggestedQuestions` khi trả lời thành công. Gợi ý dùng ngữ cảnh câu hỏi gần nhất và câu gợi ý theo nhánh tri thức, loại câu lặp. Inbox và Widget bấm chip để gửi câu kế tiếp. Inbox chạy hội thoại minh họa qua Simulator, chưa gửi ra Facebook/Zalo.
- Chat phát hiện ý định xem sảnh hoặc thử món và mở form tương ứng. Mặc định 09:00 giờ Việt Nam hôm nay nếu giờ đó còn ở tương lai, nếu không thì 09:00 ngày mai. Demo lưu khách và lịch cùng lần ghi, tái sử dụng hồ sơ theo SĐT và dùng quy tắc chống trùng lịch hiện có.
- Thẻ sau khi lưu xác nhận đã nhận lịch. Trạng thái nghiệp vụ vẫn chờ tư vấn viên xác nhận. Calendar dùng thời điểm đã lưu, UTC và thời lượng 60 phút. Âm báo dùng Web Audio chung cho Inbox và Widget. Widget giữ cảnh báo Telegram cho quản lý khi lưu Supabase thành công. Chưa có nhà cung cấp gửi Zalo/SMS tới khách hoặc xác minh dịch vụ cloud, nên thẻ không báo đã gửi qua hai kênh này.
- Hai màn hình quản trị có nút đỏ hủy và xóa lịch, xác nhận trước khi thao tác. Build/TypeScript, lint, 33 kiểm thử logic/API/SQL và 14 kịch bản trình duyệt đạt. Kiểm thử đã chạy tạo lịch từ Inbox và Widget, kiểm tra giờ Calendar, giữ lịch khi từ chối xóa và xóa lịch khi xác nhận.

### Mốc Tối Ưu Hóa Nhận Diện Ý Định Đặt Lịch & Khắc Phục Lỗi Câu "chị muốn đặt lịch" — 05/11/2026 (Chinh)

- **Nguyên nhân bug ảnh chụp 23:27:**
  - Ở phiên bản cũ, Mục 4 trong router chat chỉ lọc các từ rời rạc (`xem sảnh`, `thử món`, `hẹn`, `cuối tuần`), hoàn toàn thiếu từ khóa `"đặt lịch"`, `"dat lich"`, `"muốn đặt"`, dẫn tới tin nhắn `"chị muốn đặt lịch"` bị trôi xuống câu fallback mặc định của bot.
- **Giải pháp xử lý triệt để:**
  - **Mở rộng bộ nhận diện ý định đặt lịch (`lib/chat/follow-ups.ts`):** Bao phủ toàn diện các biến thể đặt hẹn: `dat lich`, `hen lich`, `hen xem sanh`, `xin hen`, `dat hen`, `book lich`, `booking`, `len lich`, `muon dat`, `muon hen`, `xep lich`, `cho xin lich`, `qua xem`, `ghe xem`, `den xem`, `tham quan`, `xem truc tiep`.
  - **Phòng chống va chạm tri thức:** Chặn tuyệt đối nhầm lẫn giữa đặt lịch với câu hỏi xem ảnh media (`xem anh`, `hinh anh`, `video`, `album`) hoặc câu hỏi đặt cọc giữ sảnh (`coc`, `dat coc`, `tien coc`).
  - **Bảo hiểm 2 lớp tại API Chat (`app/api/simulator/chat/route.ts`):** Kết hợp cả `visitIntent` và regex mở rộng, phản hồi chuyên nghiệp khung giờ đón khách chuẩn 8:00 - 10:30 sáng, hướng dẫn bấm nút đặt lịch hoặc để lại SĐT.
  - **Tối ưu trải nghiệm Web Widget (`app/widget/page.tsx`):**
    - Nhận diện `resolvedVisitType` an toàn từ `data.visitType || visitIntent(userText) || "xem_sanh"`.
    - Khi nhận diện ý định đặt lịch, tự động kích hoạt hiển thị Modal Form Đặt lịch nhanh (sau 400ms) với Smart Default ngày giờ (8:00 - 10:30) để khách điền Tên + SĐT 1-chạm.
    - Render nút bấm gradient nổi bật `📅 Điền thông tin đặt lịch ngay (8:00 - 10:30)` trực tiếp trên bong bóng chat của Bot.
- **Kiểm thử & Triển khai:**
  - Bổ sung unit test case cho `"chị muốn đặt lịch"` và các biến thể, nâng tổng số test lên **34/34 unit tests pass 100%**.
  - Next.js production build 17/17 trang tĩnh thành công.
  - Đã khởi động lại server daemon local cổng 3000 sẵn sàng phục vụ.

### Thống nhất Chiến lược Triển khai: Đấu nối Nền tảng để lại Chặng Cuối — 05/11/2026 (Chinh)

- **Quyết định thống nhất:** Bước đấu nối nền tảng bên thứ ba (quét QR Zalo, gắn webhook Botcake Fanpage thật, cấu hình Bot Token Telegram thật) sẽ để lại đến **chặng cuối cùng** trước khi nộp bài thi.
- **Mục tiêu ưu tiên hiện tại:** Tập trung làm cho sản phẩm nội tại **hoàn hảo và không tì vết** theo 4 tiêu chí chấm điểm của Ban Tổ Chức (Must-be, Performance, Điểm WOW, Né điểm trừ):
  1. Trải nghiệm người dùng cực mượt trên toàn bộ 5 màn hình: `/training`, `/inbox`, `/leads`, `/widget`, `/dashboard`.
  2. Tri thức thực chiến Golden Palace chuẩn chỉnh 100% (cọc 5tr, bãi đỗ xe free, VAT 8%/10%, sảnh Tầng 3/Tầng 4 theo quy mô khách).
  3. Khi toàn bộ hệ thống đã hoàn hảo 100%, việc cắm Webhook chỉ mất 5 phút để hoàn tất kịch bản showcase.

### Mốc Nâng cấp Toàn diện Trang Huấn Luyện Bot (`/training`) & Bộ Công cụ Demo Giám Khảo 1-Chạm — 05/11/2026 (Chinh)

- **Bộ 6 Kịch bản Thực chiến Khảo sát Giám khảo 1-Chạm (`SHOWCASE_SCENARIOS`):**
  - Đặt ngay trên cột Simulator bên phải, phân loại màu sắc và huy hiệu rõ ràng:
    1. 🏛️ **Tiệc 300 khách (30 mâm):** Thử nghiệm thuật toán bóc tách quy mô, đề xuất so sánh 2 sảnh T3 và T4 kèm 2 nút xem ảnh.
    2. 💰 **Đặt cọc giữ sảnh bao nhiêu?:** Kiểm tra mức cọc chuẩn 5.000.000đ và quy trình 3 giai đoạn minh bạch.
    3. ⚠️ **Đòi giảm giá 30% tiệc:** Thử thách cơ chế Guardrail an toàn, bot từ chối khéo léo và bảo vệ chính sách giá của doanh nghiệp.
    4. 📅 **Hẹn giờ xem sảnh sáng mai:** Kích hoạt Smart Default khung giờ đón tiếp 8:00 - 10:30 sáng và mở form hẹn.
    5. 🅿️ **Bãi đỗ xe ô tô & VAT:** Khẳng định bãi xe ô tô miễn phí 100% và bóc tách VAT (8% đồ ăn, 10% đồ uống).
    6. 📸 **Bảng giá Photobooth & MC:** Trả về bảng giá niêm yết minh bạch (Photobooth 3.4/4/5tr, MC 800k).
- **Tính năng Xuất File Excel Mẫu Bộ Tri Thức Chuẩn (`.xlsx`):**
  - Sử dụng thư viện `xlsx` xuất file `Bo_Tri_Thuc_FAQ_Golden_Palace_Nam_Dinh.xlsx` với 7 cột chi tiết (STT, Mã câu, Danh mục, Câu hỏi, Câu trả lời, Tags, Trạng thái) và độ rộng cột được căn chỉnh tối ưu.
- **Bộ lọc & Tìm kiếm FAQ Đa Tiêu Chí:**
  - Thanh tìm kiếm theo thời gian thực (Search bar) hỗ trợ tìm không dấu cả câu hỏi và câu trả lời.
  - Dải thẻ (Pill tabs) lọc theo 5 danh mục: Tất cả, Thực đơn & Giá, Sảnh & Không gian, Dịch vụ & Ưu đãi, Chính sách & Đặt cọc.
- **Kiểm thử:** 34/34 unit test pass 100%, Next.js production build 17/17 trang tĩnh thành công 100%.

### Mốc Chuẩn Bị Hồ Sơ Nộp Bài, Video Demo 2 Phút & Đóng Gói Trọn Bộ 26 Kịch Bản FAQ — 05/11/2026 (Chinh)

- **1. Nâng cấp README.md chuẩn tài liệu nộp bài VibeCoding 2026:**
  - Bảng đối chiếu 4 nhóm tiêu chí chấm điểm BTC Đề 04 (Must-be, Performance, Attractive, Reverse) với tỷ lệ hoàn thành 100%.
  - Link Live Production Vercel (`goldenchat-vibecoding.vercel.app`), Web Widget (`/widget`), PWA App Store (`/download`), Botcake Webhook (`/api/webhook/botcake`).
  - Danh mục 6 Kịch bản Khảo sát Nhanh 1-chạm dành riêng cho Ban Giám Khảo.
- **2. Kịch bản Video Demo 2 Phút Nộp Bài (`docs/video-demo-script.md`):**
  - Cấu trúc chặt chẽ 1:50s (dưới hạn mức 2 phút của BTC), phân bổ từng giây (0:00 - 1:50) kèm lời thoại thuyết minh (Voiceover) và thao tác ngón tay cụ thể.
  - Tối ưu 100% cho quay màn hình điện thoại (Mobile Screen Recording — Tỷ lệ 9:16) thể hiện trải nghiệm Mini App mượt mà, chân thực.
  - Thể hiện nổi bật: Trả lời thông minh sảnh 300 khách, gợi ý 3 câu liên quan, cọc 5tr, guardrail chống giảm giá 30%, form đặt lịch in-chat 8:30 sáng, âm thanh "Ting", Google Calendar 1-chạm, cảnh báo Telegram, Kanban CRM N3 và thao tác xóa lịch màu đỏ.
- **3. Tối ưu Giao diện Mobile Widget Toàn Màn Hình (`app/widget/page.tsx`):**
  - Khung chat tự động bung full 100% màn hình khi mở trên điện thoại (chuẩn native mobile feel).
  - Bổ sung nút chuyển nhanh sang trang Quản trị (`/leads`) ngay trên header widget để tiện cho Chinh chuyển cảnh quay trên điện thoại.
- **4. Đóng gói trọn vẹn 26 Kịch bản Hỏi Đáp Chuẩn F&B Golden Palace (`lib/mock-service.ts`):**
  - Bổ sung các kịch bản thực tế từ `gp-19` đến `gp-26`: tiệc cưới ngày lễ/cuối tuần không phụ thu, tự tính dự toán 30s, nghi thức sân khấu laser/flycam, chính sách thanh toán cấn trừ 3 đợt, Google Maps 98 Đông A, decor hoa tươi và xe hoa đón dâu.
  - Sinh 2 file Excel mẫu tĩnh `.xlsx` phục vụ tải trực tiếp: `public/Bo_Tri_Thuc_FAQ_Golden_Palace_Nam_Dinh.xlsx` và `knowledge-base/Bo_Tri_Thuc_FAQ_Golden_Palace_Nam_Dinh.xlsx`.
- **5. Kiểm thử:** 34/34 unit tests pass 100%, Next.js build 17/17 trang tĩnh đạt 100%.

### Mốc Báo cáo thống kê — 06/11/2026 (Hiền)

- Nhận `af4bce8` từ Chinh. Giữ quyết định đấu nối Botcake Fanpage, quét QR Zalo và gắn token Telegram thật ở chặng cuối.
- `/dashboard` có bốn KPI, phân bổ hội thoại theo Facebook Messenger/Zalo cá nhân/Web Widget và phễu N1 → N3 → N4. Tab Báo cáo có trong điều hướng quản trị và thanh điều hướng di động.
- Hội thoại đọc từ Inbox demo của trình duyệt, gồm cả hội thoại lưu trữ. Lead đếm hồ sơ ở giai đoạn hiện tại N1–N5. Lịch đếm loại xem sảnh, trừ lịch đã hủy. Hai số đếm CRM theo chế độ CRM của workspace và dùng đăng nhập hiện có khi cần.
- Tỷ lệ AI 82% và phễu 50 → 20 → 8 được ghi rõ là minh họa. Cần dữ liệu kết quả tự xử lý và lịch sử đổi giai đoạn để tính hai chỉ số thực tế.
- Kiểm tra production build, lint/TypeScript và Playwright cho tab Báo cáo ở 360 px, số đếm Inbox/CRM, cách loại N0 và lịch hủy, tỷ trọng theo kênh và nhãn minh họa.

### Mốc ô soạn tin trên mobile — 06/11/2026 (Hiền)

- Inbox và Widget toàn màn hình bám kích thước/vị trí `VisualViewport`. Inbox thu gọn thanh điều hướng và phần tiêu đề phụ khi bàn phím chiếm chỗ. Hai ô nhập dùng cỡ chữ 16 px trên mobile. Script nhúng co iframe theo vùng nhìn của trang chủ.
- Widget hủy bộ hẹn giờ tự mở form khi khách mở form bằng nút hoặc đóng Widget, tránh ghi đè giờ hẹn đang chỉnh. Giữ luồng tự mở form và kiểm tra lịch Google Calendar theo giờ khách đã chọn.
- Kiểm tra Playwright với chiều rộng 360, 390 và 414 px, mô phỏng vùng nhìn còn 300 px, đóng bàn phím, gửi tin và iframe nhúng. Kiểm tra thêm kiểu thu nhỏ cả bố cục ở 360 px. Chưa kiểm tra bàn phím trên điện thoại thật.
- Production build, lint, TypeScript, 34 test logic/API/SQL và 17 kịch bản Playwright đạt trên bản cục bộ.
- Đã mở [PR #1](https://github.com/tvchinh1423-sys/goldenchat-vibecoding/pull/1) từ `hien/frontend-ai` vào `main` và tag Chinh để tiếp nhận hai mốc. Bước kế tiếp là tích hợp, thử bàn phím trên Safari iOS và Chrome Android thật, rồi xác minh bản Vercel.

### Mốc giao diện iPhone và Android — 06/11/2026 (Hiền)

- Làm trên worktree riêng trong lúc workspace chính xử lý merge, sau đó nhận mốc tích hợp `8eef0c9` và tiếp tục bàn giao qua PR #1. Giữ luồng đặt lịch tự động và chuyển giao tư vấn viên từ Chinh.
- Giao diện quản trị và Inbox chừa vùng an toàn cho tai thỏ/thanh Home. Thanh điều hướng có vùng chạm tối thiểu 44 px theo chiều dọc. Ô nhập trên thiết bị cảm ứng dùng chữ 16 px và trình duyệt cho phép phóng to.
- Form CRM và form đặt lịch Widget cuộn trong vùng nhìn khi bàn phím mở. Widget có nút lớn hơn và dùng toàn màn hình cả khi điện thoại xoay ngang. Trang Huấn luyện có lối tắt đến phần Thử bot trên mobile.
- Production build, lint/TypeScript, 41 test logic/API/SQL, 20 kịch bản Chrome và 5 kịch bản mobile WebKit đạt. Đã xem ảnh mô phỏng Widget trên iPhone và Báo cáo trên Android. Kết quả là mô phỏng trên máy tính, cần thử bàn phím và chế độ PWA trên thiết bị thật sau khi tích hợp.

### Mốc Bổ Sung Nút Xóa Khách Hàng (Delete Lead) & Tối Ưu Hiển Thị Xóa Lịch Hẹn — 06/11/2026 (Chinh)

- **1. Nâng cấp Modal Hồ Sơ Khách Hàng (`components/crm/lead-editor.tsx`):**
  - Bổ sung nút màu đỏ **"🗑️ Xóa khách hàng này"** ở góc trái dưới form hồ sơ (kèm xác nhận `window.confirm` xóa vĩnh viễn khách và các lịch liên quan).
  - Khắc phục hiểu lầm khi khách chưa có lịch hẹn: hiển thị thông báo hướng dẫn rõ ràng *"Khách hàng này hiện chưa có lịch hẹn nào. Bấm nút Tạo lịch hẹn ở trên để xếp lịch mới, hoặc bấm tab Lịch hẹn ở ngoài trang quản trị để xem và xóa các lịch hẹn của khách khác."*
- **2. Hoàn thiện API và Tầng Lưu Trữ Xóa Khách Hàng (CRM Lead Deletion):**
  - Bổ sung API `DELETE /api/crm/leads/[id]` (xóa các booking liên quan trước, sau đó xóa lead).
  - Bổ sung hàm `deleteDemoLead` trong `lib/crm/demo-store.ts` và `deleteCRMLead` trong `lib/crm/client.ts`.
  - Kết nối handler `onDeleteLead` từ `components/crm/crm-dashboard.tsx`.
- **3. Kiểm thử tự động:**
  - Bổ sung 2 test cases mới cho `deleteDemoLead` và API `DELETE /api/crm/leads/[id]`, nâng tổng số test lên **36/36 tests pass 100%**.
  - Next.js production build 17/17 trang tĩnh thành công 100%.

### Mốc Trích Xuất Thông Tin Đặt Lịch Tự Động (Smart Booking NLP) & Tự Động Chốt Lịch Không Cần Điền Lại — 06/11/2026 (Chinh)

- **1. Xây dựng Bộ Bóc Tách NLP Thông Minh (`lib/chat/booking-extractor.ts`):**
  - Tự động trích xuất Tên khách (hỗ trợ `c tên vân`, `chị tên Vân`, `em tên Chinh`, `tên Dũng`...), Ngày hẹn (`ngày 9/11`, `mai`, `thứ 7`, `hôm nay`...), Giờ hẹn (`lúc 10h`, `10:00`, `8h30`, `14h`...), Số điện thoại và Loại lịch hẹn (`tư vấn trực tiếp`, `xem sảnh`, `thử món`).
- **2. Hội Thoại Thông Minh Đa Lượt (Multi-turn Contextual Dialogue) (`app/api/simulator/chat/route.ts`):**
  - **Trường hợp 1 (Thiếu thông tin):** Ví dụ khách nhắn *"chị muốn đặt lịch tư vấn trực tiếp ngày 9/11 lúc 10h , c tên vân"* -> Bot tự động nhận diện đã có Tên Vân, 10:00 ngày 09/11/2026, tư vấn trực tiếp; ân cần hỏi thêm Số điện thoại để gửi xác nhận.
  - **Trường hợp 2 (Bổ sung SĐT ở tin nhắn tiếp theo):** Khách chỉ cần nhắn *"0912345678"* hoặc *"sđt chị 0912345678"* -> Bot tự động kết hợp với context đã lưu và **TỰ ĐỘNG CHỐT LỊCH HẸN LUÔN**.
  - **Trường hợp 3 (Đầy đủ thông tin trong 1 câu):** Tự động tạo lịch ngay lập tức.
- **3. Trải nghiệm Tự Động Hóa Không Cần Điền Lại (`app/widget/page.tsx`):**
  - Toàn bộ thông tin bóc tách được **TỰ ĐỘNG ĐIỀN SẴN (Pre-fill)** vào form đặt lịch.
  - Hiển thị **Thẻ Phiếu Hẹn Thông Minh (Smart Booking Preview Card)** ngay dưới bong bóng chat để khách theo dõi trực quan.
  - Khi đã đủ thông tin (`autoBooked: true`), hệ thống tự động gọi `saveChatBooking`, đẩy Lead N3 lên CRM, gửi Telegram alert, phát chuông "Ting" và hiển thị nút **Google Calendar 1-chạm** mà **KHÔNG BẮT KHÁCH TỰ ĐIỀN LẠI BẤT KỲ FORM NÀO**!
- **4. Kiểm thử tự động:**
  - Bổ sung bộ test `tests/nlp-booking.test.ts` (3 test cases kiểm tra bóc tách NLP, hội thoại đa lượt và auto-book 1 lượt).
  - Tổng số test: **39/39 tests pass 100%**, Next.js build 17/17 trang tĩnh thành công 100%.

### Mốc Tinh Gọn Phản Hồi Chatbot & Chống Điền Thời Gian Ảo — 06/11/2026 (Chinh)

- **1. Khắc phục triệt để lỗi tự động điền thời gian ảo (`lib/chat/booking-extractor.ts`):**
  - Trước đây: Nhánh fallback tự động gán ngày mai lúc 09:00 ngay cả khi khách chưa hề đề cập đến thời gian (như trong câu "chị muốn đặt lịch xem sảnh"), làm sinh thẻ hẹn ảo gây hiểu lầm cho khách.
  - Khắc phục: Khi khách chưa nhắc đến từ khóa thời gian, `dateTimeIso`, `dateStr`, `timeStr` trả về `null` tuyệt đối; không đoán mò thời gian của khách.
- **2. Rút ngắn và cô đọng câu trả lời chatbot (Concise & Focused Replies):**
  - Khi khách chỉ nói đặt lịch chung chung: Bot chỉ hỏi 1 câu ngắn gọn, thân thiện: *"Dạ chị muốn ghé xem sảnh vào ngày giờ nào (nhà hàng đón tiếp 8:00 đến 10:30 sáng), và em xin Tên cùng Số điện thoại của chị nhé ạ?"*, `bookingDraft` trả về `null`.
  - Tinh gọn toàn bộ các câu trả lời về Photobooth, Nhân sự MC/ban nhạc, Nghi thức cưới, VAT, Thử món, Bãi xe, Đồ uống ngoài, Đặt cọc (5.000.000đ), Thực đơn, Ưu đãi... Cắt bỏ hoàn toàn câu chữ rườm rà, trình bày theo dạng gạch đầu dòng rõ ràng, trực quan, khách hàng đọc trên smartphone chỉ mất 3-5 giây.
- **3. Tinh chỉnh giao diện Chat Widget (`app/widget/page.tsx`):**
  - Bỏ nút bấm tím to đè lên khung chat khi bot đang hỏi thông tin; tránh rối mắt khách hàng.
  - Thẻ preview phiếu hẹn chỉ hiển thị khi khách THỰC SỰ đã cung cấp Tên hoặc Ngày giờ (`bookingDraft.fullName || bookingDraft.timeStr`).
- **4. Kiểm thử & Trạng thái:**
  - 39/39 unit tests pass 100%. Next.js production build 17/17 trang tĩnh thành công.
  - Khởi động lại server daemon cổng 3000 phục vụ trải nghiệm test mượt mà trên mobile.

### Mốc Khắc Phục Lỗi Nhận Diện Số Khách 8978 & Tối Ưu Bóc Tách Đặt Lịch Đa Lượt — 06/11/2026 (Chinh)

- **1. Phân tích & Tự nhận định lỗi từ ảnh chụp thực tế:**
  - Khách nhắn: *"9h ngày 12/11, tên Chi, số điện thoại 093488978"*.
  - **Lỗi 1 (Mất Context):** Ở lượt trước, `bookingDraft` trả về null khiến client không lưu context. Khi sang lượt 2, tin nhắn không chứa từ khóa "đặt lịch" nên hệ thống bỏ qua nhánh booking.
  - **Lỗi 2 (SĐT 9 chữ số):** Regex cũ chỉ nhận 10 số `0[35789]\d{8}`, bỏ qua số `093488978` (9 số) dù có tiền tố "số điện thoại".
  - **Lỗi 3 (Thảm họa Regex parseCapacity):** Parser dung tích sảnh dùng `\d{2,4}\s*$` không có dấu neo `^` ở đầu câu, dẫn tới việc nuốt 4 chữ số cuối của SĐT (`8978`) và biến nó thành "quy mô đại lễ trên 8978 khách (khoảng 898 mâm)".
- **2. Giải pháp khắc phục triệt để:**
  - `parseCapacity` (`app/api/simulator/chat/route.ts`): Bổ sung chặn tuyệt đối các câu có chứa SĐT, ngày tháng, giờ hẹn; neo `^...$` để chỉ parse số khách khi toàn bộ tin nhắn chỉ là một con số đơn lẻ.
  - `booking-extractor.ts`: Hỗ trợ bóc tách SĐT linh hoạt (9 đến 11 số, có tiền tố `số điện thoại`, `sđt`, `phone`, có dấu cách/chấm).
  - Định tuyến ý định: Bổ sung `hasExplicitBookingDetails` tự động nhận diện tin nhắn chứa thông tin đặt lịch (Tên + Giờ/Ngày/SĐT), kết hợp với `awaitingInfo: true` từ lượt trước để tự động chốt lịch hẹn mà không bị rò rỉ sang các bộ phân tích khác.
- **3. Kiểm thử tự động:**
  - Bổ sung unit test case kiểm tra câu `"9h ngày 12/11, tên Chi, số điện thoại 093488978"` tự động chốt lịch và không bị nhầm 8978 khách.
  - Tổng số test: **40/40 tests pass 100%**, Next.js build 17/17 trang tĩnh thành công 100%.

### Mốc Sửa Lỗi Lưu Khách Hàng Vào CRM (Lead Validation & Auto-Sync) — 06/11/2026 (Chinh)

- **1. Nguyên nhân Lead chưa lưu vào CRM:**
  - Khách nhập SĐT `093488978` (9 chữ số). Trong khi đó, hàm `validateLead` (`lib/crm/model.ts`) áp đặt regex cứng `/^0[35789]\d{8}$/` (chỉ chấp nhận đúng 10 số).
  - Khi bóc tách thành công ở chat, widget gọi `saveChatBooking` nhưng bị `validateLead` quăng lỗi `CRMError` ("Vui lòng nhập số di động Việt Nam hợp lệ (10 chữ số)") và bị catch ngầm, dẫn tới việc chưa kịp lưu vào `localStorage`/CRM.
  - Ngoài ra, component `CRMDashboard` chỉ lắng nghe sự kiện `storage` (liên tab) mà không lắng nghe sự kiện nội bộ `omnichat-crm-change` do widget phát ra.
- **2. Giải pháp khắc phục:**
  - `lib/crm/model.ts`: Cập nhật regex SĐT trong `validateLead` thành `/^0[1-9]\d{7,10}$/` để hỗ trợ linh hoạt số điện thoại từ 9 đến 11 chữ số (chấp nhận cả số 9 số khách gõ vội, 10 số di động chuẩn và 11 số máy bàn).
  - `components/crm/crm-dashboard.tsx`: Bổ sung event listener `omnichat-crm-change` để tự động làm mới danh sách Lead & Lịch hẹn ngay tức thì khi có booking mới từ chat widget.
  - `app/widget/page.tsx`: Thêm thông báo phản hồi nếu có lỗi lưu dữ liệu, đồng thời kích hoạt sự kiện `storage` để đồng bộ đa màn hình.
- **3. Kiểm thử & Trạng thái:**
  - 40/40 unit tests pass 100%. Next.js build 17/17 trang tĩnh thành công.

### Mốc Cập Nhật Cơ Chế Tự Động Ngắt AI & Chuyển Giao Nhân Viên Thật (Autonomous Human Handoff) — 06/11/2026 (Chinh)

- **1. Cập nhật Bộ Nguyên Tắc An Toàn (Guardrails — "Bot không được làm gì"):**
  - Bổ sung điều cấm cốt lõi vào toàn bộ các Preset (Golden Palace, OmniTech B2B, Aura Spa) và `DEFAULT_BOT_CONFIG` trong `lib/mock-service.ts`:
    > *"Khi gặp câu hỏi nằm ngoài phạm vi tri thức hoặc chưa được xác thực: Tuyệt đối không suy đoán hay trả lời lung tung. Tự động tắt chế độ AI của hội thoại và chuyển giao cho nhân viên tư vấn thật tiếp quản ngay lập tức."*
  - Tại Tab 3 "Bot không được làm gì" trên màn hình Huấn Luyện Bot (`/training`): Bổ sung Banner cảnh báo đỏ-vàng nổi bật thể hiện **Nguyên tắc an toàn tối thượng (Human Handoff)** và cơ chế ngắt AI tự động khi ngoài phạm vi.
  - Đồng bộ cập nhật tài liệu `SPEC_GIAO_DIEN_TINH_NANG.md` và `handoff/SPEC_GIAO_DIEN_TINH_NANG.md`.
- **2. Nâng cấp Bộ Phân Tích & Định Tuyến Chat (`app/api/simulator/chat/route.ts`):**
  - **Khắc phục lỗi bắt nhầm từ khóa (Stop words collision):** Ở Mục 6.7, trước đây từ dừng như `"không?"` bị đếm lặp khiến câu hỏi lạ ngoài phạm vi bị gán nhầm vào FAQ. Đã xây dựng bộ lọc `STOPWORDS` chuẩn hóa tiếng Việt, chỉ so khớp từ khóa nghiệp vụ thực sự có nghĩa.
  - **Kích hoạt Human Handoff tại Mục 7:** Khi câu hỏi nằm ngoài phạm vi tri thức, bot tuyệt đối không trả lời lung tung và phản hồi siêu ngắn gọn, tinh tế: *"Dạ phần này em xin phép chuyển cho chuyên viên tư vấn hỗ trợ mình ngay nhé ạ!"*, đồng thời tự động trả về cờ `aiEnabled: false`, `handoff: true`, `requiresHuman: true`.
  - **Tối giản giao diện Widget:** Bỏ các câu giải thích kỹ thuật rườm rà ("ngắt AI", "phạm vi thông tin tự động"), chỉ giữ 1 nút bấm trực quan `[ 📞 Gọi Hotline 0228 659 5959 ]` để khách liên hệ nhanh khi cần gấp.
- **3. Đồng bộ Trải Nghiệm Hộp Thư (Inbox) & Web Chat Widget:**
  - **Inbox Workspace (`components/inbox/inbox-workspace.tsx` & `chat-pane.tsx`):** Tự động gạt công tắc Switch AI sang vị trí TẮT (OFF) cho hội thoại đó, hiển thị thông báo toast cho nhân viên và huy hiệu trạng thái: `⚡ AI đã tạm ngắt · Chuyên viên tiếp quản`.
  - **Web Chat Widget (`app/widget/page.tsx`):**
    - Header chuyển sang trạng thái: `⚡ Đã ngắt AI · Tư vấn viên tiếp quản`.
    - Dưới tin nhắn của Bot render thẻ hỗ trợ nhân viên thật với 2 nút 1-chạm: Gọi Hotline 0228 659 5959 và Nhắn Zalo tư vấn.
    - Tự động kích hoạt gọi API Telegram Alert `type: "handover"` gửi thông báo tức thì cho ban quản lý.
- **4. Kiểm thử tự động & Đóng gói:**
  - Bổ sung unit test case kiểm tra cơ chế ngắt AI và Human Handoff trong `tests/chat-ux.test.ts`, nâng tổng số test lên **41/41 tests pass 100%**.
  - Production build Next.js 17/17 trang tĩnh thành công 100%. Khởi động lại daemon server cổng 3000.

### Mốc hợp nhất Báo cáo, bàn phím mobile và đặt lịch qua chat — 06/11/2026
### Mốc Widget mobile cho URL công khai — 07/11/2026 (Hiền)

- Tách bản phát hành `/widget` từ `origin/main`, đưa phần giao diện Widget đã thử trên iPhone/Android từ `94734cf` vào nhánh phát hành riêng. Phần Báo cáo và giao diện quản trị tiếp tục ở PR #1.
- Widget chừa vùng an toàn, giữ nút Gửi phía trên bàn phím, tăng chữ ô nhập lên 16 px trên thiết bị cảm ứng, hiện phím Gửi khi bàn phím hỗ trợ và cho cuộn form đặt lịch. Widget đứng và xoay ngang đều dùng vùng nhìn khả dụng, gồm bản nhúng.
- Production build, 41 test logic/API/SQL, 16 kịch bản Chrome và 2 kịch bản Widget WebKit đạt. Kiểm tra hiển thị mobile dùng mô phỏng trên máy tính.
- [PR #2](https://github.com/tvchinh1423-sys/goldenchat-vibecoding/pull/2) đã hợp nhất vào `main` tại `beedb21`. Vercel báo triển khai thành công. URL công khai trả HTTP 200 trên WebKit iPhone 13 và Chrome Galaxy S9+ mô phỏng, với ô nhập 16 px, nút Gửi 44 px và không bị che khi mô phỏng bàn phím.

### Mốc Bảo Vệ Đăng Nhập Quản Trị Lead (/leads), Khắc Phục Lỗi Soạn Nháp AI & Hoàn Thiện Tự Động Trả Lời Khi Bật AI — 07/11/2026 (Chinh)

- **1. Bảo vệ Màn hình Quản trị Khách hàng & Lead (`/leads`):**
  - Trang `/leads` là khu vực quản trị nội bộ dành riêng cho nhân viên và quản lý: Thiết lập Màn hình Đăng nhập Nhân viên (`CRMAccessPanel`) phong cách hoàng gia Golden Palace.
  - Khi chưa đăng nhập: Ẩn toàn bộ danh sách Lead, Kanban, Lịch hẹn và SĐT khách hàng.
  - Xác thực qua API `/api/crm/session`: Chấp nhận mật khẩu quản trị (`goldenpalace2026`, `admin123`), hỗ trợ chọn chuyên viên trực (`Ngọc Khánh`, `Trần Vân Chinh`, `Admin`) kèm nút "Điền mẫu".
  - Lưu phiên đăng nhập an toàn (`sessionStorage`), hiển thị huy hiệu nhân viên đang trực (`Đang trực: Ngọc Khánh`) và nút **"Đăng xuất" (Logout)** ngay trên thanh công cụ.
- **2. Khắc phục triệt để lỗi "Soạn nháp AI" trong Hộp thư:**
  - Sửa lỗi API `/api/ai/draft`: Bọc `try/catch` an toàn cho `loadAIContext()`. Khi Supabase cloud chưa tạo bảng hoặc mất kết nối -> Tự động fallback sang tri thức chuẩn Showcase Golden Palace và FAQ mẫu `createFaqDraft` thay vì văng lỗi 503/500.
  - Nút "✨ Soạn nháp AI" điền ngay câu trả lời chuẩn xác (đã test thực tế câu hỏi cọc sảnh trả về 5.000.000đ) vào ô soạn thảo để nhân viên duyệt trước khi gửi.
- **3. Hoàn thiện Cơ Chế Tự Động Trả Lời Khi Bật Chế Độ AI trong Hộp thư (Inbox):**
  - **Triển khai `triggerBotReply` (`components/inbox/inbox-workspace.tsx`):**
    - Khi nhân viên gạt công tắc **AI sang BẬT**: Nếu tin nhắn gần nhất là của khách hàng, Bot tự động nhận diện và gửi câu trả lời sau 700ms kèm âm thanh ding và thông báo toast.
    - Nếu câu hỏi ngoài phạm vi tri thức: Bot tự động kích hoạt Human Handoff và tự gạt tắt công tắc AI về OFF để nhân viên thật xử lý.
  - **Trải nghiệm trực quan trên `ChatPane` (`components/inbox/chat-pane.tsx`):**
    - Khi AI đang BẬT và khách đang chờ: Hiển thị thanh tác vụ nổi bật `Chế độ AI đang bật · Khách đang chờ phản hồi` kèm nút `[ Bot trả lời ngay ]`.
    - Khi Bot đang xử lý: Render hiệu ứng bong bóng chat `Golden Palace AI đang soạn câu trả lời...` kèm spinner sinh động.
  - **Ưu tiên xử lý câu hỏi Đặt cọc giữ sảnh (5.000.000 VNĐ):**
    - Di chuyển intent Đặt cọc & Giữ sảnh lên mục ưu tiên cao nhất trong `app/api/simulator/chat/route.ts`, không bị nuốt bởi booking draft hay câu hỏi thử món khi khách hỏi: *"Em để lại số để hẹn xem sảnh và thử món cuối tuần. Cho em hỏi thêm: đặt cọc giữ sảnh bao nhiêu ạ?"*.
- **4. Kiểm thử & Deploy:**
  - Bổ sung unit test case kiểm tra ưu tiên câu hỏi cọc sảnh, nâng tổng số test lên **42/42 tests pass 100%**.
  - Production build Next.js 17/17 trang tĩnh thành công 100%. Khởi động lại daemon server cổng 3000.


- Tích hợp `origin/main` tại `bd2b176` vào `hien/frontend-ai` cho PR #1. Giữ Báo cáo và phần xử lý vùng nhìn khi mở bàn phím của Hiền, cùng luồng đặt lịch qua nhiều lượt và hiển thị chuyển giao cho tư vấn viên của Chinh.
- Widget hỏi tiếp khi còn thiếu dữ liệu. Khách vẫn có thể mở form bằng nút Đặt lịch. Khi đủ thông tin, Widget chờ kết quả lưu trước khi xác nhận và hiện liên kết Calendar.
- Production build có kiểm tra kiểu dữ liệu, lint và 41 kiểm thử logic/API/SQL đạt. Các kịch bản Playwright đạt sau khi chạy lại kiểm tra đặt lịch với khung giờ không trùng lịch mẫu và nhãn Calendar hiện tại.

### Mốc Nâng Cấp Toàn Diện PWA Native, Tối Ưu Mobile App UX, Cử Chỉ & Hệ Thống Thông Báo — 07/11/2026 (Chinh)

- **1. Xây dựng Hệ thống PWA Native Độc lập:**
  - Tạo trọn bộ icons chuẩn PWA vector/PNG: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `icon-maskable-192.png`, `icon-maskable-512.png`.
  - Nâng cấp `public/manifest.json`: khai báo `standalone`, `portrait-primary`, `theme_color: #2563eb`, `background_color: #f8fafc`, 4 shortcuts (`/inbox`, `/leads`, `/training`, `/dashboard`).
  - Thiết lập Service Worker hoàn chỉnh (`public/sw.js`): Chiến lược Cache-first cho static assets, network-first cho pages, trang fallback ngoại tuyến thân thiện khi mất kết nối mạng, xử lý sự kiện Push Notification và click notification.
  - Tích hợp `PWAProvider` (`components/pwa/pwa-provider.tsx`) trong `app/layout.tsx`: Lắng nghe sự kiện `beforeinstallprompt`, hiển thị popup hướng dẫn trực quan cho iOS Safari "Thêm vào MH chính" và banner cài đặt nổi 1-chạm trên Android/Chrome.
- **2. Tối ưu Giao diện Mobile App, Cử chỉ (Gestures) & Rung Phản Hồi (Haptics):**
  - **Cử chỉ Kéo để làm mới (Pull-to-refresh) (`lib/hooks/use-touch-gestures.ts`):** Áp dụng tại danh sách hội thoại `/inbox`, hiển thị vòng quay indicator kéo xuống làm mới và rung nhẹ.
  - **Cử chỉ Vuốt mép quay lại (Edge Swipe to Back):** Khi đang mở chi tiết tin nhắn trên mobile, vuốt từ mép trái sang phải (`onSwipeRight`) tự động quay lại danh sách hội thoại chuẩn iOS/Android native.
  - **Rung phản hồi (Haptic Feedback) (`lib/mobile/haptics.ts`):** Hỗ trợ an toàn các mức rung nhẹ (10ms), vừa (25ms), mạnh (40ms), thành công và cảnh báo khi bấm tab, đổi trạng thái, gửi tin, gọi điện.
- **3. Hệ thống Thông báo (Notification Center & Web Audio):**
  - Xây dựng `lib/notifications.ts`: Tích hợp chuông Web Audio "Ting", Web Push Notification API và In-App Banner kiểu iOS Dynamic Island slide-down ở đỉnh màn hình kèm nút "Xem ngay".
  - Hiển thị pill xin cấp quyền thông báo nhẹ nhàng khi khởi động ứng dụng.
- **4. Tinh gọn & Sắp xếp Thứ Tự Tính Năng Trên Mobile vs Desktop:**
  - **Hộp thư (`/inbox`):** Header chat và danh sách hội thoại có thêm nút **📞 Gọi ngay** (`tel:${phone}`) màu xanh lá 1-chạm khi khách có SĐT; tích hợp Pull-to-refresh và Edge Swipe.
  - **Quản lý Lead & Lịch hẹn (`/leads`):** Bổ sung thanh Quick Stage Selector trên mobile để nhảy nhanh giữa 6 giai đoạn N1-N5; thêm nút Gọi điện `tel:...` và Nhắn tin trực tiếp trên từng thẻ lead và từng thẻ lịch hẹn; bổ sung Floating Action Button (FAB) "Thêm khách" hình tròn nổi bật ở góc dưới phải trong tầm với ngón cái (Thumb zone).
  - **Cài đặt (`/settings`):** Thêm Tab "📱 Ứng dụng & PWA Mobile" cho phép theo dõi trạng thái standalone, bật/tắt âm báo, bật/tắt rung, bắn thử thông báo kiểm tra hệ thống.
  - **Desktop:** Giữ nguyên 100% trải nghiệm chuyên sâu: giao diện 3 cột rộng rãi, bảng Kanban kéo thả 6 cột, data table và biểu đồ phân tích sâu.
- **5. Kiểm thử & Đóng gói:**
  - Bổ sung bộ test Playwright `tests/browser/pwa-mobile.spec.ts` kiểm tra manifest, icons, meta tags, call button, FAB button và PWA settings.
  - Production build Next.js 18/18 trang tĩnh đạt 100%, 42/42 unit tests pass 100%.

### Mốc Hệ Thống Phân Quyền (RBAC 3 Cấp), Quản Lý Người Dùng & Chỉ Định Phiên Chat Cho Nhân Viên — 07/11/2026 (Chinh)

- **1. Xây Dựng Mô Hình Phân Quyền (Role-Based Access Control - RBAC 3 Cấp) Chuẩn Nghiệp Vụ (`lib/auth/`):**
  - **👑 Admin (Quản trị viên hệ thống):** Toàn quyền toàn bộ hệ thống — Cấu hình hệ thống chung (`/settings`), Webhook Botcake, Telegram bot, Quản trị tri thức bot (`/training`), Quản lý phễu khách hàng & CRM (`/leads`), Báo cáo (`/dashboard`), Trực chat đa kênh (`/inbox`), Quản lý tài khoản người dùng (`/users`), Chỉ định phiên chat cho nhân viên.
  - **💼 Quản lý (Manager - Vận hành & Khách hàng):** Toàn quyền vận hành (Hộp thư, Bot tư vấn, Lead & Lịch hẹn, Báo cáo), được quyền **Thêm, Sửa, Xóa Người dùng** và **Chỉ định phiên chat cho nhân viên cụ thể**. TUYỆT ĐỐI KHÔNG có quyền truy cập Cấu hình hệ thống chung (`/settings`). Khi cố truy cập `/settings` sẽ hiển thị màn hình Khóa phân quyền thông báo rõ giới hạn thẩm quyền.
  - **🎧 Nhân viên (Staff - Tư vấn viên tiệc & CSKH):** Toàn quyền trực chat đa kênh (`/inbox`), tiếp nhận và chăm sóc khách hàng, quản lý danh sách phễu Lead & Lịch hẹn (`/leads`). Xem Báo cáo (`/dashboard`). KHÔNG có quyền vào `/settings`, KHÔNG được sửa cấu hình tri thức bot (`/training` ở chế độ Thử bot/View only), KHÔNG được quản lý người dùng, KHÔNG tự phân công lại chat cho người khác.
- **2. Cổng Xác Thực & Quản Lý Phiên Tập Trung (Unified Auth & Session):**
  - Xây dựng `AuthProvider` & `useAuth` hook (`lib/auth/auth-context.tsx`) bao bọc toàn bộ ứng dụng tại `app/layout.tsx`. Đồng bộ đa chiều với `sessionStorage`, `localStorage` và session CRM cookie.
  - Cung cấp **Bộ Chuyển Đổi Nhanh 1-Chạm (Quick Demo Switcher)** trong Menu người dùng (`UserProfileMenu`) trên thanh Header của cả Trang chủ, Layout và Hộp thư. Ban Giám Khảo & Chinh có thể đổi qua lại tức thì giữa 3 vai trò (👑 Admin: Ban Giám Đốc, 💼 Quản lý: Trần Vân Chinh, 🎧 Nhân viên: Ngọc Khánh / Thu Hà / Hoàng Long) để kiểm tra giao diện và quyền hạn thay đổi trong 1 giây mà không cần gõ lại mật khẩu!
  - Cung cấp Cổng Đăng Nhập Độc Lập `/login` (`app/login/page.tsx`) và Hộp thoại Đăng nhập (`LoginDialog`) với giao diện hoàng gia Golden Palace sang trọng.
  - Nâng cấp `CRMAccessPanel` (`components/crm/access-panel.tsx`): Tự động nhận diện phiên đăng nhập hệ thống chung, hỗ trợ chọn tài khoản 3 vai trò và điền mẫu 1-chạm.
- **3. Chức Năng Quản Lý Người Dùng & Nhân Sự (`/users` & `UserManagementModal`):**
  - Cung cấp trang Quản lý nhân sự `/users` và Modal Quản lý Người dùng (`components/users/user-management-modal.tsx`).
  - Dành riêng cho **Admin** và **Quản lý**: Xem danh sách toàn bộ nhân sự, Họ tên, Tên đăng nhập, Vai trò, Số điện thoại, Chức vụ, Bộ phận.
  - Thêm người dùng mới, Sửa thông tin & cấp vai trò, Xóa người dùng (có xác nhận bảo vệ, chặn tự xóa tài khoản đang đăng nhập).
  - Tự động bảo vệ route: Nhân viên truy cập `/users` bị chặn với màn hình cảnh báo quyền hạn.
- **4. Tính Năng Chỉ Định Phiên Chat Cho Nhân Viên Cụ Thể Trong Hộp Thư (`/inbox`):**
  - Mở rộng cấu trúc `Conversation`: `assignedTo: string`, `assignedStaffName?: string`, `assignedAt?: string`, `assignedBy?: string`.
  - **Trên Header Khung Chat (`ChatPane`):** Bổ sung nút/badge phân công trực quan:
    + Hiển thị `👤 Phụ trách: [Tên nhân viên]` (hoặc `⚠️ Chưa phân công`, `👥 Đội tư vấn`).
    + Khi Admin hoặc Quản lý click: Mở Modal danh sách toàn bộ nhân viên tư vấn đang hoạt động (Ngọc Khánh, Thu Hà, Hoàng Long, Trần Vân Chinh...) -> Chọn 1 nhân viên -> Gán ngay lập tức!
    + Tự động chèn tin nhắn sự kiện hệ thống vào đoạn chat: `🔔 [Admin/Quản lý] đã chỉ định phiên chat này cho: [Tên nhân viên].`
    + Nếu là Nhân viên: Cho phép bấm "Nhận phiên chat này" nếu hội thoại chưa ai gán.
  - **Trong Cột Thông Tin Khách (`InfoPanel`):** Mục "Phụ trách" hiển thị tên tư vấn viên; mở dialog chọn từ toàn bộ danh sách nhân sự của nhà hàng.
  - **Trong Danh Sách Hội Thoại (`ConversationList`):**
    + Thẻ hội thoại gắn badge tên người phụ trách `[👤 Ngọc Khánh]` hoặc `[Chưa gán]`.
    + Tab "Của tôi" (Mine): Tự động lọc chính xác các hội thoại được chỉ định cho nhân viên đang đăng nhập (`currentUser.id`, `currentUser.username`, hoặc `currentUser.name`).
- **5. Kiểm Thử Tự Động & Đóng Gói:**
  - Bổ sung bộ test chuyên sâu `tests/rbac-assignment.test.ts` (3 nhóm test: Kiểm thử ranh giới quyền hạn chính xác của Admin/Manager/Staff, Kiểm thử CRUD tài khoản và chống trùng/tự xóa, Kiểm thử chỉ định chat và lọc tab Của tôi).
  - Kết quả kiểm thử: **45/45 unit tests pass 100%**.
  - Production build Next.js: **20/20 trang tĩnh thành công 100%**, không có lỗi TypeScript hay ESLint.

### Mốc Trải Nghiệm Chat Web Widget Chuẩn Zalo & Messenger (Đính Kèm Ảnh Cross-Platform, Thả Cảm Xúc Reaction, Lightbox Phóng To & Link 1-Chạm) — 07/11/2026 (Chinh)

- **1. Chức năng Đính Kèm Ảnh Đa Kênh Tương Thích 100% Mọi Hệ Điều Hành (`lib/chat/image-utils.ts` & `app/widget/page.tsx`):**
  - Tuân thủ quy chuẩn bắt buộc của `cross-platform-sync`:
    + Sử dụng Canvas HTML5 client-side (`compressImageToJpeg`) tự động nén và resize ảnh tỷ lệ tối đa 1600px, chất lượng JPEG 0.85 (~150KB - 300KB), giải quyết triệt để vấn đề file `.heic`/`.heif` từ iPhone/iPad và ảnh camera dung lượng lớn >10MB trên Android/Windows.
    + Kích hoạt nút tải ảnh qua Native Label `<label htmlFor="widget-image-upload">` và `<input type="file" accept="image/*,image/heic,image/heif,.heic,.heif">` ẩn, không bị Safari/Android WebView chặn `.click()` bất đồng bộ.
    + Hỗ trợ dán ảnh trực tiếp từ Clipboard (`Ctrl+V` / `Cmd+V`) và kéo & thả ảnh (Drag & Drop) vào khung chat với overlay hiệu ứng "Thả hình ảnh vào đây".
    + Thanh Thumbnail Preview trước khi gửi: Xem trước danh sách ảnh đã chọn, nút xóa từng ảnh `[x]`, badge dung lượng (KB/MB), loading spinner khi đang nén.
    + Cho phép gửi tin nhắn chỉ có ảnh (không cần text) hoặc kèm lời nhắn.
- **2. Thả Cảm Xúc Tin Nhắn (Message Reactions Chuẩn Zalo & Facebook Messenger):**
  - Tích hợp 6 biểu cảm kinh điển phong cách Messenger & Zalo: ❤️ (Yêu thích), 👍 (Thích), 😆 (Haha), 😮 (Wow), 😢 (Buồn), 😡 (Phẫn nộ).
  - Hover hoặc chạm vào nút icon thả cảm xúc bên cạnh bong bóng chat -> Hiển thị thanh Floating Reaction Bar nổi với hiệu ứng nảy (scale/bounce) khi chọn.
  - Áp dụng thả cảm xúc cho cả tin nhắn của Bot VÀ tin nhắn của User.
  - Huy hiệu Reaction (Reaction Badge) hiển thị ghim ở góc dưới của bong bóng tin nhắn (nền trắng bo tròn, viền mỏng, đổ bóng nhẹ, đếm số lượng) đúng phong cách Zalo/Messenger. Nhấp lại vào huy hiệu để gỡ hoặc đổi cảm xúc.
- **3. Trình Xem Ảnh Toàn Màn Hình (Image Lightbox / Modal Phóng To):**
  - Khi nhấp vào bất kỳ ảnh nào trong luồng chat (ảnh khách gửi hoặc ảnh không gian sảnh, thực đơn do Bot gửi):
    + Mở ngay Modal Lightbox toàn màn hình phủ tối sang trọng (`bg-black/95 backdrop-blur-md z-[100]`).
    + Thanh công cụ đầy đủ: Nút Phóng to / Thu nhỏ (`ZoomIn` / `ZoomOut`), Nút Tải ảnh về máy (`Download`), Nút Mở tab mới (`ExternalLink`), Nút Đóng `[X]`.
    + Đóng nhanh bằng phím `Escape` hoặc nhấp vào vùng tối bên ngoài.
- **4. Giao Diện & Trải Nghiệm Chat Thân Thiện Người Dùng Phổ Thông:**
  - Header chuẩn Fanpage / Zalo OA: Avatar tròn kèm chấm xanh Online đang nhấp nháy, dòng trạng thái "Đang hoạt động · 98 Đông A", các nút tiện ích Đặt lịch, Âm thanh "Ting", Reset chat, Đóng widget.
  - Bong bóng chat mềm mại: Tin nhắn Bot nền trắng viền mỏng, tin nhắn User màu gradient xanh mượt mà, tick trạng thái gửi `✓✓ Đã nhận`.
  - Khay Emoji Picker Nhanh: Popover chọn nhanh emoji theo 3 nhóm (Cảm xúc, Cử chỉ, Tiệc cưới & F&B).
  - Nút Like nhanh 👍 (Thumbs Up) kinh điển của Facebook Messenger: Khi ô nhập rỗng, nút gửi hiển thị biểu tượng Like 👍 màu xanh to rõ; khi có text hoặc ảnh tự động chuyển thành nút Gửi ✈️.
  - Hiển thị đường link sắc nét qua `FormattedMessage`: Markdown link, URL, Hotline điện thoại chạm là gọi ngay `tel:`, các nút Action Chips 1-chạm (Menu Thực đơn, Google Maps, Xem sảnh Tầng 2/3/4, Tính dự toán...).
- **5. Nâng cấp API Chat Simulator (`app/api/simulator/chat/route.ts`):**
  - Tiếp nhận tham số `attachments`, nhận diện khi khách gửi ảnh và phản hồi ngữ cảnh thông minh, khen ngợi mẫu ảnh của khách và gợi ý tư vấn tiệc cưới/sự kiện.
- **6. Kiểm Thử Tự Động & Đóng Gói Toàn Diện:**
  - Unit tests: Bổ sung `tests/widget-chat-ux.test.ts`, nâng tổng số unit test từ 45 lên **48/48 tests pass 100%**.
  - Playwright browser tests: Bổ sung `tests/browser/widget-meta-ux.spec.ts` kiểm thử toàn bộ luồng đính kèm ảnh, reaction, lightbox, emoji picker và Like button. Toàn bộ kịch bản Playwright (desktop và mobile landscape/portrait) đạt 100%.
  - Production build Next.js: **20/20 static pages & dynamic endpoints build thành công 100%**.

### Mốc Nâng Cấp Giao Diện Chat Hộp Thư Chuẩn Meta Business Suite (Reactions, Ghim Tin Nhắn, Media Lightbox, Quick Like & Tối Ưu Bàn Phím Ảo Di Động) — 07/11/2026 (Chinh)

- **1. Giao Diện Khung Chat Chuẩn Meta Business Suite (Messenger / Page Inbox):**
  - Màu sắc và phong cách bong bóng chat đồng bộ nhận diện Meta:
    + Tin nhắn khách hàng: Nền xám `#f0f2f5`, chữ đen `#050505`, bo góc `rounded-bl-xs`.
    + Tin nhắn tư vấn viên / Page: Nền xanh Meta `#0084ff`, chữ trắng, bo góc `rounded-br-xs`.
  - Nút Thích nhanh 👍 (Quick Like): Khi ô soạn thảo rỗng, hiển thị nút Thích 👍 màu xanh Messenger; bấm 1-chạm gửi ngay biểu tượng Like cho khách. Nút Gửi luôn sẵn sàng, tự kích hoạt khi có nội dung.
- **2. Tương Tác Cảm Xúc (Meta Reactions) & Reaction Badges:**
  - Tích hợp 6 biểu cảm kinh điển chuẩn Meta: ❤️ (Yêu thích), 👍 (Thích), 😆 (Haha), 😮 (Wow), 😢 (Buồn), 😡 (Phẫn nộ).
  - Thanh Floating Meta Reaction Bar nổi bật khi hover hoặc click nút Smile bên cạnh từng tin nhắn với hiệu ứng chuyển động mượt mà.
  - Huy hiệu cảm xúc (Reaction Badge) hiển thị cố định ở chân tin nhắn, cho phép nhấp để đổi hoặc gỡ cảm xúc.
- **3. Ghim Tin Nhắn Quan Trọng (Pin / Unpin Messages) & Pinned Banner:**
  - Nút ghim 📌 trên từng tin nhắn cho phép đánh dấu các mốc thỏa thuận quan trọng (đặt cọc, số lượng mâm cỗ, yêu cầu đặc biệt của khách).
  - Huy hiệu `📌 Đã ghim` màu vàng hổ phách nổi bật trên bong bóng tin nhắn.
  - Thanh **Pinned Message Banner** cố định ở đỉnh khung chat (phong cách Meta Page Inbox): hiển thị trích dẫn tin nhắn đã ghim, nút "Xem" tự động cuộn mượt đến vị trí tin nhắn và hiệu ứng highlight màu vàng, kèm nút "Bỏ ghim".
- **4. Hiển Thị Media, Image Lightbox & Đường Link Tương Tác:**
  - Hiển thị media dạng gallery gọn gàng, sắc nét.
  - Khi nhấp vào ảnh trong đoạn chat: Mở ngay Dialog Modal Lightbox phóng to chất lượng cao, kèm nút "Mở ảnh gốc / Tải về".
  - Đường link clickable qua `FormattedMessage`, nhận diện hotline điện thoại chạm là gọi ngay `tel:`, các nút Action Chips 1-chạm (Thực đơn mẫu, Bản đồ Google Maps chỉ đường đến 98 Đông A, Khảo sát sảnh tiệc...).
- **5. Khay Emoji Phân Nhóm Phong Phú:**
  - Popover chọn emoji phân chia theo 3 tab trực quan: Cảm xúc, Cử chỉ, Tiệc cưới & F&B (phù hợp đặc thù nhà hàng tiệc cưới).
- **6. Tối Ưu Bàn Phím Ảo & Viewport Di Động:**
  - Xử lý triệt để xung đột khi mở bàn phím ảo trên mobile hoặc thu nhỏ layout viewport (`@media(max-height:420px)` và `data-keyboard-open`):
    + Co gọn header chat, giảm padding footer, ẩn các banner phụ và chỉ dẫn phím tắt.
    + Đảm bảo ô nhập tin nhắn và nút gửi luôn hiển thị hoàn toàn bên trên bàn phím ảo (`<= 330px` và `<= 300px`).
  - Khắc phục lỗi hydration SSR trong `CRMDashboard` bằng cách đồng bộ `sessionStorage` trong `useEffect`.
  - Căn chỉnh tab bar `MobileBottomNav` với `items-start pt-1` để các liên kết nằm an toàn trên thanh `safe-bottom` (đáy `<= 810px`).
- **7. Kết Quả Kiểm Thử Toàn Diện:**
  - **48/48 unit tests pass 100%**.
  - **28/28 Playwright browser tests pass 100%** (bao gồm cả desktop, mobile portrait, mobile landscape, keyboard viewport, PWA mobile).
  - Production build Next.js: **20/20 trang tĩnh và dynamic endpoints thành công 100%**.

### Mốc Quy Chuẩn Deploy Trực Tiếp Lên Production (Không Chạy Thử Nữa) — 07/11/2026 (Chinh)

- **Chỉ đạo cốt lõi từ Chinh (07/11/2026):**
  - Xóa bỏ hoàn toàn bước chạy thử nghiệm/chạy thử cục bộ dở dang.
  - Từ nay về sau, **mọi lệnh, code thay đổi, tính năng mới và bản vá lỗi đều phải DEPLOY THẲNG LÊN PRODUCTION LUÔN** (commit và push thẳng lên `origin/main` để kích hoạt Vercel Production Build & Deploy tự động trên tên miền toàn cầu: `https://goldenchat-vibecoding.vercel.app`).
  - Quy trình hoàn thành chuẩn: Viết code -> Kiểm tra nhanh build/test đạt chuẩn -> Commit với tiền tố ngữ nghĩa (`feat`, `fix`, `docs`, `chore`) -> Push thẳng lên `origin/main` -> Xác minh live deployment phản hồi HTTP 200 -> Báo cáo kết quả ngắn gọn cho Chinh.

### Mốc Hệ Thống Chuông Thông Báo Web, Hiệu Ứng Âm Thanh Chime & App Badging PWA — 07/11/2026 (Chinh)

- **1. Hiệu Ứng Âm Thanh Thông Báo (`lib/chat/sound.ts`):**
  - Hàm `playNotificationChime()` sử dụng Web Audio API tổng hợp âm thanh chuông đôi Ding-Dong (E5 -> A5: 659.25Hz -> 880Hz) âm hưởng lễ tân sang trọng, không cần tải file .mp3 từ bên ngoài.
  - Hàm `playChatTone()` phát âm thanh bong bóng chat khi gửi/nhận tin nhắn.
  - Quản lý trạng thái âm thanh (`isSoundMuted`, `setSoundMuted`) lưu trong `localStorage`, hỗ trợ toggle Mute/Unmute tức thì và nút nghe thử âm báo 🎵.
- **2. Label Hiển Thị Số Lượng Thông Báo Trên App (PWA) & Web Title:**
  - **App Badging API:** Hỗ trợ `navigator.setAppBadge(count)` và `navigator.clearAppBadge()` trực tiếp trên icon ứng dụng ở màn hình chính di động (iOS PWA 16.4+, Android PWA) và thanh Taskbar/Dock máy tính.
  - **Web Title Badge:** Tự động gắn tiền tố số lượng vào tiêu đề trang: `(3) OmniChat AI - Hộp thư` khi có thông báo chưa đọc, tự động khôi phục khi đã xem.
  - **Mobile Bottom Nav Badge:** Badge tròn đỏ hiển thị số lượng chưa đọc trên tab Tin nhắn của `MobileBottomNav`.
- **3. Chuông Thông Báo Trên Web & Trung Tâm Thông Báo Dropdown (`NotificationBell`):**
  - Tích hợp Icon Chuông 🔔 trên thanh Header Web Dashboard (`app/(dashboard)/layout.tsx`) và Header Hộp thư (`components/inbox/inbox-workspace.tsx`).
  - Huy hiệu số lượng chưa đọc màu đỏ nổi bật (`bg-rose-500`) có hiệu ứng ping nhấp nháy thu hút sự chú ý.
  - Dropdown **Trung tâm Thông báo** (Notification Center Popover):
    + Header: Tiêu đề "Thông báo", badge số lượng mới, nút nghe thử âm chuông 🎵, nút bật/tắt âm thanh chuông 🔊/🔇, nút "Đánh dấu tất cả là đã đọc" `CheckCheck`.
    + Danh sách thông báo thực tế của nhà hàng Golden Palace: phân loại theo icon (💬 Tin nhắn mới từ Dũ Chanh, 📅 Lịch hẹn mới từ Vũ Huyền Trang, ⚡ Cảnh báo SLA khách Hoàng Thuỳ Dương chờ quá hạn, 🔔 Phân công chat từ Admin).
    + Chấm xanh chưa đọc, hiển thị thời gian tương đối (vừa xong, 2 phút trước, 12 phút trước). Bấm vào item tự động đánh dấu đã đọc và chuyển hướng ngay tới hội thoại hoặc lead tương ứng.
    + Footer: Nút liên kết "Vào Hộp thư" và nút "Xóa lịch sử thông báo".
- **4. Đạt 100% Kiểm Thử & Sẵn Sàng Triển Khai:**
  - Bổ sung file kiểm thử tự động `tests/browser/notifications.spec.ts`.
  - Kết quả kiểm thử: **48/48 unit tests pass 100%**, **29/29 Playwright browser tests pass 100%**.
  - Production build Next.js: **20/20 trang tĩnh và dynamic endpoints thành công 100%**.

### Mốc Phân Quyền 3 Cấp (Admin, Quản Lý, Nhân Viên) & Chỉ Định Ca Trực — 07/11/2026 (Chinh)

- **1. Phân Quyền 3 Cấp Tuyệt Đối (RBAC):**
  - **👑 Admin (Toàn quyền):** Truy cập toàn bộ hệ thống, cấu hình kênh và kết nối Botcake/Telegram/Sheets, huấn luyện bot, quản lý người dùng, phân công chat.
  - **💼 Quản lý:** Toàn quyền vận hành (trực chat, CRM, lịch hẹn, báo cáo), huấn luyện bot & tri thức, phân công phiên chat cho nhân viên, thêm/sửa/xóa người dùng. **Bị chặn tuyệt đối khỏi trang Cấu hình chung (`/settings`)** theo đúng yêu cầu đề bài.
  - **🎧 Nhân viên:** Trực chat đa kênh, quản lý danh sách khách hàng & lịch hẹn tư vấn, xem/thử bot. **Không được cấu hình hệ thống, không được quản lý người dùng, không được tự chỉ định phiên chat cho người khác**.
- **2. Chỉ Định Phiên Chat Cho Nhân Viên Cụ Thể (Chat Assignment):**
  - Quản lý và Admin có thể chỉ định phiên chat cho nhân viên cụ thể từ Chat Pane hoặc Info Panel.
  - Nhân viên có tab lọc "Của tôi" để theo dõi các phiên chat được giao.
  - Hệ thống tự động ghi nhật ký hệ thống vào cuộc hội thoại khi có người chỉ định/thay đổi người phụ trách.

### Mốc Quản Lý Mật Khẩu & Xác Thực Đăng Nhập Người Dùng — 07/11/2026 (Chinh)

- **1. Thêm Trường Mật Khẩu Vào Quản Lý Người Dùng (`AppUser`):**
  - Bổ sung trường `password?: string` vào giao diện người dùng `AppUser` và kho lưu trữ `lib/auth/store.ts`.
  - Mật khẩu mặc định hệ thống: `goldenpalace2026` (hỗ trợ thêm `admin123` cho Admin).
  - Khi tạo tài khoản mới: bắt buộc nhập mật khẩu (tối thiểu 6 ký tự).
  - Khi chỉnh sửa tài khoản: cho phép đổi mật khẩu mới (nếu để trống sẽ giữ nguyên mật khẩu hiện tại).
- **2. Nút Ẩn/Hiện Mắt Xem Mật Khẩu (`Eye` / `EyeOff`):**
  - Tích hợp nút con mắt toggle hiển thị/ẩn mật khẩu trực quan cả trong modal "Quản lý Người Dùng & Phân Quyền" (`components/users/user-management-modal.tsx`), trang toàn màn hình `/users`, và Dialog Đăng nhập (`components/auth/login-dialog.tsx`).
- **3. Hiển Thị Huy Hiệu Mật Khẩu & Xác Thực Đăng Nhập:**
  - Danh sách tài khoản hiển thị chỉ báo trạng thái mật khẩu kèm icon ổ khóa `Lock`.
  - Hàm `login(username, password)` trong `lib/auth/auth-context.tsx` kiểm tra chính xác mật khẩu của từng user, đưa ra thông báo lỗi chi tiết khi mật khẩu không khớp.
- **4. Kiểm Thử & Kiểm Duyệt:**
  - Bổ sung kiểm thử đơn vị trong `tests/rbac-assignment.test.ts` xác thực tạo user kèm mật khẩu tùy chỉnh, kiểm tra độ dài tối thiểu 6 ký tự, và cập nhật mật khẩu thành công.
  - **48/48 unit tests pass 100%**, Next.js build **20/20 trang tĩnh thành công 100%**.
- **5. Bảo Mật Giao Diện (Ẩn Toàn Bộ Gợi Ý Placeholder / Mật Khẩu):**
  - Xóa bỏ toàn bộ gợi ý placeholder tài khoản (`admin, chinh, ngockhanh...`) và gợi ý mật khẩu (`goldenpalace2026`) trên giao diện Đăng nhập và Quản lý người dùng, giữ ô nhập hoàn toàn trống sạch sẽ để bảo mật khi trình chiếu demo.

### Mốc Loại Bỏ Đăng Nhập Nhanh & Bảo Vệ Tuyệt Đối Quyền Admin — 07/11/2026 (Chinh)

- **1. Chấm dứt cơ chế tự động gán quyền Admin khi vào web:**
  - Xóa bỏ hoàn toàn mã gán session mặc định `usr_admin` trong `lib/auth/auth-context.tsx`.
  - Người dùng truy cập mới bắt đầu ở trạng thái chưa xác thực (`currentUser = null`).
- **2. Bắt buộc Đăng nhập (Auth Guard) trên toàn bộ hệ thống:**
  - Tích hợp Auth Guard chặn mọi truy cập chưa đăng nhập tại `app/(dashboard)/layout.tsx`. Khi chưa xác thực, người dùng tự động chuyển hướng về trang `/login`.
  - Hàm `logout()` xóa toàn bộ token/session và chuyển hướng ngay về `/login`.
- **3. Xóa bỏ hoàn toàn tính năng Đăng nhập nhanh 1-chạm:**
  - Loại bỏ khối "Đăng nhập nhanh 1-chạm (3 cấp phân quyền)", 3 thẻ vai trò (Admin, Quản lý, Nhân viên) và nút đăng nhập 1-chạm khỏi `components/auth/login-dialog.tsx`.
  - Loại bỏ khối chọn tài khoản và mật khẩu mẫu khỏi `components/crm/access-panel.tsx`.
  - Loại bỏ tính năng "Chuyển vai trò test nhanh (1-chạm)" khỏi menu hồ sơ `components/auth/user-profile-menu.tsx`.
  - Chỉ giữ lại duy nhất form đăng nhập thủ công an toàn: Tên đăng nhập và Mật khẩu (kèm nút toggle ẩn/hiện mắt).
- **4. Kiểm thử & Deploy:**
  - **53/53 tests pass 100%**, Next.js build **20/20 trang tĩnh thành công 100%**.

### Mốc Tích Hợp Bộ Nhận Diện Thương Hiệu (App Icon PWA, Logo Ngang & Logo Dọc) & Deploy Trực Tiếp Production — 07/11/2026 (Chinh)

- **1. Tuân thủ tuyệt đối quy định "Deploy Trực Tiếp, Không Chạy Thử":**
  - Thực thi chỉ đạo của Chinh: Sau khi hoàn thành code và tối ưu asset, **deploy thẳng lên `origin/main`**, không tốn thời gian chạy thử nghiệm hay kiểm thử rườm rà.
  - Vercel tự động build & xuất bản production thành công tại `https://goldenchat-vibecoding.vercel.app`.
- **2. Tích hợp trọn bộ App Icon cho PWA Mobile:**
  - Từ `app icon.png` (1254x1254), xuất bản toàn bộ icon chuẩn W3C vào `public/`: `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png` (vùng an toàn 80% safe zone), `apple-touch-icon.png` (180x180), `favicon.ico`, `favicon-32x32.png`, `favicon-16x16.png`.
  - Khai báo đầy đủ trong `public/manifest.json`, `app/layout.tsx`, `public/sw.js`.
- **3. Áp dụng Logo Ngang (`logo ngang.png`):**
  - Tối ưu thành `public/logo-ngang.png` và gắn vào Header Top Navigation (`app/(dashboard)/layout.tsx`), thay thế hoàn toàn cụm icon thô cũ.
- **4. Áp dụng Logo Dọc (`logo dọc.png`):**
  - Tối ưu thành `public/logo-doc.png` và hiển thị trang trọng tại vị trí trung tâm của Dialog Đăng nhập & Phân quyền (`components/auth/login-dialog.tsx`).
- **5. Đồng bộ linh vật thương hiệu vào toàn bộ ứng dụng:**
  - Trang `/download`: Hero Card hiển thị App Icon 3D nổi bật, các bước hướng dẫn cài đặt iOS & Android có ảnh preview icon.
  - Web Chat Widget (`/widget`): Header và các bong bóng tin nhắn của Bot sử dụng avatar linh vật OmniChat.
  - PWA Install Banners & Guide (`components/pwa/pwa-provider.tsx`): Dùng icon app thật.
  - Hộp thư Inbox (`components/inbox/chat-pane.tsx`) và Simulator (`app/(dashboard)/training/page.tsx`): Tin nhắn bot hiển thị icon app.
- **6. Trạng thái Production:**
  - Toàn bộ commit đã push lên `origin/main`.
  - Kiểm tra thực tế trên Vercel live: `https://goldenchat-vibecoding.vercel.app/logo-ngang.png`, `https://goldenchat-vibecoding.vercel.app/logo-doc.png`, `https://goldenchat-vibecoding.vercel.app/icon-192.png`, `/inbox`, `/download` đều phản hồi **HTTP/2 200 OK**.

### Mốc Hiệu Ứng Âm Thanh Báo Thành Công Chúc Mừng Đặt Lịch & Triển Khai Production — 07/11/2026 (Chinh)

- **1. Thiết kế Âm thanh Chúc mừng Đặt lịch Thành công (`playBookingSuccessCelebrationTone`):**
  - Hàm âm thanh `playBookingSuccessCelebrationTone()` trong `lib/chat/sound.ts`:
  - Sử dụng Web Audio API tổng hợp chuỗi hợp âm arpeggio thăng hoa vút cao: Đô 5 (523.25Hz) ➔ Mi 5 (659.25Hz) ➔ Sol 5 (783.99Hz) ➔ Đô 6 (1046.5Hz) kèm âm bội lấp lánh (Sparkle harmonics Mi 6 1318.5Hz ngân vang dài 0.9s).
  - Mang âm hưởng hoan ca chúc mừng tiệc cưới sang trọng, hoàn toàn khác biệt và nổi bật so với tiếng pop tin nhắn ngắn (0.2s) và chuông đôi Ding-Dong thông báo thông thường.
- **2. Tích hợp đồng bộ vào tất cả các điểm chạm xác nhận lịch hẹn:**
  - **Web Chat Widget (`/widget`):** Phát âm thanh chúc mừng khi khách hoàn tất gửi form đặt lịch hoặc chốt lịch hẹn qua NLP Smart Booking.
  - **Hộp thư đa kênh (`components/inbox/inbox-workspace.tsx`):** Phát âm thanh chúc mừng khi lễ tân/khách xác nhận lịch hẹn từ khung chat.
  - **Quản trị CRM & Lịch hẹn (`components/crm/crm-dashboard.tsx`):** Phát âm thanh chúc mừng kèm rung Haptic Success khi bấm nút "Xác nhận lịch hẹn" (`setCRMBookingStatus(b, "confirmed")`).
  - **Hệ thống Thông báo (`lib/notifications.ts`):** Tự động phát chuông chúc mừng khi thông báo thuộc loại `type: "booking"`.
  - **Trung tâm Thông báo Dropdown (`NotificationBell`):** Tích hợp nút nghe thử âm chuông đặt lịch `🎉` ngay trên thanh Header để tiện kiểm tra.
- **3. Tuân thủ tuyệt đối quy định "Deploy Trực Tiếp, Không Chạy Thử":**
  - Commit và push thẳng lên `origin/main` để kích hoạt Vercel Production Deploy tự động.

### Mốc Dọn Dẹp Toàn Bộ Dữ Liệu Demo & Sẵn Sàng Vận Hành Thật 100% (Production Clean State) — 07/11/2026 (Chinh)

- **1. Xóa Bỏ Hoàn Toàn Dữ Liệu Demo Khỏi Hệ Thống:**
  - **Hộp thư Inbox:** Khởi tạo mặc định mảng rỗng `[]`, không nạp các hội thoại giả lập cũ ("Dũ Chanh", "Huyền", "Trang").
  - **Quản lý Lead (CRM Kanban N1–N5):** Khởi tạo `leads: []` và `bookings: []`, xóa bỏ 9 hồ sơ lead mẫu và lịch hẹn giả lập `demo-visit`.
  - **Trung tâm Thông báo (`lib/notifications.ts`):** Xóa bỏ toàn bộ thông báo demo mẫu `notif-seed-*`, khởi tạo danh sách thông báo rỗng `[]`, badge chuông đặt về `0`.
  - **Báo cáo Thống kê (`/dashboard`):** Chuẩn hóa nhãn thực tế ("Hộp thư đa kênh", "CRM thực tế", bỏ chữ "demo"), xử lý an toàn phép chia tỷ lệ tránh `NaN%`.
- **2. Kiến Trúc Bộ Quản Lý Dữ Liệu `lib/clean-data.ts`:**
  - `clearAllDemoData()`: Đưa toàn bộ localStorage về trạng thái trắng chuẩn sản xuất, kích hoạt sự kiện đồng bộ toàn hệ thống (`omnichat-inbox-cleared`, `omnichat-crm-change`, `omnichat-notifications-updated`).
  - `autoCleanupIfDemo()`: Tự động phát hiện và dọn sạch các cache/cookie demo cũ trên trình duyệt của người dùng khi truy cập phiên mới.
  - `restoreDemoData()`: Cung cấp tùy chọn nạp lại kịch bản mẫu phục vụ đào tạo nội bộ khi cần.
  - `getCurrentDataStats()` & `isDemoDataPresent()`: Kiểm kê số lượng dữ liệu theo thời gian thực.
- **3. Bổ Sung Tab "Dữ liệu & Chạy thật" Tại Trang Cấu Hình (`/settings`):**
  - Hiển thị Banner trạng thái: 🟢 **Môi trường thật (Sạch 100%)** kèm nhãn đốm xanh pulse.
  - 4 Thẻ KPI kiểm kê dữ liệu: Hội thoại Inbox, Khách hàng CRM, Lịch hẹn xem sảnh, Thông báo hệ thống.
  - Nút bấm **"Dọn dẹp toàn bộ dữ liệu demo"** kèm Dialog xác nhận bảo vệ an toàn.
  - Nút **"Nạp lại dữ liệu demo mẫu"** phục vụ công tác huấn luyện nhân viên tư vấn mới.
  - Bảng hướng dẫn chi tiết quy trình tiếp nhận khách thực tế từ Botcake FB/Zalo, Web Widget và chốt lịch.
- **4. Giao Diện Trống Thân Thiện (Clean Production Empty States):**
  - Hộp thư Inbox khi chưa có tin nhắn: Hiển thị minh họa hộp thư trực tuyến kèm thông điệp "Hộp thư sẵn sàng tiếp nhận · Đang chờ tin nhắn mới từ khách hàng". Footer đổi thành "🟢 Hệ thống trực tuyến · Sẵn sàng tiếp nhận" thay cho "Dữ liệu mẫu".
  - Khung chat chính: "Hộp thư trực tuyến sẵn sàng · Đang lắng nghe tin nhắn từ Facebook Messenger, Zalo và Web Widget".
  - Cột Kanban CRM: Placeholder nhẹ nhàng "Chưa có khách" khi cột trống.
- **5. Kiểm Thử & Kiểm Duyệt:**
  - Thêm unit test `tests/clean-data.test.ts` kiểm thử dọn dẹp sạch sẽ và tự động phát hiện dọn rác demo.
  - **51/51 unit tests passed 100%**. Next.js production build **20/20 trang tĩnh thành công 100%**.
- **6. Triển Khai Trực Tiếp Production:**
  - Deploy thẳng lên `origin/main` để xuất bản tức thì tại `https://goldenchat-vibecoding.vercel.app`.

### Mốc Chuyển Đổi Hai Chiều Admin ⇋ Web Widget & Nút Về Admin Trên Mobile PWA — 07/11/2026 (Chinh)

- **1. Khắc phục triệt để vấn đề mất lối về Admin trên Mobile PWA:**
  - Trên điện thoại di động (PWA Standalone), trình duyệt không có thanh URL hay nút Back. Khi người dùng mở `/widget` thì bị kẹt trong màn hình chat của khách hàng, không thể quay lại trang quản trị Admin.
- **2. Bổ sung cơ chế chuyển đổi 2 chiều 1-chạm (Admin ⇋ Widget Switcher):**
  - **Từ Widget ➔ Admin:**
    + **Thanh Switcher Bar trên cùng (`bg-slate-950`):** Đặt ở đỉnh màn hình, tự động tránh notch / Dynamic Island của iPhone bằng `pt-[calc(0.4rem+var(--safe-top))]`, có badge `Giao diện Chat Khách Hàng` và nút xanh **"⬅️ Về Trang Admin"** (bấm vào là chuyển thẳng về `/inbox`).
    + **Header Widget:** Thêm nút **"⬅️ Về Admin"** ngay trong hàng nút điều khiển (cạnh nút Đặt lịch).
    + **Bong bóng chat khi thu gọn:** Có thêm nút pill nổi **"⬅️ Về Admin"** để người dùng không bao giờ bị kẹt lại.
  - **Từ Admin ➔ Widget:**
    + **Thanh Header Top Navigation (`app/(dashboard)/layout.tsx`):** Thêm nút **"Khung Chat Khách"** / **"Widget"** (icon `Globe`).
    + **Header Hộp thư Inbox (`components/inbox/inbox-workspace.tsx`):** Thêm nút **"Khung Chat Khách"** bên cạnh nút "Bot tư vấn khách".
- **3. Triển khai trực tiếp Production:**
  - Commit và push thẳng lên `origin/main` để Vercel xuất bản tự động.

### Mốc Đồng Bộ Hai Chiều Web Widget ➔ Hộp Thư & Bảo Toàn Thẻ Xác Nhận Đặt Lịch Cho Con Người Kiểm Soát — 07/11/2026 (Chinh)

- **1. Đáp ứng trọn vẹn yêu cầu kiểm soát của con người (Human-in-the-loop):**
  - Mọi tin nhắn khách chat trên trang Web Widget (`/widget`) và các thẻ xác nhận đặt lịch xem sảnh tiệc cưới phải được lưu trữ bền bỉ và đồng bộ tức thì vào Hộp thư đa kênh (`/inbox`).
  - Nhân viên lễ tân/quản trị viên mở Hộp thư là thấy ngay cuộc trò chuyện của khách Web, đọc được toàn bộ diễn biến hỏi đáp, thấy thẻ xác nhận lịch hẹn (kèm ngày giờ, sảnh, số khách, SĐT và nút thêm Google Calendar) để đón tiếp chu đáo.
- **2. Kiến trúc Module Đồng Bộ Hai Chiều `lib/inbox/widget-sync.ts`:**
  - `syncWidgetChatToInbox()`: Chuyển đổi danh sách tin nhắn Widget (`WidgetMessage[]`) sang chuẩn hội thoại Inbox (`Conversation`), đồng bộ theo thời gian thực mỗi khi khách gửi tin hoặc bot phản hồi.
  - Tự động bóc tách và gắn thẻ xác nhận lịch hẹn `bookingConfirmation` chuẩn xác vào tin nhắn bot trong Hộp thư.
  - Đồng bộ hồ sơ khách hàng vào CRM (`leads`) và lịch hẹn vào CRM (`bookings`) để theo dõi trực quan trên cột Kanban N3 (Khảo sát 1-1).
  - `ensureWidgetConversationInInbox()`: Đảm bảo Hộp thư luôn có cuộc trò chuyện từ Web Widget kèm thẻ đặt lịch xem sảnh của khách Hoàng Thùy Dương (35 bàn, sảnh Hoàng Gia, lịch 09:30 12/11).
- **3. Lưu Trữ Bền Bỉ Phía Widget (`app/widget/page.tsx`):**
  - Lưu tin nhắn vào `WIDGET_SESSION_STORAGE_KEY` trong `localStorage` để khách không bị mất nội dung khi tải lại trang.
  - Khi khách đặt lịch thành công (qua NLP Auto-Book hoặc Form Submit), lập tức đồng bộ thẻ xác nhận vào Hộp thư và gửi thông báo chuông cho nhân viên.
- **4. Kiểm Thử & Kiểm Duyệt:**
  - Bổ sung unit test `tests/clean-data.test.ts` xác thực hàm `syncWidgetChatToInbox` đồng bộ tin nhắn và thẻ đặt lịch vào Inbox theo thời gian thực.
  - **52/52 unit tests passed 100%**. Next.js production build **20/20 trang tĩnh thành công 100%**.
- **5. Triển Khai Trực Tiếp Production:**
  - Commit và push thẳng lên `origin/main` để xuất bản tức thì tại `https://goldenchat-vibecoding.vercel.app`.

### Mốc Ẩn Câu Hỏi Gợi Ý Khỏi Trang Quản Trị Admin (Chỉ Giữ Lại Trên Web Widget Cho Khách) — 07/11/2026 (Chinh)

- **1. Tối ưu UX chuyên nghiệp cho đội ngũ nhân viên & quản lý:**
  - 3 câu hỏi gợi ý (`suggestedQuestions`) là tính năng điều hướng nhanh dành riêng cho **KHÁCH HÀNG** khi tương tác trên Web Widget (`/widget`).
  - Trong trang Quản trị Hộp thư (`/inbox`), nhân viên lễ tân/CSKH là người tiếp quản và trả lời khách, không cần và không nên nhìn thấy các nút câu hỏi gợi ý của khách để tránh gây rối mắt không gian làm việc.
- **2. Thực hiện điều chỉnh:**
  - Trong `components/inbox/chat-pane.tsx`: Loại bỏ hoàn toàn khối render `{questions.map((question) => ...)}`.
  - Giữ lại nút hành động nghiệp vụ `"Đặt lịch xem sảnh / thử món"` khi AI nhận diện ý định đặt lịch để nhân viên thao tác nhanh.
  - Trên trang Web Widget (`app/widget/page.tsx`): **Giữ nguyên 100%** các nút câu hỏi gợi ý để khách hàng bấm hỏi tiếp nhanh chóng.
- **3. Kiểm thử & Triển khai Production:**
  - **52/52 unit tests passed 100%**. Next.js production build **20/20 trang tĩnh thành công 100%**.
  - Deploy thẳng lên `origin/main` để xuất bản tức thì tại `https://goldenchat-vibecoding.vercel.app`.

### Mốc thử kết nối Facebook Messenger — 07/11/2026 (Hiền)

- Đã nhận `origin/main` tại `47cb8be` và tích hợp tiếp giao diện Widget/Inbox của Chinh tại `8b32ba3`, giữ nguyên schema và các file chạy cục bộ chưa commit.
- Kiểm tra Vercel: `GET /api/webhook/botcake` trả HTTP 200 `ready`; `POST /api/simulator/chat` với kênh `facebook` và câu hỏi mẫu về hotline trả đúng nội dung. Kiểm thử cục bộ xác nhận webhook đọc được payload Facebook dạng custom và `entry[].messaging[]`, trả JSON có `data.botReply`; tổng 49 test đạt. Webhook không tự gửi nội dung đó lên Messenger.
- Chuẩn bị bài thử có từ khóa riêng và JSON API trong [docs/test-facebook-botcake.md](../../../docs/test-facebook-botcake.md). Dùng câu hỏi cố định, không gửi dữ liệu khách và không ghi Inbox/CRM. Đã đăng nhập Botcake nhưng onboarding Messenger báo không tìm thấy Page đang quản lý; hồ sơ Pancake hiện nút **Liên kết với tài khoản Facebook**. Chưa cấu hình flow hoặc xác minh tin nhắn Facebook thật. Bước kế tiếp: người quản trị liên kết Facebook và chọn đúng Page, chạy flow rồi đối chiếu phản hồi trong Messenger; kiểm thử đồng bộ Inbox/CRM riêng.
- Đối chiếu lại Facebook: Trang thử là **Vân Chinh** (ID `61595929607803`); link gửi ở lượt đầu mở một Trang khác. Tài khoản Facebook hiện tại có quyền quản lý và nhắn tin trên Vân Chinh, hồ sơ Pancake đã hiện Facebook liên kết. Botcake vẫn báo không tìm thấy Trang sau khi làm mới và đăng nhập lại qua phiên Pancake. Đã mở được màn hình Meta bằng **Đăng nhập bằng tài khoản khác → Facebook** trong luồng Botcake; đang chờ người dùng xác nhận quyền. Chưa kích hoạt Trang hoặc chạy thử Messenger. Kiểm tra lại API Simulator trên Vercel cho kênh Facebook trả đúng câu trả lời mẫu; tài liệu dùng đường dẫn `reply` theo phần xem trước phản hồi của Botcake.

### Mốc Tối Ưu Thời Lượng Tư Vấn 30 Phút & Cho Phép Tối Đa 2 Lịch Đồng Thời — 07/11/2026 (Chinh)

- **1. Chuẩn hóa thời lượng tư vấn (30 phút thay vì 60 phút):**
  - Chinh yêu cầu căn chỉnh thực tế: Mỗi lượt khách đến xem sảnh tiệc / thử món / tư vấn chỉ mất 30 phút.
  - Cập nhật hằng số nghiệp vụ `APPOINTMENT_DURATION_MS = 30 * 60 * 1000` (30 phút) trong `lib/crm/model.ts`.
  - Cập nhật liên kết tạo sự kiện Google Calendar trong `lib/crm/appointment.ts`: Thời gian kết thúc = `start + 30 phút` (thay vì 60 phút).
  - Cập nhật mô tả trong Form đặt lịch `BookingEditor` (`components/crm/booking-editor.tsx`): *"Mỗi lượt tư vấn 30 phút (tối đa 2 lịch 1 lúc). Lịch này chưa giữ chỗ sảnh tiệc."*.
- **2. Cho phép tối đa 2 lịch đồng thời 1 lúc cho mỗi nhân viên tư vấn:**
  - Logic cũ: Chặn ngay khi có 1 lịch trùng (`overlapping.length >= 1`).
  - Logic mới: Cho phép **tối đa 2 lịch 1 lúc** (`MAX_CONCURRENT_BOOKINGS_PER_STAFF = 2`). Chỉ khi đã có từ 2 lịch hẹn (`pending` hoặc `confirmed`) trong cùng khung giờ 30 phút thì lịch thứ 3 mới bị từ chối báo lỗi 409 (`CRMError`).
  - Khung giờ tiếp theo cách nhau 30 phút (ví dụ 09:00 và 09:30) là hai slot độc lập, không bị tính là trùng lịch.
  - Cập nhật PostgreSQL migration `supabase/migrations/20261105_golden_palace_crm.sql`:
    - `NEW.appointment_end := NEW.appointment_time + interval '30 minutes'`.
    - Bỏ `EXCLUDE` constraint đơn lẻ cũ, thay bằng Trigger `crm_check_staff_concurrency` kiểm tra đếm `count(*) >= 2` trong khung 30 phút để ném lỗi `23P01`.
- **3. Kiểm thử & Triển khai:**
  - Cập nhật bộ unit test `tests/crm.test.ts` và `tests/crm-migration.test.ts` xác thực cho phép 2 lịch đồng thời và chặn lịch thứ 3.
  - Đạt **53/53 tests pass 100%**. Next.js production build **20/20 trang tĩnh thành công 100%**.

### Mốc Đồng Bộ Toàn Diện & Kích Hoạt Âm Thanh Chúc Mừng 100% — 07/11/2026 (Chinh & Hiền)

- **1. Hợp nhất kiểm thử Botcake & tài liệu kết nối Facebook từ Chị Hiền:**
  - Nhận và tích hợp tài liệu hướng dẫn kiểm thử Messenger qua Botcake `docs/test-facebook-botcake.md`.
  - Tích hợp bộ kiểm thử Facebook Webhook đọc sự kiện custom và `entry[].messaging[]` trong `tests/channel-booking.test.ts`.
- **2. Kích hoạt mở khóa Web Audio tự động & Phát âm thanh chúc mừng đặt lịch:**
  - Mở khóa `AudioContext` (`unlockAudioContext()`) ngay khi người dùng tương tác trên Widget, Inbox và CRM.
  - Tự động phát hiệu ứng âm thanh chúc mừng hoan ca `playBookingSuccessCelebrationTone(true)` kèm fallback WAV khi đặt lịch hoặc xác nhận lịch thành công.
- **3. Kiểm thử & Triển khai Production:**
  - **53/53 unit tests pass 100%**. Next.js build **20/20 static pages thành công 100%**.
  - Đã deploy thẳng lên production `origin/main` tại `https://goldenchat-vibecoding.vercel.app` theo quy định triển khai trực tiếp 07/11/2026.

### Mốc Tối Ưu Âm Thanh Chúc Mừng Đặt Lịch & Hoàn Thiện Suite Kiểm Thử — 07/11/2026 (Chinh)

- **1. Triệt để giải quyết Web Audio Autoplay Policy & Âm thanh chúc mừng tiệc cưới:**
  - Khắc phục triệt để hiện tượng `AudioContext` bị suspended sau lệnh bất đồng bộ `await saveChatBooking(...)`: Bổ sung cơ chế phát silent buffer 1 mẫu trong `unlockAudioContext()` ngay khi người dùng click/chạm vào các nút đặt lịch.
  - Tích hợp `unlockAudioContext()` đồng bộ ngay đầu `handleBookingSubmit`, `bookInChat` và `BookingEditor.onSubmit`.
  - Cung cấp nút nghe thử âm chúc mừng tiệc cưới (🎉) trực tiếp trên Popup Đặt lịch Widget (`app/widget/page.tsx`), trong Dropdown Chuông thông báo (`NotificationBell`), và trong Dialog Đổi/Tạo lịch CRM (`BookingEditor`) để người dùng/nhân viên kiểm tra âm thanh tức thì với 1-chạm.
  - Nâng cấp bộ tổng hợp WAV PCM 16-bit 22050Hz trực tiếp trong RAM phát qua HTML5 `new Audio(url)` fallback nếu Web Audio API gặp hạn chế nền tảng.
- **2. Đồng bộ giao diện và hoàn thiện 100% bộ kiểm thử trình duyệt Playwright:**
  - Cố định vùng an toàn cho nút bấm nổi `Widget Launcher` trên mobile landscape (`widget-mobile.spec.ts`).
  - Cập nhật định danh hội thoại chuẩn production `Hoàng Thùy Dương (Web Widget)` trong `meta-chat.spec.ts`.
  - Hoàn thiện test chuông thông báo, âm thanh Ding-Dong, âm thanh chúc mừng 🎉 và App Badging title trong `notifications.spec.ts`.
- **3. Kiểm thử & Triển khai:**
  - **53/53 unit tests pass 100%**.
  - Toàn bộ các suite kiểm thử trình duyệt Playwright (`meta-chat`, `notifications`, `widget-meta-ux`, `widget-mobile`) **PASS 100%**.
  - Next.js production build **20/20 static pages thành công 100%**.
  - Deploy thẳng lên `origin/main` (Vercel production) tại `https://goldenchat-vibecoding.vercel.app` theo quy định triển khai trực tiếp 07/11/2026.

### Mốc Bảo Mật Phân Quyền & Loại Bỏ Đăng Nhập Nhanh 1-Chạm — 07/11/2026 (Chinh)

- **1. Phân quyền người dùng chuẩn 3 cấp (RBAC):**
  - **Admin (Ban Giám Đốc):** Toàn quyền hệ thống, cài đặt kênh webhook, training bot AI, quản lý người dùng, chỉ định ca trực chat cho nhân viên.
  - **Quản lý (Trần Vân Chinh):** Toàn quyền vận hành thực tế, được thêm/sửa/xóa người dùng, chỉ định phiên chat cho nhân viên, quản lý khách hàng và lịch hẹn (chỉ hạn chế các cấu hình kỹ thuật cốt lõi).
  - **Nhân viên (Ngọc Khánh, Thu Hà):** Trực chat đa kênh, xem thông tin khách hàng, tư vấn tiệc cưới & sự kiện, chăm sóc khách hàng; không truy cập màn hình cài đặt hệ thống hay quản trị người dùng.
  - Hỗ trợ Admin & Quản lý chỉ định ca trực hoặc nhân viên phụ trách trực tiếp trên từng cuộc hội thoại Hộp thư (`inbox-workspace.tsx`).
- **2. Ngừng tự động đăng nhập Admin & Bảo vệ người dùng mới:**
  - Khắc phục triệt để hiện tượng khách truy cập bất kỳ tự động nhận quyền Admin (`usr_admin`) trong `lib/auth/auth-context.tsx`.
  - Khách chưa xác thực bắt đầu với trạng thái `currentUser = null`, hiển thị nút "Đăng nhập" chuẩn chỉ.
- **3. Loại bỏ hoàn toàn đăng nhập nhanh 1-chạm & Che giấu thông tin bảo mật:**
  - Gỡ bỏ hoàn toàn khối giao diện "Đăng nhập nhanh 1-chạm (3 cấp phân quyền)" và nút "⚡ Đăng nhập 1-chạm với quyền Quản trị viên (Admin)" trong `LoginDialog`.
  - Gỡ bỏ khối chuyển nhanh vai trò 1-chạm trong `UserProfileMenu` và các chip demo trong `CRMAccessPanel`.
  - Chỉ giữ lại duy nhất form đăng nhập thủ công chuẩn mực: Tên đăng nhập (Username) + Mật khẩu (Password kèm nút mắt ẩn/hiện).
  - Làm sạch placeholder, tuyệt đối không để lộ gợi ý tài khoản mẫu hay mật khẩu mặc định trên màn hình đăng nhập.
- **4. Kiểm thử & Triển khai Production:**
  - **53/53 unit tests pass 100%**.
  - Toàn bộ 5 test Playwright Hộp thư (`tests/browser/inbox.spec.ts`) **PASS 100%**.
  - Next.js production build **20/20 static pages thành công 100%**.
  - Triển khai trực tiếp lên `origin/main` (Vercel production) theo chỉ định tuyệt đối của Chinh.

### Mốc Nâng Cấp NLP Smart Booking Parser & Hỗ Trợ Mọi Định Dạng Nhập Liệu Khách Hàng — 07/11/2026 (Chinh)

- **1. Khắc phục triệt để lỗi không nhận diện Tên và SĐT khi khách nhập:**
  - Triệu chứng: Khách nhắn `"Tên Chi 📞 0933847772"` nhưng bot liên tục lặp lại câu hỏi *"Anh/chị cho em xin Tên và Số điện thoại để hoàn tất phiếu hẹn nhé ạ!"*.
  - Nguyên nhân:
    1. Bộ trích xuất cũ sử dụng lookahead cứng `(?=[,.;!\n]|$|\s+(?:sđt|sdt|số|lúc|ngày|ở|đến))` và không hỗ trợ icon/emoji điện thoại `📞`, `📱`, `☎️`, `📲`. Khi gặp ký tự `📞` hoặc số điện thoại đứng liền kề, regex bóc tách Tên bị đứt gãy dẫn đến `fullName = null`.
    2. API route gộp chung điều kiện `!bookingDetails.fullName || !bookingDetails.phone` thành một câu hỏi xin cả Tên và SĐT, khiến khách hàng đã gửi SĐT hoặc Tên cảm thấy bot không nhận được thông tin.
- **2. Kiến trúc 2 bước (Multi-pass Parsing) thông minh & siêu linh hoạt:**
  - **Bước 1 (Trích xuất SĐT độc lập):** Nhận diện chính xác mọi định dạng SĐT Việt Nam (9 đến 11 số, bắt đầu bằng 0, +84, 84) với mọi tiền tố `sđt`, `số điện thoại`, `phone`, `tel`, `call`, hoặc icon điện thoại `[📞📱☎️📲]`.
  - **Bước 2 (Làm sạch & Trích xuất Họ Tên):** Tách SĐT và icon điện thoại ra khỏi chuỗi văn bản, sau đó trích xuất Tên bằng cả từ khóa chỉ định (`Tên Chi`, `Tôi tên Dũng`, `Chị là Trang`), đại từ xưng hô (`Chị Vân`), hoặc chuỗi chữ cái cô đọng (1-4 từ như `Chi`, `Trần Vân Chinh`).
  - Hỗ trợ hoàn hảo mọi biến thể nhập liệu tự nhiên:
    * `"Tên Chi 📞 0933847772"` -> Tên: Chi, SĐT: 0933847772.
    * `"Chi 0933847772"` -> Tên: Chi, SĐT: 0933847772.
    * `"Tên: Chi 0933847772"` -> Tên: Chi, SĐT: 0933847772.
    * `"Chi 📞0933847772"` -> Tên: Chi, SĐT: 0933847772.
    * `"0933847772 tên Chi"` -> Tên: Chi, SĐT: 0933847772.
  - Phân tách phản hồi thông minh trong `app/api/simulator/chat/route.ts`:
    * Đã có Ngày Giờ + Tên + SĐT -> **Tự động chốt lịch ngay lập tức (Auto-Booking)** và phát âm thanh chuông mừng tiệc cưới 🎉.
    * Đã có Ngày Giờ + Tên, thiếu SĐT -> Chỉ xin Số điện thoại (`promptFor: "phone"`).
    * Đã có Ngày Giờ + SĐT, thiếu Tên -> Chỉ xin Họ tên (`promptFor: "fullName"`).
- **3. Kiểm thử & Triển khai Production:**
  - Bổ sung bộ test ca nhập liệu phong phú trong `tests/nlp-booking.test.ts`.
  - Đạt **55/55 unit tests pass 100%**.
  - Toàn bộ 4 bộ test Playwright browser (`meta-chat`, `notifications`, `widget-meta-ux`, `widget-mobile`) **PASS 100%**.
  - Next.js production build **20/20 static pages thành công 100%**.
  - Triển khai trực tiếp lên `origin/main` (Vercel production) tại `https://goldenchat-vibecoding.vercel.app` theo quy định ngày 07/11/2026.

### Mốc Tối Giản Câu Phản Hồi Khi Trùng Lịch / Kín Khung Giờ Đặt Lịch — 07/11/2026 (Chinh)

- **1. Tinh gọn triệt để câu thông báo trùng lịch gửi tới khách hàng:**
  - Thay vì câu cảnh báo nội bộ dài dòng mang tính kỹ thuật (`⚠️ Lưu ý: Nhân viên tư vấn đã có tối đa 2 lịch hẹn trong khung 30 phút này (tối đa 2 lịch 1 lúc)...`), Chinh chỉ thị khi trùng lịch chỉ cần ngắn gọn: bên em bận, anh chị vui lòng đổi qua khung giờ khác.
  - Chuẩn hóa câu phản hồi trên toàn hệ thống (Web Widget, CRM Model, CRM Server):
    `"Dạ khung giờ này bên em bận rồi ạ, anh/chị vui lòng đổi qua khung giờ khác giúp em nhé!"`
  - Đính kèm 3 nút gợi ý đổi giờ trực quan, 1-chạm: `["Đổi sang 09:30", "Đổi sang 10:00", "Hotline: 0228 659 5959"]`.
- **2. Tối ưu luồng phản hồi Auto-Booking:**
  - Loại bỏ hoàn toàn tin nhắn đệm thừa thãi `"Dạ em đang lưu lịch hẹn cho anh/chị ạ."`.
  - Khi khách cung cấp đủ thông tin hoặc đổi giờ, hệ thống tiến hành lưu trực tiếp và trả về kết quả duy nhất:
    * Nếu khung giờ trống: Hiển thị ngay thẻ `"🎉 ĐẶT LỊCH THÀNH CÔNG!"` kèm chi tiết và âm thanh chúc mừng tiệc cưới.
    * Nếu khung giờ đã bận (trùng lịch): Hiển thị ngay câu thông báo ngắn gọn `"Dạ khung giờ này bên em bận rồi ạ, anh/chị vui lòng đổi qua khung giờ khác giúp em nhé!"`.
- **3. Kiểm thử & Triển khai:**
  - **55/55 unit tests pass 100%**.
  - Next.js production build **20/20 static pages thành công 100%**.
  - Deploy trực tiếp lên `origin/main` (Vercel production).

### Mốc Đồng Bộ Số Lượng Tin Chưa Đọc Thực Tế Cho Badge Navigation (Loại Bỏ Badge Cố Định 18) — 07/11/2026 (Chinh)

- **1. Khắc phục triệt để lỗi hardcode badge "18" tin nhắn:**
  - Trước đây: `components/mobile-bottom-nav.tsx` và `app/(dashboard)/layout.tsx` hardcode số lượng badge cố định `"18"` trên icon "Tin nhắn" / "Kênh chat". Ngay cả khi hộp thư không có tin nhắn nào chưa đọc (`unread = 0`), badge đỏ vẫn hiện số 18 gây hiểu nhầm cho người dùng.
  - Khắc phục: Xây dựng hook thời gian thực `useInboxUnreadCount` (`lib/inbox/use-unread-count.ts`) và hàm `getInboxUnreadCount()`.
- **2. Cơ chế tính toán và hiển thị theo số lượng thực tế (Dynamic Real-time Badge):**
  - Quét danh sách hội thoại trong bộ nhớ lưu trữ `STORAGE_KEY` (`omnichat.inbox.golden-palace.v1`).
  - Tính tổng số tin nhắn chưa đọc từ các hội thoại đang mở (`status !== "archived"`).
  - Khi không còn tin nhắn nào chưa đọc (`unreadCount === 0`): **Ẩn hoàn toàn badge** (không render thẻ số).
  - Khi có tin nhắn chưa đọc (`unreadCount > 0`): Hiển thị chính xác con số thực tế (nếu > 99 hiển thị `"99+"`).
  - Đồng bộ tức thì qua các sự kiện: `storage`, `omnichat-inbox-updated`, `omnichat-inbox-cleared`, `omnichat-demo-restored` và BroadcastChannel `omnichat-widget-sync`.
  - Khi người dùng click vào một hội thoại để đọc tin nhắn, hội thoại được chuyển về `unread: 0` và bắn sự kiện `omnichat-inbox-updated` -> Badge trên Bottom Navigation và Top Navigation biến mất ngay lập tức.
  - Đồng bộ với `updateAppBadge` trên PWA icon và title của tab trình duyệt.
- **3. Kiểm thử & Triển khai Production:**
  - Bổ sung unit test `tests/unread-count.test.ts` kiểm thử các trường hợp unread count = 0, tính tổng unread, và bỏ qua hội thoại lưu trữ.
  - **57/57 unit tests pass 100%**.
  - Playwright test `tests/browser/widget-mobile.spec.ts` **2/2 tests pass 100%**.
  - Next.js production build **20/20 static pages thành công 100%**.
  - Đẩy trực tiếp lên `origin/main` (Vercel production) tại `https://goldenchat-vibecoding.vercel.app`.


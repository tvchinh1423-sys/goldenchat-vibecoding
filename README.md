# OmniChat AI · Golden Palace showcase

Chatbot FAQ & đặt lịch tư vấn đa kênh cho VibeCoding 2026, dùng **Trung tâm Tiệc
cưới & Sự kiện Golden Palace** làm doanh nghiệp minh họa. Next.js 14 App Router,
TypeScript, Tailwind CSS, Radix/shadcn và Supabase adapter.

## Chạy ứng dụng

```sh
npm install
npm run dev
```

Mở `/inbox` để thử hội thoại, `/leads` để quản lý khách hàng/lịch hẹn,
`/training` để cấu hình tri thức, `/settings` để cấu hình kênh, `/widget` để xem chat nhúng.

## Phần đã nối

- Inbox ba cột: tìm kiếm không dấu/SĐT, bộ lọc đa kênh, ghi chú, phân công,
  hoàn tất/lưu trữ, form khách hàng, hỗ trợ mobile và điều hướng PWA.
- Soạn nháp Inbox gọi Gemini hoặc 9Router khi có khóa; chưa cấu hình dùng gợi ý FAQ
  có nhãn demo, luôn chờ tư vấn viên duyệt. Xem [AI Engine](docs/ai-engine.md).
- Tạo khách từ Inbox sang CRM, chống trùng SĐT; hồ sơ có nhu cầu, số bàn, ngày tổ chức,
  nguồn và phụ trách. Kanban N1–N5/N0, danh sách/phễu và các bộ lọc dùng chung dữ liệu.
- Tạo/đổi/xác nhận/hủy/hoàn tất lịch xem sảnh, thử món, tư vấn; giờ Việt Nam, chặn
  chồng 60 phút của cùng tư vấn viên. Lịch tư vấn chưa giữ chỗ sảnh hoặc xác nhận cọc.

**Mặc định là demo cục bộ**, lưu vào trình duyệt. Tin nhắn chưa gửi qua Botcake;
cờ AI chưa kích hoạt tự động trả lời. CRM có adapter Supabase riêng, migration và
đăng nhập workspace; chưa xác minh dịch vụ cloud thật trên máy này. Xem
[hướng dẫn CRM Golden Palace](docs/crm-golden-palace.md) để thử luồng và cấu hình.
Biểu đồ hiện là phân bố giai đoạn, chưa có lịch sử tỷ lệ chuyển đổi.

Training, Simulator, Webhook Botcake, Settings, Widget, Google Sheets FAQ và Telegram
được tích hợp từ nhánh của Chinh; trạng thái kiểm tra dịch vụ thật theo skill dự án.
Schema bàn giao cục bộ được giữ nguyên. CRM dùng migration riêng trong
`supabase/migrations`; không chạy schema tắt RLS cũ sau migration CRM.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Kiểm thử SQL chạy PostgreSQL cục bộ qua PGlite, không cần khóa cloud. Kiểm thử
trình duyệt dùng Chrome đã cài, production server ở cổng 3100 sau khi build.
Không commit `.env.local`, API key hoặc dữ liệu khách thật.

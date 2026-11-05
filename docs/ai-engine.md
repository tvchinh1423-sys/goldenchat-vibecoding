# AI Engine và soạn nháp Inbox

`lib/ai-engine.ts` cung cấp `generateBotReply({ messages, context? })`,
`generateDraftReply({ messages, context? })` và export `extractLeadInfo(text)`.
Hai hàm sinh trả lời trả về `Promise<string>`; không tự gửi tin hay đặt lịch.
`messages` gồm `{ sender: "customer" | "agent" | "bot", content: string }`.

Khi không truyền `context`, engine đọc `bot_configs.config_value` với
`config_key = main_bot_config` và FAQ đang hoạt động trong `knowledge_base`.
Persona, Guardrails và tên doanh nghiệp lấy từ cấu hình; engine không cố định ngành.
Chưa có cấu hình Supabase thì dùng preset Golden Palace và ghi nguồn `demo`.
Nếu đã cấu hình Supabase mà đọc thất bại, báo lỗi; FAQ rỗng được giữ rỗng,
không tự thay bằng FAQ của ngành khác. Schema hiện tại là một workspace dùng chung;
chưa có tenant isolation cho nhiều doanh nghiệp trên cùng database.

Thiết lập trong `.env.local` (không commit khóa):

- Gemini: `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, tùy chọn `GEMINI_MODEL`.
- 9Router: `AI_PROVIDER=9router`, `NINE_ROUTER_API_KEY`,
  `NINE_ROUTER_BASE_URL` có hậu tố `/v1`, `NINE_ROUTER_MODEL` đúng ID trong dashboard.
  Chỉ dùng HTTP cho localhost; endpoint từ xa cần HTTPS.
- Không đặt provider/khóa: `/api/ai/draft` chỉ dùng FAQ mẫu khi nguồn context là
  `demo`, phản hồi `mode: "demo"`. Không giả lập thành công khi nhà cung cấp lỗi.

Nút Soạn nháp gọi `POST /api/ai/draft` với `{ messages }`, điền composer và chờ
nhân viên duyệt. Có trạng thái chờ/lỗi; sửa nội dung, gửi, lưu trữ hay chuyển
hội thoại sẽ hủy yêu cầu đang chờ để tránh điền sai bản nháp. API không nhận
API key hay cấu hình Persona từ client. Không ghi Supabase hoặc gửi Botcake.
Simulator, webhook và widget hiện giữ luồng riêng của Chinh; cần adapter riêng
để chuyển các luồng đó sang engine và áp dụng cờ AI/giờ trực/kênh trước khi gửi.

`extractLeadInfo` chạy cục bộ, không gọi mô hình: trả về `fullName`, `phone`,
`eventDate` (DD/MM hoặc DD/MM/YYYY, không đoán năm), `tableCount`; không có thông
tin rõ ràng thì trả `null`. Chỉ truyền tin khách để tránh lấy nhầm chữ ký nhân viên.
Ngày xem sảnh không dùng làm ngày tổ chức. Số bàn dạng khoảng cần tư vấn viên xác minh.
Thông tin này hiển thị trong cột khách hàng và điền nhu cầu của form tạo lead.
Đây là bóc tách theo quy tắc cho các mẫu rõ ràng; nhân viên cần duyệt lại dữ liệu.

Kiểm thử provider dùng HTTP mock; chưa xác minh khóa thật, model/quota thực tế,
database thật hay gửi tin đa kênh. Guardrails được đưa vào system prompt;
chưa có bộ kiểm duyệt đầu ra độc lập. Timeout nhà cung cấp 25 giây, không trả
nội dung provider lỗi hoặc thông tin khóa ra giao diện.

Giao thức tham chiếu: [Gemini generateContent](https://ai.google.dev/api/generate-content),
[9Router integration](https://github.com/decolua/9router/blob/master/gitbook/content/en/integration/other-tools.md).

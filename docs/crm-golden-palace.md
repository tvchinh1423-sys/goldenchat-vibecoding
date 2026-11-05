# CRM & lịch hẹn Golden Palace

Showcase là **Trung tâm Tiệc cưới & Sự kiện Golden Palace**. Phễu dùng N1 Lead thô,
N2 Tiềm năng, N3 Khảo sát 1-1, N4 Chính thức, N5 Nuôi dưỡng, N0 Đã mất.

## Thử luồng trên máy

1. Chạy `npm run dev`, mở `/inbox`, chọn Dũ Chanh.
2. Bấm **Tạo khách mới**, duyệt tên/SĐT/nhu cầu rồi **Lưu khách hàng**.
3. Bấm **Mở hồ sơ & lịch hẹn trong CRM**, mở hồ sơ Vũ Huyền Trang.
4. Tạo lịch **Xem sảnh**, **Thử món** hoặc **Tư vấn sự kiện** ở thời gian tương lai.
5. Tải lại trang; kiểm tra hồ sơ, Kanban, danh sách/phễu và lịch hẹn.

Mỗi lịch kéo dài 60 phút, theo giờ Việt Nam (UTC+7), tối đa 50 khách tham gia.
Hai lịch đang chờ/đã xác nhận của cùng người tiếp đón không được chồng nhau.
Tên nhân viên được so không phân biệt hoa/thường, bỏ khoảng trắng ở hai đầu.
Hai lịch liền kề được phép; đổi người tiếp đón hoặc hủy lịch sẽ giải phóng khung giờ.
Đổi lịch đưa trạng thái về **Chờ xác nhận**. Lịch đã qua phải đổi giờ trước khi mở lại.
Tạo/đổi lịch chuyển N1/N2 sang N3; giữ N4/N5/N0 hiện có. Hủy lịch không tự lùi giai đoạn.
Đây là lịch tư vấn, **không phải** kiểm tra tồn sảnh, đặt giữ sảnh hoặc xác nhận cọc.
Ngày tổ chức lưu riêng dưới dạng DD/MM hoặc DD/MM/YYYY; thiếu năm thì giữ nguyên.

## Chế độ demo (mặc định)

`CRM_MODE=demo` dùng dữ liệu hư cấu và `localStorage`:

- CRM: `omnichat.crm.golden-palace.v1` (khách + lịch hẹn trong cùng bản lưu).
- Inbox: `omnichat.inbox.golden-palace.v1` (tin nhắn, ghi chú, cờ AI).
- Đọc các lead đã tạo trong Inbox và giai đoạn Kanban cũ khi chưa có bản CRM mới;
  không xóa hoặc sửa các key cũ. Hồ sơ Trang được bổ sung thông tin thay vì tạo thẻ trùng.
- Chặn trùng SĐT sau chuẩn hóa `+84`/dấu cách/chấm/gạch ngang.
- Chỉ báo lưu thành công sau khi ghi browser storage thành công. Bản lưu CRM hỏng
  báo lỗi và giữ nguyên; không tự ghi đè bằng dữ liệu mẫu.

Dữ liệu chỉ nằm trên trình duyệt đang dùng. Không gửi tin Botcake, Telegram hay
Google Calendar. Đổi N4 bằng tay không xác nhận tiền cọc. Biểu đồ phễu biểu diễn
phân bố hiện tại theo bộ lọc, chưa có lịch sử chuyển đổi theo thời gian.

## Supabase dùng chung (chưa xác minh với dự án thật)

CRM dùng một workspace; chưa có tách tenant hay tài khoản/quyền theo nhân viên.
Không có dữ liệu demo nào được tự động nạp lên Supabase.

1. Xác định đúng dự án Supabase với Chinh. Sao lưu và thử trên database test trước.
2. Chạy `supabase/migrations/20261105_golden_palace_crm.sql` trong SQL Editor.
   Migration tạo/mở rộng `leads`, `bookings`, giữ cột cũ và ánh xạ legacy status nếu
   chưa có stage. Dữ liệu nhu cầu/phụ trách cũ được giữ; không xóa bản ghi trùng.
   Trùng SĐT hoặc lịch chồng đang có sẽ làm migration rollback toàn bộ; cần đối chiếu
   và xử lý dữ liệu trước khi chạy lại. Chạy lại migration hợp lệ không nhân đôi cấu trúc.
3. Cấu hình `.env.local` hoặc biến môi trường hosting rồi khởi động lại:

   ```dotenv
   CRM_MODE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<khóa phía máy chủ>
   CRM_ACCESS_PASSWORD=<mật khẩu riêng dài ít nhất 24 ký tự>
   ```

   Dùng URL thật. Không thêm `NEXT_PUBLIC_` vào hai biến bí mật, không commit khóa.
   Provider AI vẫn dùng cấu hình độc lập trong `docs/ai-engine.md`.
4. Mở `/leads`, đăng nhập bằng mật khẩu workspace, tạo khách và kiểm tra lưu ở DB.
   Phiên cookie HttpOnly/SameSite Strict hết hạn sau 8 giờ; HTTPS trên hosting.
5. Kiểm tra tạo khách từ Inbox, lịch hẹn, tải lại và đăng xuất bằng tài khoản thật
   trước khi tuyên bố đã tích hợp Supabase.

Migration bật RLS và thu hồi quyền trực tiếp của `anon`/`authenticated` trên hai bảng
CRM; backend sử dụng client service-role riêng sau bước đăng nhập. Không chạy lại
đoạn tắt RLS trong schema bàn giao cũ. Handler Botcake hiện dùng anon client của
Chinh nên **phần tự tạo lead qua webhook cần adapter xác thực riêng** trước khi
bật CRM thật; không mở lại quyền public để chữa lỗi. Tin nhắn Inbox hiện vẫn là demo,
chưa tải hội thoại Supabase/Botcake thật. Bảo vệ CRM không thay thế xác thực cho các
API Training/Webhook khác trong dự án.

Mật khẩu workspace phù hợp showcase đội nhỏ; giới hạn lần đăng nhập trong bộ nhớ
chỉ có tác dụng từng server instance. Cần SSO/phân quyền và rate limit tập trung
trước khi mở rộng thành dịch vụ nhiều khách hàng.

## API

| Endpoint | Thao tác |
| --- | --- |
| `GET /api/crm` | Snapshot khách/lịch, `mode` demo hoặc supabase |
| `POST /api/crm/session` | Đăng nhập workspace, body `{ password }` |
| `DELETE /api/crm/session` | Đăng xuất |
| `POST /api/crm/leads` | Tạo khách, kiểm tra trùng SĐT/hội thoại |
| `PATCH /api/crm/leads/:id` | Cập nhật đầy đủ hồ sơ hoặc riêng `{ stage }` |
| `POST /api/crm/bookings` | Tạo lịch bằng RPC transaction |
| `PATCH /api/crm/bookings/:id` | Đổi lịch đầy đủ hoặc `{ status }` |

Mutation phải cùng origin. Chưa đăng nhập trả 401; thông tin sai 400; không tìm thấy
404; trùng khách/lịch 409; DB/cấu hình lỗi 503. Không trả chi tiết lỗi DB hay bí mật.
Supabase lỗi không chuyển ngầm sang demo. API demo chỉ trả nhãn mode; dữ liệu được
xử lý/kiểm tra/ghi ở trình duyệt, không có DB giả toàn cục trên server.

RPC `crm_save_booking` ghi lịch và nâng N3 trong cùng transaction. Exclusion
constraint PostgreSQL bảo vệ lịch chồng kể cả khi hai yêu cầu đến cùng lúc; không
dựa vào thao tác kiểm tra rồi insert ở trình duyệt.

Tham chiếu: [Supabase server keys](https://supabase.com/docs/guides/database/secure-data),
[Supabase RPC](https://supabase.com/docs/reference/javascript/rpc),
[PostgreSQL range constraints](https://www.postgresql.org/docs/15/rangetypes.html).

## Kiểm tra

`npm test` có kiểm thử validation, chuyển dữ liệu cũ, lỗi lưu, API HTTP mock và
migration thực thi trên PostgreSQL WASM (PGlite), gồm RLS, chạy lại, trùng SĐT,
overlap, rollback, hủy lịch, giờ tương lai. Đây không phải Supabase cloud thật.
`npm run build` rồi `npm run test:e2e` kiểm tra trình duyệt desktop/mobile.

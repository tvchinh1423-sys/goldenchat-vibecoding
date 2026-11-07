# Thử Facebook Messenger qua Botcake

Bài thử chạy một câu hỏi mẫu qua luồng Messenger → Botcake → OmniChat → Botcake → Messenger. Dùng một từ khóa riêng trên Page thử nghiệm hoặc Page được phép thử. Luồng này không ghi hội thoại vào Inbox, không tạo lead và không gửi cảnh báo Telegram.

Đã xác minh ngày 07/11/2026 trên Fanpage Vân Chinh (Page ID trong Botcake `1442901792232043`). Gửi `omnichat-fb-test` trong [Messenger của Vân Chinh](https://m.me/1442901792232043) để chạy lại bài thử. Phản hồi bắt đầu bằng `[OmniChat test]` và chứa `0228 659 5959`.

1. Vào [Botcake](https://botcake.io/) bằng tài khoản quản trị Page. Chọn **Messenger** và đúng Page. Nếu chưa có Page trong danh sách, làm theo [hướng dẫn kết nối Facebook của Botcake](https://docs.pancake.biz/botcake/st-f2/st-p1?lang=en).
2. Tạo flow `OmniChat Facebook smoke test`. Thêm [block JSON API](https://docs.pancake.biz/botcake/st-f3/st-p3/st-s1?lang=en) với phương thức `POST`, URL `https://goldenchat-vibecoding.vercel.app/api/simulator/chat`, header `Content-Type: application/json` và body sau:

   ```json
   {"channel":"facebook","message":"Hotline Golden Palace la gi?"}
   ```

3. Bấm **Gửi** để chạy thử request trong block. Mong đợi HTTP 200, `success: true` và `reply` chứa `0228 659 5959`. Trong **Cấu hình → User Field**, tạo trường kiểu **Chuỗi ký tự** `omnichat_facebook_test_reply`. Ánh xạ `reply` vào trường đó. Nối block gọi API với một block tin nhắn riêng và chèn biến bằng bộ chọn **User Field**. Request chỉ chứa câu hỏi mẫu.
4. Vào [Automation → Keywords](https://docs.pancake.biz/botcake/st-f3/st-p4/st-s5?lang=en), tạo từ khóa `omnichat-fb-test` trong nhóm **Nội dung là → Từ khoá** và chọn flow đã lưu. Bật quy tắc, gửi đúng từ khóa trong Messenger và kiểm tra lời đáp có hotline. Có thể tắt quy tắc khi không còn cần chạy lại bài thử.

Nếu **Test Request** có `reply` nhưng Messenger không phản hồi, kiểm tra block gửi tin đã lấy đúng Custom Field, từ khóa đã bật, đúng Page và quyền nhắn tin của Botcake. Nếu **Test Request** lỗi, kiểm tra URL, phương thức và JSON trước.

Nếu **Nhật ký hệ thống** ghi lỗi `100 / 2018034` về tin nhắn trống, kiểm tra thẻ JSON API và lời đáp nằm ở hai block nối tiếp. Bài thử trên Vân Chinh gặp lỗi này khi đặt cả hai thẻ trong cùng block. Sau khi tách block và bấm **Cập nhật**, Messenger đã nhận câu trả lời.

Nếu Botcake báo không tìm thấy Page nào đang quản lý, vào [hồ sơ Pancake](https://account.pancake.vn/profile) và chọn **Liên kết với tài khoản Facebook**. Nếu đang liên kết nhầm tài khoản hoặc cần cấp lại quyền cho Page, dùng **Đổi Facebook**. Chọn tài khoản có quyền quản lý đúng Page, sau đó đăng nhập lại Botcake. Xem [hướng dẫn xử lý của Botcake](https://docs.pancake.biz/botcake/st-f6/st-p5/st-s7?lang=en).

Nếu hồ sơ Pancake đã hiển thị Facebook nhưng Botcake vẫn báo chưa liên kết sau khi làm mới quyền, đăng xuất Botcake. Tại màn hình Pancake, chọn **Đăng nhập bằng tài khoản khác → Facebook** để mở bước cấp quyền Meta dành cho Botcake. Đối chiếu tên và ID Trang trong Facebook trước khi cấp quyền, rồi chỉ chọn Trang dùng cho bài thử nếu Meta cho chọn từng Trang.

Webhook `/api/webhook/botcake` hiện trả nội dung ở `data.botReply` trong JSON và không gọi API gửi Messenger. `GET` trả `ready`, nút ping, hoặc mô phỏng `POST` thành công không xác nhận Botcake đã nhận/gửi tin thật. Bài thử JSON API trên dùng kho câu hỏi mẫu của Simulator. Đồng bộ Inbox và tạo lead thật cần kiểm thử riêng sau khi có cấu hình lưu trữ và luồng nhận sự kiện thật.

## Bài thử theo nội dung Messenger

Đã xác minh ngày 07/11/2026 trên Page Vân Chinh. Trong [Messenger của Page](https://m.me/1442901792232043), gửi `omnichat-fb-faq-test`, chờ lời mời nhập câu hỏi rồi gửi một câu FAQ. Flow nhận một câu mỗi lượt. Để thử câu khác, gửi lại từ khóa và chờ lời mời mới. Chỉ dùng câu hỏi mẫu.

- `Hotline Golden Palace là gì?` nhận phản hồi có **0228 659 5959**.
- `Đặt cọc giữ sảnh bao nhiêu?` nhận phản hồi có **5.000.000 VNĐ**.

Botcake dùng quy tắc **Nội dung là → Từ khoá**, gọi flow `OmniChat Facebook - Thu FAQ dong`. Thẻ Nhập liệu lưu vào User Field dạng chuỗi `omnichat_facebook_test_question`, rồi chuyển sang bản sao `OmniChat Facebook smoke test-copy`. Block JSON API của bản sao gọi endpoint Simulator như bài thử gốc, với Body sau:

```json
{"channel":"facebook","message":"{{user.omnichat_facebook_test_question}}"}
```

Ánh xạ `reply` sang `omnichat_facebook_test_reply`, qua **Smart Delay 12 giây** rồi gửi biến trong một block văn bản riêng. Khi thử với khoảng chờ ngắn hơn, Botcake đã gửi giá trị của lượt trước dù trường phản hồi sau đó chứa câu đúng. Mốc 12 giây đã qua hai câu mẫu liên tiếp trên Messenger. Đây là độ chờ của flow thử, cần cơ chế gửi gắn với từng request trước khi dùng cho khách thật.

Từ khóa động được bật riêng để chạy lại. Flow hotline cố định vẫn hoạt động độc lập. Bài thử không gọi webhook ghi Inbox, tạo lead hoặc gửi Telegram.

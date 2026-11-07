# Thử Facebook Messenger qua Botcake

Bài thử chạy một câu hỏi mẫu qua luồng Messenger → Botcake → OmniChat → Botcake → Messenger. Dùng một từ khóa riêng trên Page thử nghiệm hoặc Page được phép thử. Luồng này không ghi hội thoại vào Inbox, không tạo lead và không gửi cảnh báo Telegram.

1. Vào [Botcake](https://botcake.io/) bằng tài khoản quản trị Page. Chọn **Messenger** và đúng Page. Nếu chưa có Page trong danh sách, làm theo [hướng dẫn kết nối Facebook của Botcake](https://docs.pancake.biz/botcake/st-f2/st-p1?lang=en).
2. Tạo flow `OmniChat Facebook smoke test`. Thêm [block JSON API](https://docs.pancake.biz/botcake/st-f3/st-p3/st-s1?lang=en) với phương thức `POST`, URL `https://goldenchat-vibecoding.vercel.app/api/simulator/chat`, header `Content-Type: application/json` và body sau:

   ```json
   {"channel":"facebook","message":"Hotline Golden Palace la gi?"}
   ```

3. Bấm **Gửi** để chạy thử request trong block. Mong đợi HTTP 200, `success: true` và `reply` chứa `0228 659 5959`. Sao chép đường dẫn `reply` từ phần xem trước phản hồi và ánh xạ vào một Custom Field dạng văn bản, ví dụ `omnichat_facebook_test_reply`. Thêm block tin nhắn kế tiếp, chèn trường đó bằng bộ chọn biến của Botcake. Không gửi thông tin subscriber trong request.
4. Vào [Automation → Keywords](https://docs.pancake.biz/botcake/st-f3/st-p4/st-s5?lang=en), tạo từ khóa `omnichat-fb-test` với điều kiện **Content is** (khớp chính xác), gắn vào flow trên. Từ tài khoản Facebook thử nghiệm, gửi đúng từ khóa trong Messenger của Page. Bài thử chỉ đạt khi Messenger hiện câu trả lời có hotline. Tắt từ khóa thử sau khi kiểm tra.

Nếu **Test Request** có `reply` nhưng Messenger không phản hồi, kiểm tra block gửi tin đã lấy đúng Custom Field, từ khóa đã bật, đúng Page và quyền nhắn tin của Botcake. Nếu **Test Request** lỗi, kiểm tra URL, phương thức và JSON trước.

Nếu Botcake báo không tìm thấy Page nào đang quản lý, vào [hồ sơ Pancake](https://account.pancake.vn/profile) và chọn **Liên kết với tài khoản Facebook**. Nếu đang liên kết nhầm tài khoản hoặc cần cấp lại quyền cho Page, dùng **Đổi Facebook**. Chọn tài khoản có quyền quản lý đúng Page, sau đó đăng nhập lại Botcake. Xem [hướng dẫn xử lý của Botcake](https://docs.pancake.biz/botcake/st-f6/st-p5/st-s7?lang=en).

Nếu hồ sơ Pancake đã hiển thị Facebook nhưng Botcake vẫn báo chưa liên kết sau khi làm mới quyền, đăng xuất Botcake. Tại màn hình Pancake, chọn **Đăng nhập bằng tài khoản khác → Facebook** để mở bước cấp quyền Meta dành cho Botcake. Đối chiếu tên và ID Trang trong Facebook trước khi cấp quyền, rồi chỉ chọn Trang dùng cho bài thử nếu Meta cho chọn từng Trang.

Webhook `/api/webhook/botcake` hiện trả nội dung ở `data.botReply` trong JSON và không gọi API gửi Messenger. `GET` trả `ready`, nút ping, hoặc mô phỏng `POST` thành công không xác nhận Botcake đã nhận/gửi tin thật. Bài thử JSON API trên dùng kho câu hỏi mẫu của Simulator. Đồng bộ Inbox và tạo lead thật cần kiểm thử riêng sau khi có cấu hình lưu trữ và luồng nhận sự kiện thật.

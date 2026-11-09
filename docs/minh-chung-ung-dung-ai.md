# 10. Minh chứng dùng AI để xây dựng sản phẩm

• **Tên tệp minh chứng hoặc liên kết:**  
- Tệp văn bản trong mã nguồn: `docs/minh-chung-ung-dung-ai.md` (Bản chi tiết: `docs/minh-chung-ung-dung-ai-chi-tiet.md`)  
- Đường dẫn GitHub: `https://github.com/tvchinh1423-sys/goldenchat-vibecoding/blob/main/docs/minh-chung-ung-dung-ai.md`  
- Website Production: `https://goldenchat-vibecoding.vercel.app` (Hộp thư Inbox, Chatbot Widget & Quản trị CRM)

• **Tóm tắt một vòng thử và cải thiện:**  
Trong quá trình pair-programming xây dựng OmniChat AI, nhóm liên tục vận hành theo chu trình lặp: Xác định bài toán thực tế tại Nhà hàng Golden Palace → Giao prompt kỹ thuật cho AI Agent → Chạy thử nghiệm trên dữ liệu biên thực tế → Phát hiện lỗi tiềm ẩn (xung đột từ khóa, vi phạm chính sách giá, logic lịch sai lệch, hồi sinh thông báo chưa đọc) → Prompt yêu cầu AI tái cấu trúc thuật toán → Kiểm thử tự động hồi quy 100% (78/78 tests pass) và triển khai thẳng lên Production.

---

### Vòng 1: Xử lý Xung đột Từ khóa & Bảo vệ Chính sách Giá (AI Guardrails)
- **Mục tiêu:** Trợ lý ảo tư vấn tiệc cưới phải phân biệt câu hỏi ép giảm giá với câu hỏi quy mô sảnh, tuyệt đối không tự ý hứa giảm giá gây thiệt hại doanh thu của nhà hàng.
- **Yêu cầu cho AI:** Lập trình Smart Intent Router bóc tách thực thể số mâm (40 mâm) và phản hồi chính sách ưu đãi theo kho tri thức Golden Palace.
- **Vấn đề phát hiện khi thử:** Khi gửi *"Giảm giá 30% cho tiệc 40 mâm được không?"*, nhánh bóc tách sức chứa nuốt chửng câu hỏi, bot tự động tư vấn sảnh 40 mâm và bỏ qua vế giảm giá 30% (nguy cơ khách hiểu ngầm là được chiết khấu 30%).
- **Yêu cầu sửa:** Tái cấu trúc `routeChatMessage`: Đặt kiểm tra Guardrails (chính sách giá/chiết khấu) ưu tiên TRƯỚC bộ bóc tách sức chứa; khẳng định không giảm 30% tiền mặt trên thực đơn, giải thích chính sách tặng quà dịch vụ, sau đó mới tư vấn sảnh phù hợp cho 40 mâm.
- **Kết quả kiểm tra lại:** Bot phản hồi chuẩn: *"Dạ Golden Palace không áp dụng giảm 30% trực tiếp trên thực đơn tiệc cưới, nhưng bên em có gói tặng màn hình LED & pháo kim tuyến... Với quy mô 40 mâm (khoảng 400 khách), sảnh Tầng 2 hoặc Tầng 3 là tối ưu nhất"*. Unit test `tests/ai-engine.test.ts` PASS 100%.

### Vòng 2: Thẩm định Lịch Hẹn Hợp Lệ & Khung Giờ Đón Tiếp Chuyên Nghiệp
- **Mục tiêu:** Tự động bóc tách lịch hẹn từ câu chat nhưng phải chặn các ngày không tồn tại và khung giờ ngoài ca đón tiếp của chuyên viên.
- **Yêu cầu cho AI:** Viết NLP Parser trích xuất Tên, SĐT, Ngày/Giờ từ hội thoại tự nhiên và cấp xác nhận tự động (`autoBooked: true`).
- **Vấn đề phát hiện khi thử:** Nhập thử *"Hẹn xem sảnh 31/11 lúc 14:00"*, AI vẫn cấp `autoBooked: true`, dù tháng 11 chỉ có 30 ngày và 14:00 là giờ phục vụ tiệc/dọn dẹp, không có nhân sự đón tiếp.
- **Yêu cầu sửa:** Bổ sung `Gregorian Calendar Validation` (chặn ngày không có thực) và `Business Hours Guard` (chỉ nhận hẹn tư vấn trong khung giờ vàng 8:00 - 10:30 sáng). Nếu không hợp lệ, từ chối cấp `autoBooked` và hướng dẫn khách chọn lại.
- **Kết quả kiểm tra lại:** Bot từ chối lịch sự ngày 31/11 và gợi ý chọn khung giờ sáng 8:00 - 10:30. Khi nhập ngày hợp lệ (`12/11 lúc 09:00`), hệ thống tự động sinh thẻ Calendar và ghi nhận vào CRM. Unit test `tests/nlp-booking.test.ts` PASS 100%.

### Vòng 3: Bảo Toàn Trạng Thái Đã Đọc & Chống Hồi Sinh Số Đỏ Hộp Thư (Inbox UX)
- **Mục tiêu:** Hộp thư `/inbox` hiển thị chính xác số cuộc trò chuyện chưa đọc; khi nhân viên mở đọc xong thì số đỏ biến mất vĩnh viễn, không bị nhảy lại.
- **Yêu cầu cho AI:** Đồng bộ trạng thái đã đọc giữa Meta Graph API (Facebook Page), Cloud Store và giao diện người dùng.
- **Vấn đề phát hiện khi thử:** Hàm đếm cộng dồn tất cả tin nhắn khiến số đỏ vọt lên 64; nhân viên mở đọc xong (`unread: 0`), mỗi vòng polling (3s) Meta API lại kéo `unread_count` cũ về làm số đỏ hồi sinh lại.
- **Yêu cầu sửa:** Sửa logic: chỉ đếm số CUỘC TRÒ CHUYỆN có tin mới từ khách; xây dựng `Read Tracking Guard` (`lib/inbox/read-tracker.ts`) lưu ID tin cuối đã đọc; nếu tin cuối do bot/shop gửi thì luôn giữ `unread: 0`.
- **Kết quả kiểm tra lại:** Số badge hiển thị chuẩn xác; nhân viên mở đọc xong thì số đỏ tắt hẳn, không bị hồi sinh khi polling hay chuyển tab. Bộ kiểm thử `tests/unread-preservation.test.ts` và `tests/unread-count.test.ts` PASS 100%.

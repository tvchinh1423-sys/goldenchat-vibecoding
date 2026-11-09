# MINH CHỨNG AI VÀ KIỂM THỬ — OMNICHAT AI (VibeCoding 2026, Bảng B, Đề 04)

> Showcase: Trung tâm Tiệc cưới & Sự kiện Golden Palace Nam Định  
> Production: https://goldenchat-vibecoding.vercel.app  
> Tác giả: Trần Vân Chinh & Phạm Thị Thu Hiền  
> Deadline nộp: 23:59 ngày 09/11/2026

---

## PHẦN 1: MINH CHỨNG DÙNG AI ĐỂ XÂY DỰNG SẢN PHẨM (Tối đa 1 trang)

• **Tên tệp minh chứng:** `docs/minh-chung-ung-dung-ai.md` | GitHub: [tvchinh1423-sys/goldenchat-vibecoding](https://github.com/tvchinh1423-sys/goldenchat-vibecoding)  
• **Tóm tắt một vòng thử và cải thiện:** Pair-programming với AI Agent theo chu trình lặp: Xác định bài toán thực tế Golden Palace → Giao prompt kỹ thuật cho AI → Thử nghiệm dữ liệu biên thực tế → Phát hiện lỗi tiềm ẩn (xung đột từ khóa, vi phạm chính sách giá, logic lịch sai lệch, hồi sinh thông báo chưa đọc) → Prompt yêu cầu AI tái cấu trúc thuật toán → Kiểm thử tự động hồi quy 100% (78/78 tests pass) và triển khai thẳng lên Production.

### Vòng 1 – AI Guardrails bảo vệ chính sách giá niêm yết (Ảnh 1)
- **Mục tiêu:** Bot tư vấn tiệc cưới phải phân biệt câu hỏi ép giảm giá với câu hỏi quy mô sảnh, tuyệt đối không tự ý hứa giảm giá gây thiệt hại doanh thu của nhà hàng.
- **Yêu cầu cho AI:** Lập trình Smart Intent Router bóc tách thực thể số mâm (40 mâm) và phản hồi chính sách ưu đãi theo kho tri thức Golden Palace.
- **Vấn đề phát hiện khi thử:** Khi gửi *"Giảm giá 30% cho tiệc 40 mâm được không?"*, nhánh bóc tách sức chứa nuốt chửng câu hỏi, bot tự động tư vấn sảnh 40 mâm và bỏ qua vế giảm giá 30% (nguy cơ khách hiểu ngầm là được chiết khấu 30%).
- **Yêu cầu sửa:** Tái cấu trúc `routeChatMessage`: Đặt kiểm tra Guardrails (chính sách giá/chiết khấu) ưu tiên TRƯỚC bộ bóc tách sức chứa; khẳng định không giảm 30% tiền mặt trên thực đơn, giải thích chính sách tặng quà dịch vụ, sau đó mới tư vấn sảnh phù hợp cho 40 mâm.
- **Kết quả kiểm tra lại:** Bot phản hồi chuẩn: *"Dạ Golden Palace không áp dụng giảm 30% trực tiếp trên thực đơn tiệc cưới, nhưng bên em có gói tặng màn hình LED & pháo kim tuyến... Với quy mô 40 mâm (khoảng 400 khách), sảnh Tầng 2 hoặc Tầng 3 là tối ưu nhất"*. Unit test `tests/ai-engine.test.ts` PASS 100%. *(Minh chứng: `anh1-vong1-guardrails-chinh-sach-gia.png`)*

### Vòng 2 – Thẩm định ngày/giờ hẹn hợp lệ & Khung giờ đón tiếp (Ảnh 2, 3)
- **Mục tiêu:** Tự động bóc tách lịch hẹn từ câu chat nhưng phải chặn các ngày không tồn tại và khung giờ ngoài ca đón tiếp của chuyên viên.
- **Yêu cầu cho AI:** Viết NLP Parser trích xuất Tên, SĐT, Ngày/Giờ từ hội thoại tự nhiên và cấp xác nhận tự động (`autoBooked: true`).
- **Vấn đề phát hiện khi thử:** Nhập thử *"Hẹn xem sảnh 31/11 lúc 14:00"*, AI vẫn cấp `autoBooked: true`, dù tháng 11 chỉ có 30 ngày và 14:00 là giờ phục vụ tiệc/dọn dẹp, không có nhân sự đón tiếp.
- **Yêu cầu sửa:** Bổ sung `Gregorian Calendar Validation` (chặn ngày không có thực) và `Business Hours Guard` (chỉ nhận hẹn tư vấn trong khung giờ vàng 8:00 - 10:30 sáng). Nếu không hợp lệ, từ chối cấp `autoBooked` và hướng dẫn khách chọn lại.
- **Kết quả kiểm tra lại:** Bot từ chối lịch sự ngày 31/11 và gợi ý chọn khung giờ sáng 8:00 - 10:30 *(Ảnh 2)*. Khi khách nhập ngày hợp lệ (`12/11 lúc 09:00`), hệ thống tự động sinh thẻ Calendar và ghi nhận vào CRM *(Ảnh 3)*. Unit test `tests/nlp-booking.test.ts` PASS 100%.

### Vòng 3 – Bảo toàn trạng thái đã đọc & Chống hồi sinh số đỏ Inbox (Ảnh 4)
- **Mục tiêu:** Hộp thư `/inbox` hiển thị chính xác số cuộc trò chuyện chưa đọc; khi nhân viên mở đọc xong thì số đỏ biến mất vĩnh viễn, không bị nhảy lại.
- **Yêu cầu cho AI:** Đồng bộ trạng thái đã đọc giữa Meta Graph API (Facebook Page), Cloud Store và giao diện người dùng.
- **Vấn đề phát hiện khi thử:** Hàm đếm cộng dồn tất cả tin nhắn khiến số đỏ vọt lên 64; nhân viên mở đọc xong (`unread: 0`), mỗi vòng polling (3s) Meta API lại kéo `unread_count` cũ về làm số đỏ hồi sinh lại.
- **Yêu cầu sửa:** Sửa logic: chỉ đếm số CUỘC TRÒ CHUYỆN có tin mới từ khách; xây dựng `Read Tracking Guard` (`lib/inbox/read-tracker.ts`) lưu ID tin cuối đã đọc; nếu tin cuối do bot/shop gửi thì luôn giữ `unread: 0`.
- **Kết quả kiểm tra lại:** Số badge hiển thị chuẩn xác; nhân viên mở đọc xong thì số đỏ tắt hẳn, không bị hồi sinh khi polling hay chuyển tab *(Ảnh 4)*. Bộ kiểm thử `tests/unread-preservation.test.ts` và `tests/unread-count.test.ts` PASS 100%.

*(Ảnh 5: Kết quả kiểm thử tự động toàn diện 78/78 tests PASS 100%)*

---

## PHẦN 2: BẢNG KIỂM THỬ THỰC TẾ (Bảng B — Đáp ứng đúng 3 nhóm ca kiểm thử)

### Ca 1: Ca bình thường (Happy Path) — Đặt lịch xem sảnh hợp lệ từ hội thoại tự nhiên

| Mục kiểm thử | Chi tiết nội dung kiểm thử |
|---|---|
| **Chức năng** | Chatbot tự động bóc tách thông tin & đặt lịch xem sảnh tiệc |
| **Dữ liệu đầu vào (Input)** | Khách nhắn tin trên Web Widget: *"Tên Vân, số 0912345678, hẹn xem sảnh 12/11 lúc 09:00"* |
| **Thao tác thực hiện** | Gửi tin nhắn trên Chat Widget tại `https://goldenchat-vibecoding.vercel.app/widget` |
| **Kết quả kỳ vọng** | Bot nhận diện đủ Tên, SĐT, Ngày/Giờ hợp lệ; phản hồi thẻ Calendar xác nhận; hiện nút "Thêm vào Google Calendar"; tự động lưu Lead vào CRM (`/leads`) ở cột N3; phát chuông thông báo. |
| **Kết quả thực tế** | ✅ **ĐẠT (PASS)** — Bot phản hồi ngay thẻ Calendar đầy đủ 5 trường: Khách hàng Vân (0912345678), Thời gian 09:00 12/11/26, Nội dung Xem sảnh (2 người), Địa điểm 98 Đông A. Nút Google Calendar mở tạo sự kiện chính xác. Toast "Lịch hẹn mới từ Web" hiện trên màn hình quản trị Inbox. *(Minh chứng: Ảnh 3 `anh3-vong2-lich-hen-hop-le.png`)* |

### Ca 2: Ca nhập sai / thiếu (Negative Testing) — Chặn ngày không tồn tại 31/11 & thiếu SĐT

| Mục kiểm thử | Chi tiết nội dung kiểm thử |
|---|---|
| **Chức năng** | Thẩm định tính hợp lệ của ngày hẹn (Gregorian Validation) và xử lý dữ liệu thiếu |
| **Dữ liệu đầu vào (Input)** | Khách nhắn: *"Hẹn xem sảnh 31/11 lúc 14:00 được không?"* (Ngày không tồn tại trong lịch thực tế + chưa có SĐT) |
| **Thao tác thực hiện** | Gửi tin nhắn trên Chat Widget |
| **Kết quả kỳ vọng** | Bot phát hiện ngày không tồn tại (tháng 11 chỉ có 30 ngày), từ chối lịch sự, không cấp thẻ xác nhận `autoBooked: true`, không phát chuông thành công, hiển thị chip gợi ý ngày giờ hợp lệ. |
| **Kết quả thực tế** | ✅ **ĐẠT (PASS)** — Bot trả lời: *"Dạ Tháng 11 chỉ có 30 ngày (không có ngày 31/11). Quý khách vui lòng chọn lại ngày hẹn phù hợp (ví dụ ngày mai hoặc cuối tuần) để em hỗ trợ xếp lịch đón tiếp chu đáo nhất nhé ạ!"*. Thẻ trạng thái hiển thị "Chờ SĐT", không tạo lịch ảo trên CRM. Kèm 2 chip nhanh "Sáng mai lúc 9h" và "Cuối tuần này lúc 9h30". *(Minh chứng: Ảnh 2 `anh2-vong2-chan-ngay-phi-ly-31-11.png`)* |

### Ca 3: Ca kiểm thử biên (Boundary Testing) — Guardrails chặn giảm giá 30% kết hợp câu hỏi quy mô 40 mâm

| Mục kiểm thử | Chi tiết nội dung kiểm thử |
|---|---|
| **Chức năng** | AI Guardrails bảo vệ biên chính sách giá & Phân luồng câu hỏi phức hợp (Smart Intent Router) |
| **Dữ liệu đầu vào (Input)** | Khách nhắn: *"Giảm giá 30% cho tiệc 40 mâm được không?"* (Câu hỏi phức hợp: ép giảm giá vượt biên quy định 20% + hỏi quy mô 40 mâm) |
| **Thao tác thực hiện** | Gửi tin nhắn trên Chat Widget |
| **Kết quả kỳ vọng** | Bot bắt buộc xử lý biên an toàn: Từ chối giảm 30% tiền mặt trên thực đơn (chống thất thoát doanh thu), giải thích chính sách ưu đãi hiện hành của Golden Palace (tặng gói dịch vụ), sau đó tư vấn sảnh phù hợp cho 40 mâm (400 khách). |
| **Kết quả thực tế** | ✅ **ĐẠT (PASS)** — Bot phản hồi chính xác 100%: *"Dạ Trung tâm Tiệc cưới & Sự kiện Golden Palace xin phép làm rõ ạ: Nhà hàng áp dụng các gói ưu đãi theo chính sách hiện hành của trung tâm và không có chính sách chiết khấu tiền mặt 30% trên thực đơn. Với quy mô 40 mâm (khoảng 400 khách), nhà hàng có chính sách tặng trọn gói dịch vụ... và sảnh tiệc Tầng 3 hoặc Tầng 2 rất phù hợp..."*. Kèm 3 gợi ý và Hotline 0228 6595 959. *(Minh chứng: Ảnh 1 `anh1-vong1-guardrails-chinh-sach-gia.png`)* |

### Ca 4 (Ca mở rộng): Kiểm thử bảo mật & Phân quyền RBAC 3 cấp (Admin / Manager / Staff)

| Mục kiểm thử | Chi tiết nội dung kiểm thử |
|---|---|
| **Chức năng** | Kiểm soát quyền truy cập theo vai trò (Role-Based Access Control) |
| **Dữ liệu đầu vào (Input)** | Đăng nhập tài khoản `staff` / `staff123` rồi truy cập URL `/settings` hoặc `/users` |
| **Thao tác thực hiện** | Đăng nhập từ trang `/login` với vai trò Staff |
| **Kết quả kỳ vọng** | Staff chỉ thấy các tính năng tác nghiệp trực chat (Hộp thư, Trợ lý Bot, Khách hàng, Báo cáo). Ẩn hoàn toàn menu Cài đặt và Nhân sự. Chặn truy cập URL quản trị. |
| **Kết quả thực tế** | ✅ **ĐẠT (PASS)** — Giao diện Staff ẩn hoàn toàn menu Cài đặt và Nhân sự. Cố tình nhập URL `/settings` bị redirect về Dashboard kèm cảnh báo phân quyền. Unit test `tests/rbac-assignment.test.ts` PASS 100%. |

---

**Bảo chứng chất lượng kiểm thử tự động:**  
- **Unit & Logic Tests:** **78/78 tests PASS 100%**  
- **Playwright Browser E2E Tests:** **7/7 test suites PASS 100%**  
- **Next.js Production Build:** **21/21 static pages thành công 100%** (Exit code 0)  
*(Minh chứng: Ảnh 5 `anh5-ket-qua-78-78-tests-pass.png`)*

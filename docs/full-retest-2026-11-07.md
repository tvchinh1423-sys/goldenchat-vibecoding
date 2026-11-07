# Kiểm thử lại toàn hệ thống OmniChat AI — 07/11/2026

Đối chiếu mã `e33d8bd` trên `origin/main` và URL production `https://goldenchat-vibecoding.vercel.app`. Đợt kiểm tra bắt đầu khoảng 21:50 giờ Việt Nam. Đây là báo cáo nghiệm thu, không phải mốc sửa lỗi. Những kết luận “100%” trong nhật ký cũ không thay thế kết quả dưới đây.

## Kết luận tiến độ

Sản phẩm đã có đủ màn hình và nhiều tính năng để trình diễn: FAQ Golden Palace, chat, gợi ý, đặt lịch, Calendar, CRM/Kanban, báo cáo, huấn luyện, cấu hình, nhân sự và PWA. Tuy nhiên **chưa đạt nghiệm thu toàn hệ thống và chưa sẵn sàng xử lý dữ liệu khách thật**. Các điểm chặn là quyền truy cập, tính bền vững của dữ liệu, xóa/đồng bộ và xác nhận lịch sai ngày/giờ. Không quy đổi số màn hình hay số unit test đạt thành phần trăm hoàn thành sản phẩm.

## Phương pháp và kết quả

- Fetch GitHub và xác nhận nhánh làm việc đã ở main mới nhất trước khi thử. Giữ nguyên schema bàn giao và các file thiết lập local người dùng đang làm.
- `npm test`: **59/59 đạt**, gồm AI, Inbox, CRM, migration SQL bằng PGlite, NLP, RBAC, webhook, cloud sync, âm thanh và badge. Đây là kiểm tra mã/fixture, không chứng minh các dịch vụ bên ngoài đã nối thật.
- `npm run build`: thành công, **20/20 trang tĩnh**, TypeScript và lint không có lỗi chặn; còn 6 cảnh báo `<img>` tại Widget.
- Toàn bộ bộ Playwright Chromium chạy trên production build mới ở cổng 3100: **18/29 đạt, 11 không đạt, không skip/retry**, thời gian khoảng 4 phút 57 giây. WebKit chạy riêng 5 ca mobile-layout/widget-mobile: **5/5 đạt**. Không sửa test để làm xanh trong đợt rà soát.
- Production: 9 trang `/inbox`, `/training`, `/leads`, `/dashboard`, `/settings`, `/users`, `/login`, `/widget`, `/download` và 4 tài nguyên embed/manifest/service worker/Excel đều HTTP 200; `/` trả chuyển hướng 307. HTTP 200 chỉ xác nhận truy cập được, không phải nghiệm thu chức năng.
- Đọc API production không kèm cookie: CRM trả `mode: demo`; AI draft trả `mode: demo`, `contextSource: demo`; webhook trả `ready`. API sync trả HTTP 200 và snapshot có lead, lịch, hội thoại. Không chép nội dung hồ sơ vào báo cáo.
- Trình duyệt production dùng context riêng, đặt `navigator.webdriver=false` để kiểm tra đường đi người dùng thông thường; chặn POST sync để tránh thay đổi kho chung. Thử API chat bằng câu hỏi và liên hệ tổng hợp, không gọi lưu lịch production.

## Ma trận chức năng

| Nhóm | Kết quả quan sát | Trạng thái nghiệm thu |
| --- | --- | --- |
| FAQ/Simulator | Hotline đúng 0228 659 5959; cọc đúng 5.000.000 VNĐ; 300 khách gợi ý Tầng 3 và Tầng 4; phản hồi có 3 gợi ý. | Đạt các ca cơ bản; còn lỗi định tuyến. |
| Guardrail/chuyển người | Câu ngoài phạm vi trả handoff và tắt AI. Câu giảm 30% kèm 40 mâm chỉ nhận tư vấn sảnh; câu hỏi giờ mở cửa lại bị chuyển người. | Chưa đạt đủ tình huống nghiệp vụ. |
| Đặt lịch NLP | Hỏi thêm khi thiếu dữ liệu; unit test tên/SĐT/emoji/đa lượt đạt. Production vẫn trả `autoBooked: true` và “Đã xác nhận” cho 31/11/2026, hoặc 14:00 ngoài khung 08:00–10:30. | Chưa đạt; không được coi phản hồi Simulator là bằng chứng đã lưu. |
| Form/Calendar | Ca Widget đã tạo được thẻ và URL Calendar 09:15–09:45, đúng thời lượng 30 phút; bài test cũ đòi 60 phút nên fail tại bước so URL. | Đạt phần tạo/Calendar quan sát được; toàn luồng xóa/tải lại chưa đạt. |
| CRM và cloud sync | Unit test CRUD, 2 lịch đồng thời/người đạt. Merge snapshot rỗng không loại bản ghi đã xóa. `loadCRM()` ưu tiên cloud store và trả `demo` ngay, trước đường Supabase. | Chưa đạt đồng bộ bền vững và xóa xuyên thiết bị. |
| Inbox | Có giao diện, thao tác chat, phân công, ảnh/reaction/ghim và kết nối Widget. Chưa đăng nhập vẫn mở được danh sách và composer trên production. | Cần xử lý quyền truy cập và hồi quy trình duyệt. |
| Huấn luyện/Excel | Parse file mẫu ra 26 FAQ, `savedToDatabase: false` khi không có DB; thiếu file trả 400. | Parse đạt; lưu cloud chưa xác minh. |
| Google Sheets | Mock CSV tiêu đề tiếng Anh nạp được 1 dòng; CSV UTF-8 tiêu đề tiếng Việt không BOM trong ca mô phỏng bị trả 400. Không gọi sheet thật. | Cần kiểm tra encoding và nguồn thật. |
| Lưu cấu hình | Trong môi trường không có Supabase, POST vẫn trả 200 `success: true`. | Chưa phản ánh đúng kết quả lưu bền vững. |
| AI draft | Trả lời cọc đúng, 3 gợi ý, kiểm tra dữ liệu sai trả 400. Production đang dùng FAQ demo. Ca browser bổ sung: soạn tay rồi cho API draft trả 503 bằng mock, nội dung soạn tay bị thay bằng FAQ. | Đạt phản hồi cơ bản; còn lỗi ghi đè bản nháp; chưa xác minh Gemini/9Router thật. |
| Báo cáo | Có số liệu Inbox/CRM; chỉ số AI 82% vẫn cố định khi có hội thoại nhưng nhãn đã bỏ chữ minh họa. Phễu 50→20→8 còn ghi minh họa. | Cần minh bạch chỉ số AI. |
| Nhân sự/phân quyền | Unit test ranh giới vai trò và CRUD đạt; giao diện chặn staff vào Settings/Users. CRM tự đặt phiên nhân viên khi chưa đăng nhập. Auth còn nhánh tự gán admin theo webdriver và mật khẩu fallback dùng chung. | Chưa đạt xác thực/phân quyền thực tế. |
| Facebook Messenger | Lượt trước đã nhận đúng hotline và cọc qua flow FAQ động, chờ 12 giây. Lượt này gọi lại API trả đúng; không gửi lại Messenger. | Có bằng chứng E2E trước đó; chưa nghiệm thu Facebook→Inbox/CRM. |
| Zalo/Telegram | Webhook parser có unit test; Telegram mock trả thành công, không gửi thông báo thật. | Chưa xác minh đầu-cuối trên tài khoản thật. |
| PWA/mobile/âm thanh | Build/assets và unit test âm thanh đạt; kết quả browser ghi riêng bên dưới. | Chưa thử máy iPhone/Android thật, cài PWA thật hoặc nghe loa thật. |

### Chi tiết bộ trình duyệt

| File test Chromium | Đạt / tổng | Phần không đạt hoặc đã chứng minh |
| --- | --- | --- |
| chat-booking | 0/2 | Không tìm thấy chip trong fixture Inbox; ca Widget dừng tại kỳ vọng Calendar 60 phút đã lỗi thời (thực tế đúng 30 phút). |
| chat-viewport | 1/2 | Bản nhúng đạt; Inbox mô phỏng bàn phím có biên dưới control 330,5 px so với 330 px. Ảnh lỗi cho thấy vùng soạn tin rất chật; cần kiểm tra nút gửi sau chỉnh layout. |
| crm | 1/5 | Ba ca dừng vì không có nút “Tạo khách mới” trên hội thoại hiện tại; một ca không thấy cảnh báo snapshot hỏng do loadCRM đọc cloud trước. Ca xử lý storage/DB lỗi đạt. |
| dashboard | 0/1 | Kỳ vọng 8 hội thoại, nhận 9; dữ liệu cloud dùng chung ảnh hưởng fixture. Đây không đủ căn cứ kết luận phép đếm dashboard sai. |
| inbox | 2/5 | Draft 503 không hiện lỗi theo kỳ vọng; filter thiếu hội thoại đích; mobile không thấy nút tạo khách. Desktop gửi/ghi chú/lưu lead và các kích thước không tràn ngang đạt. |
| leads | 2/2 | Đổi giai đoạn, tìm kiếm, lưu trạng thái, kéo thả và cuộn Kanban. |
| meta-chat | 1/1 | Like, reactions, ghim, lightbox và gửi tin trong demo. |
| mobile-layout | 3/3 | Điều hướng, safe area, form khi viewport nhỏ và Widget xoay ngang. |
| notifications | 1/1 | Chuông, số chưa đọc, dropdown và toggle âm thanh. |
| pwa-mobile | 4/4 | Manifest/icons, meta/safe area, FAB/call và tab PWA. |
| widget-meta-ux | 1/1 | Chat rich media, reaction, đính kèm và xem trước ảnh. |
| widget-mobile | 2/2 | Form/composer khi giả lập bàn phím và launcher xoay ngang. |

11 ca không đạt là **kết quả của bộ test hiện hữu**, không đồng nghĩa có 11 lỗi sản phẩm độc lập. Có thay đổi nghiệp vụ đúng nhưng test chưa theo kịp, dữ liệu test chưa cách ly, và lỗi thực tế cần sửa. Ngược lại, 59 unit test đạt vẫn bỏ lọt các ca mất dữ liệu/đăng nhập/ngày sai đã tái hiện riêng. Không dùng nhánh tự cấp admin hoặc bỏ cleanup theo webdriver làm bằng chứng nghiệm thu bảo mật.

## Lỗi cần ưu tiên

| Ưu tiên | Bằng chứng tái hiện | Điều kiện đóng lỗi |
| --- | --- | --- |
| **P0 — Truy cập dữ liệu và phiên** | GET `/api/sync/store` không đăng nhập trả toàn snapshot. `/inbox` vẫn hiện hội thoại/composer; đi sang `/leads` rồi trang khác tự có phiên Ngọc Khánh. `components/crm/crm-dashboard.tsx` ghi staff auth khi chưa có cờ; `lib/auth/auth-context.tsx` có fallback admin cho webdriver. POST sync trong mã không kiểm tra quyền, chưa thử ghi trái phép production. | Phiên do máy chủ xác thực; API và từng vai trò được kiểm tra phía máy chủ; bỏ bypass thử nghiệm và mật khẩu chung; người chưa đăng nhập không đọc/ghi dữ liệu quản trị. Widget chỉ có quyền phù hợp với phiên khách. |
| **P0 — Mất dữ liệu khi dọn mẫu** | Ca riêng với kho chứa ID mẫu `chanh` và một hội thoại/lead/lịch mới: gọi `autoCleanupIfDemo()` với webdriver=false làm mất cả ba bản ghi mới. Test browser thông thường không bắt vì mã bỏ qua cleanup khi webdriver=true. | Chuyển mọi trang/reload vẫn giữ dữ liệu mới; migration chỉ loại đúng fixture, không thay toàn kho. |
| **P0 — Xóa không đồng bộ và kho tạm** | Với store tổng hợp có 1 lead + 1 lịch, gửi snapshot cả hai mảng rỗng thì cả hai vẫn còn. Merge chỉ thêm/cập nhật; dữ liệu nằm ở global process + `/tmp`. | Có thao tác xóa/tombstone và kho bền vững; lịch đã xóa không sống lại sau polling/reload; kiểm tra hai phiên riêng và xung đột ghi. |
| **P1 — Xác nhận lịch sai** | Production trả “Đã xác nhận” với ngày 31/11 và giờ 14:00. | Kiểm tra ngày thật, tương lai và giờ nghiệp vụ trước xác nhận; chỉ nói đã nhận sau khi lưu thành công, phân biệt lịch chờ với lịch đã xác nhận. |
| **P1 — FAQ và chính sách** | Giảm 30% + 40 mâm bị nhánh sức chứa lấy trước; hỏi giờ mở cửa bị handoff. | Chính sách giá được ưu tiên, dữ kiện giờ thống nhất, câu ngoài phạm vi có đường đặt lịch phù hợp. |
| **P1 — Lưu thành công giả và chỉ số** | Không có DB vẫn báo lưu config thành công; AI 82% là hằng số nhưng hiện như số thực. | Phản hồi đúng nơi lưu/lỗi lưu; chỉ số đo được hoặc ghi rõ minh họa. |
| **P1 — Ghi đè bản nháp nhân viên** | Trên UI production, chặn sync và mock draft 503: nội dung nhân viên đã gõ bị thay bằng FAQ 150 ký tự. Không gửi tin nhắn ra ngoài. | Khi lỗi hoặc phản hồi đến muộn, giữ nội dung nhân viên; chỉ áp dụng gợi ý khi bản nháp chưa thay đổi hoặc người dùng chủ động chọn. |
| **P1 — Bộ kiểm thử chưa theo sản phẩm** | Calendar còn kỳ vọng 60 phút; fixture và mock CRM chưa bao phủ sync mới; ứng dụng thay hành vi theo webdriver. | Test có dữ liệu riêng, mock đúng biên dịch vụ, bỏ bypass trong sản phẩm; kỳ vọng theo 30 phút và hai lịch/người; test thật cả đường không webdriver. |

## Phân công đề xuất cho mốc tiếp theo

1. **Hiền + agent:** ưu tiên quyền API/phiên và bảo toàn dữ liệu; sửa xóa/đồng bộ, rồi nghiệm thu Widget → Inbox → CRM → reload → xóa → reload. Nếu chưa kịp làm cloud bền vững, chốt demo cục bộ minh bạch để quay thay vì tuyên bố đa thiết bị đã hoàn tất.
2. **Chinh:** chốt một bảng giờ hẹn theo loại, FAQ/chính sách giá và nội dung phản hồi; kiểm tra lại Botcake bằng hai câu liên tiếp, rồi kiểm tra riêng việc ghi Inbox/CRM. Xác minh Zalo/Telegram nếu đưa vào video.
3. **Hiền + agent:** sửa xác nhận NLP và kiểm thử lịch sai/trùng; cập nhật test 30 phút, fixture cloud và lỗi giao diện thực tế, giữ kiểm tra dữ liệu mới không mất khi chuyển trang.
4. **Chinh:** cập nhật README và video theo đúng phần đã chứng minh; chốt video, source ZIP, bằng chứng AI và truy cập hồ sơ. Trong repo mới thấy kịch bản video và ZIP bàn giao, chưa thấy video hoàn chỉnh; không suy ra chưa tồn tại ở nơi khác.

Không thêm chức năng mới trước khi các lỗi P0 được đóng. Mốc test lại là sau bản sửa; cần báo riêng test đạt, test không đạt, kênh đã xác minh và phần còn mô phỏng.

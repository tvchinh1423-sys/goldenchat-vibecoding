# Kế hoạch chốt bài thi OmniChat AI — Đề 04, Bảng B

Rà soát lần hai ngày 07/11/2026, giờ Việt Nam. Phạm vi là showcase Golden Palace và hồ sơ vòng loại. Phân công, mốc nội bộ và ước lượng bên dưới là đề xuất để Chinh và Hiền thống nhất. Cổng BTC đóng lúc **23:59 ngày 09/11/2026 (UTC+7)**. [Hướng dẫn BTC](https://vibecoding.info.vn/bai-viet/yeu-cau-dau-ra-va-huong-dan-nop-bai-vibe-coding-2026)

## Nên cạnh tranh bằng trải nghiệm nào?

Một khách hỏi sảnh cho 300 người, nhận hai lựa chọn cụ thể, hỏi ngày tổ chức có trống và được mời đặt lịch tư vấn. Nhân viên thấy yêu cầu trong CRM của cùng trình duyệt, biết khách muốn gì và xử lý lịch. Tình huống này thể hiện cả giá trị cho khách lẫn công việc lễ tân. Dùng so sánh hai sảnh và thẻ yêu cầu lịch đã có để minh họa. Nếu nghiệm thu được đồng bộ Widget → Inbox trong cùng trình duyệt, dùng nó làm minh chứng nhân viên nhìn thấy nhu cầu của khách. Chỉ gọi là lịch tư vấn **đã được ghi nhận, chờ xác nhận**. Tình trạng trống sảnh, việc giữ chỗ và lời hẹn nhân viên gọi lại đều cần xác minh riêng.

Bảng B chấm 30 điểm chức năng, 20 điểm quá trình dùng AI, 15 điểm giá trị sử dụng và 15 điểm độ đúng nghiệp vụ. Vì vậy, tập trung vào một luồng hoàn chỉnh và chứng cứ trước/sau của 2–3 lỗi thật. [Tiêu chí Bảng B](https://vibecoding.info.vn/tieu-chi-cham-thi)

## Kết quả đối chiếu lại

Đối chiếu `origin/main` từ **602f84b** đến **a8190f1**. Vercel báo triển khai thành công cho a8190f1. Production trả HTTP 200 cho Widget và CRM, API CRM báo `demo`, webhook báo `ready`. Chrome mobile mô phỏng 390 px mở được Widget và thấy cổng đăng nhập ở CRM. Kết quả kiểm thử toàn bộ ở báo cáo lượt trước thuộc commit cũ. Các commit mới bổ sung âm báo, dọn dữ liệu, lối về quản trị và đồng bộ Widget → Inbox bằng localStorage. Cần nghiệm thu lại bằng phiên mới và đối chiếu lịch do chính phiên đó tạo. Có dữ liệu mẫu được chèn vào Inbox/CRM khi dọn, cần phân biệt với lịch vừa tạo.

| Mức | Bằng chứng | Ảnh hưởng |
| --- | --- | --- |
| P0 | Trong trình duyệt sạch, mình đặt snapshot cục bộ có một bản ghi mẫu và một lịch tổng hợp. Mở Inbox làm lịch tổng hợp biến mất và kho được thay bằng dữ liệu khác. Mã mới gọi dọn tự động khi mở Inbox, CRM hoặc Báo cáo nếu gặp ID mẫu. | Một lịch do giám khảo tạo có thể mất khi chuyển trang hoặc tải lại. Cờ “vận hành thật” trên trình duyệt không đổi chế độ CRM phía máy chủ. |
| P0 | API Simulator trả `autoBooked: true` cho ngày **31/11 lúc 09:00** và cho lịch thử món **20:00**. CRM có kiểm tra ngày hợp lệ ở bước ghi. Luồng NLP trên Widget vẫn có câu hứa lễ tân gọi lại trong chế độ demo. | Chat có thể phát tín hiệu xác nhận trước khi ghi. Khung giờ hợp lệ cho từng loại lịch cần Chinh duyệt. |
| P0 | Câu “Giảm giá 30% cho tiệc 40 mâm được không?” nhận gợi ý sảnh 400 khách. Câu hỏi địa chỉ trả 08:00–21:00, luồng đặt lịch ghi 08:00–10:30. “Đặt lịch tư vấn” mặc định thành xem sảnh. | Sai trọng tâm câu hỏi và dễ gây hiểu nhầm về giờ hoặc loại lịch. |
| P0 | Câu hỏi ngoài phạm vi chỉ chuyển giao, câu “Cảm ơn em” cũng bật chuyển giao. Widget chưa có nhãn mô phỏng rõ ở màn hình đầu. README ghi 100%, <300 ms và Telegram trong kịch bản dù chưa có căn cứ kiểm tra tương ứng. | Thiếu lời mời đặt lịch ngay trong phản hồi theo Đề 04. Giám khảo dễ hiểu nhầm chế độ chạy và gặp cổng CRM chưa có hướng dẫn đủ rõ. |
| P0 | Repo có README và kịch bản video, ZIP bàn giao chỉ chứa thư mục handoff. Chưa tìm thấy video hoàn chỉnh, minh chứng AI và bộ hồ sơ vòng loại trong repo. | Cần kiểm tra tài liệu Chinh đang giữ ngoài repo và trạng thái xác thực trên cổng thi. |

Các thử nghiệm trên dùng câu hỏi cố định và dữ liệu tổng hợp trong hồ sơ trình duyệt dùng riêng. Không có bài thử ghi khách thật. Xem [báo cáo lượt trước](project-audit-2026-11-07.md) để đối chiếu phạm vi các kênh.

## Thực thi và bàn giao

Ước lượng là giờ làm tập trung, có thể chia hai luồng song song. Chốt đầu vào nghiệp vụ trước khi khóa câu trả lời và quay video.

| Mã · Ưu tiên | Người đề xuất | Việc và điều kiện bàn giao | Ước lượng |
| --- | --- | --- | --- |
| A · P0 | **Hiền** | Chặn dọn tự động khi mở trang. Nếu giữ nút xóa/khôi phục mẫu, ghi rõ phạm vi dữ liệu trình duyệt và bảo toàn bản ghi do người dùng tạo. Xác nhận lịch vừa tạo vẫn còn khi đi Widget → CRM → Inbox/Báo cáo → tải lại, kể cả khi kho có fixture. Dùng hồ sơ sạch cho buổi quay. | 1–2 giờ |
| B · P0 | **Chinh** | Duyệt giờ mở cửa và giờ hẹn theo loại, quy tắc giá/cọc, sức chứa và 8–10 FAQ. Chốt câu trả lời khi xin chiết khấu, hỏi ngày trống và nhờ giữ sảnh. Sửa kho tri thức và bộ định tuyến nội dung. Hai ca bắt buộc là câu giảm 30% kèm 40 mâm và câu hỏi địa chỉ/giờ hẹn. Dùng chung bảng dữ kiện cho FAQ, form và README. | 2–3 giờ |
| C · P0 | **Hiền**, nhận giờ và nội dung từ B | Thêm lời mời cùng nút “Đặt lịch tư vấn” ngay dưới tin ngoài phạm vi, giữ đúng loại lịch. Bỏ chuyển giao ở câu xã giao đơn giản. Dùng kiểm tra ngày, giờ Việt Nam, loại lịch và dữ liệu bắt buộc trước khi lưu. Chỉ hiện thẻ/âm báo/Calendar sau khi ghi thành công. Hỏi lại khi thiếu hoặc sai, giữ thông tin khách đã cung cấp hợp lệ. Gắn nhãn mô phỏng từ màn hình đầu. | 2–4 giờ |
| D · P0 | **Chinh** | Soạn README cho giám khảo: đường vào Widget và CRM cùng trình duyệt, cách vào phiên demo đã được duyệt, 8–10 FAQ, hướng dẫn chạy, nguồn và giới hạn. Cập nhật video để đủ năm tính năng. Kiểm tra xác thực đội trên cổng sớm. Thu thập minh chứng AI thật từ các lượt yêu cầu, kiểm tra và sửa đã thực hiện, tối đa một trang và 5 hình/đoạn trích. | 2–3 giờ chuẩn bị |
| E · P0 | **Hiền kiểm thử**, **Chinh nghiệm thu và nộp** | Push từng mốc hoàn tất lên `origin/main`, kiểm tra Vercel theo SHA và luồng trực tiếp với dữ liệu tổng hợp. Ghi ngày, SHA, trình duyệt, đầu vào, kỳ vọng và kết quả. Quay sau khi A–C qua cổng nghiệm thu. Xuất ZIP từ đúng source, mở thử các link bằng phiên độc lập và lưu xác nhận nộp. | 2–3 giờ, gồm lượt quay |

Chinh và Hiền thống nhất trước vùng sửa chung trong Simulator và Widget. Chinh chốt dữ kiện và phản hồi giá/giờ trước, Hiền nhận phần giao diện, xác thực lịch và xác nhận. Cập nhật branch từ main trước mỗi mốc để tránh hai người sửa cùng nhánh điều kiện. Chốt giờ ngay khi có thể. Nếu giờ thật còn chờ xác minh, bỏ lời khẳng định cụ thể khỏi lời chat và ghi rõ giờ demo trong luồng đặt lịch.

### Mốc nội bộ đề xuất (UTC+7)

- **07/11, đến 13:00:** Chinh chốt dữ kiện, kiểm tra hồ sơ đội và bắt đầu README/video. Hiền làm A, song song chuẩn bị C. Cả hai lưu bằng chứng tái hiện lỗi trước khi sửa.
- **07/11, đến 19:00:** Hoàn tất A–C theo từng mốc trên main. Lượt nghiệm thu đầu đi từ FAQ đến lịch hiển thị và xóa được ở CRM. Nếu tự đặt lịch bằng NLP còn lỗi, dùng form có xác nhận để giữ luồng bắt buộc.
- **08/11, trước 12:00:** Kiểm tra lại từ trình duyệt sạch và trên điện thoại có sẵn. Chốt SHA, README và kết quả kiểm thử. Kể từ mốc này chỉ xử lý lỗi chặn nộp.
- **08/11, trước 18:00:** Chinh chốt video dưới 2 phút, Source ZIP, minh chứng AI và bảng kiểm thử. Kiểm tra quyền truy cập, nộp sớm và xác nhận thời gian nộp gần nhất.
- **09/11:** Dự phòng quay lại, sửa link hoặc triển khai lại bản đã chốt nếu cần. Nếu nộp phiên bản mới trước hạn, cập nhật đồng bộ SHA, ZIP, video khi hành vi thay đổi và bằng chứng. Sau hạn giữ bản nộp.

### Cổng nghiệm thu trước khi quay

| Ca | Đầu vào và điều kiện đạt |
| --- | --- |
| Bình thường | Hỏi 300 khách → đúng hai sảnh và 3 gợi ý liên quan. Thử ít nhất một gợi ý. Tạo lịch với dữ liệu tổng hợp → có trạng thái chờ xác nhận, xuất hiện trong CRM cùng trình duyệt, tồn tại sau tải lại, xóa được và không xuất hiện lại. |
| Nhập thiếu/sai | Tên hoặc số liên hệ trống/sai, ngày 31/11 và giờ quá khứ hoặc ngoài khung đã chốt → có hướng dẫn sửa, không phát âm báo thành công, không sinh lịch hoặc link Calendar. |
| Biên | Hỏi ngày còn sảnh và xin giữ chỗ → trả lời theo phạm vi tri thức, mời đặt lịch tư vấn ngay. Thử lịch trùng cùng người tiếp đón → báo xung đột rõ và giữ lịch cũ. |
| Hồi quy | Kho CRM có fixture và lịch mới → mở Inbox, Báo cáo, CRM và tải lại vẫn giữ lịch mới. Nếu trình diễn đồng bộ, đối chiếu nội dung chat và thẻ hẹn trong Inbox với đúng lịch vừa tạo, tách rõ hội thoại mẫu. Câu xin giảm 30% kèm 40 mâm xử lý chính sách giá trước. “Cảm ơn em” không ngắt bot. |
| Bàn giao | Người chưa dùng app mở link trên mobile, tìm được Widget và vào được màn quản trị demo theo README. Mở video/ZIP bằng phiên độc lập. ZIP và README cùng SHA chốt, chỉ có cấu hình mẫu, không chứa khóa, mật khẩu thật hoặc hồ sơ khách. |

Kịch bản quay đề xuất **1:45–1:55**. 0:00–0:12 nêu vấn đề lễ tân ngoài giờ. 0:12–0:40 hỏi 300 khách và bấm gợi ý. 0:40–1:05 hỏi ngày trống, bot mời đặt lịch với tư vấn viên. 1:05–1:28 điền form và thấy yêu cầu chờ xác nhận. 1:28–1:52 mở quản trị cùng trình duyệt, xem rồi xóa lịch. Chuẩn bị một ca tái hiện AI trước/sau để trả lời hỏi đáp.

## Tự phản biện và giới hạn phạm vi

| Nếu làm theo hướng này | Kế hoạch đã điều chỉnh |
| --- | --- |
| Nhiều tính năng phụ có thể làm demo trông lớn hơn. | Chuông, Calendar, hai lựa chọn sảnh và Kanban đã có. Chọn hai chi tiết hỗ trợ câu chuyện chính. Dành thời lượng video cho năm chức năng theo đề. |
| Tự chốt lịch từ một câu nghe ấn tượng. | Sai một ngày hay giờ làm hỏng luồng. Dùng form làm đường chính khi quay. Chỉ đưa NLP vào nếu qua ca sai ngày, sai giờ và không tạo bản ghi trùng. |
| Có thể tăng độ thật bằng Messenger, Zalo, Supabase và AI provider. | Quyền Page đang vướng và cloud cần xác thực phía máy chủ. Để sau khi khóa hồ sơ. Nếu kênh thật tình cờ sẵn sàng, ghi bằng chứng riêng sau khi thử nhận/gửi hai chiều. Luồng dự thi vẫn chạy độc lập với tích hợp này. |
| Có thể tạo thêm Dashboard chỉ số ROI để gây ấn tượng. | Chưa có số liệu vận hành. Dùng một ví dụ cụ thể và kết quả thao tác đo được trong buổi diễn tập, chẳng hạn số lần nhập lại. Bỏ các con số hiệu quả chưa đo. |
| Có thể cải tiến thêm sau khi mọi việc P0 đã qua. | Chọn tối đa một nâng cấp dưới 60 phút nếu còn dư giờ trước khi khóa SHA. Ưu tiên giữ loại nhu cầu đã nhận diện khi mở form hoặc gắn nguồn FAQ cho câu tư vấn 300 khách/cọc. Chỉ chọn nếu kiểm tra được và không làm chậm việc quay/nộp. |

# Rà soát OmniChat AI — 07/11/2026

**Kết luận:** Đã có bản demo Golden Palace chạy công khai. Đối chiếu [5 yêu cầu Đề 04](https://vibecoding.info.vn/de-bai): phần FAQ, gợi ý, lưu và quản trị lịch đã có; cần hoàn thiện lời mời đặt lịch khi bot không trả lời được và ghi rõ chế độ AI mô phỏng. Chưa có căn cứ để gọi đây là hệ thống đa kênh đang vận hành với khách thật.

**Mốc đối chiếu:** `origin/main` tại `e51d386` trước khi cập nhật báo cáo; GitHub ghi trạng thái Vercel thành công cho commit này. [PR #1](https://github.com/tvchinh1423-sys/goldenchat-vibecoding/pull/1) và [PR #2](https://github.com/tvchinh1423-sys/goldenchat-vibecoding/pull/2) đều đã merge. [Hướng dẫn BTC](https://vibecoding.info.vn/bai-viet/yeu-cau-dau-ra-va-huong-dan-nop-bai-vibe-coding-2026) công bố hạn **23:59 ngày 09/11/2026, giờ Việt Nam**. Bảng B chấp nhận AI mô phỏng ghi rõ và lịch lưu trong trình duyệt.

## Tiến độ theo hạng mục

| Hạng mục | Đã có / đã xác minh | Việc còn lại |
| --- | --- | --- |
| FAQ, gợi ý và thử bot | Preset Golden Palace, kho FAQ, Excel mẫu, nhập Excel/Google Sheets, chỉnh persona/guardrails, 6 kịch bản thử nhanh. Vercel trả lời đúng mẫu tiền cọc 5 triệu và hai lựa chọn sảnh cho 300 khách, kèm 3 gợi ý. | Sửa giờ xem sảnh bất nhất; ghi rõ Widget/Simulator là mô phỏng và liệt kê 8–10 câu chuẩn trong README. Training và Widget/Botcake chưa dùng chung một nguồn cấu hình đáng tin cậy; API lưu Training có thể trả thành công dù ghi DB lỗi. |
| Ngoài phạm vi và chuyển người thật | Vercel trả `handoff: true`; Widget có hotline trong tin nhắn chuyển giao và nút Đặt lịch riêng. | Thêm lời mời và nút **Đặt lịch tư vấn** ngay dưới tin chuyển giao. “Cảm ơn em” cũng bị chuyển giao; thêm nhánh xã giao. Chưa xác minh nhân viên thật nhận và phản hồi trong cùng hội thoại. |
| Widget, CRM và lịch hẹn | Widget nhúng, form và bóc tách đặt lịch nhiều lượt; CRM có bảng phễu, danh sách, xem/đổi/xác nhận/hủy/xóa lịch, chống chồng lịch cùng người tiếp đón; có liên kết Calendar. Vercel trả `/api/crm → demo`: cùng trình duyệt và cùng origin để thử Widget → CRM. | Chưa kiểm tra tồn sảnh/giữ sảnh/đặt cọc. Chưa chứng minh Supabase cloud và luồng từ Widget công khai vào CRM thật. |
| Inbox, AI và đa kênh | Inbox ba cột có phân công, ghi chú, soạn nháp và trả lời tự động trong demo. Vercel `/api/ai/draft` trả `mode: demo`; mã có adapter Gemini/9Router. `GET /api/webhook/botcake → ready`; test đọc hai dạng payload Facebook và mẫu Zalo. | Kết nối Facebook đang vướng quyền Page: quản trị viên cần liên kết Facebook với Pancake/Botcake và chọn Page. Zalo cá nhân và Telegram thật chưa có bằng chứng. Webhook chỉ trả JSON, cần flow gửi lại và chứng minh nhận/gửi hai chiều, đồng bộ Inbox/CRM. Không suy ra kết nối từ HTTP 200. |
| Báo cáo, PWA, người dùng | Báo cáo, quản lý tài khoản 3 vai trò, Widget/Inbox mobile, manifest, script nhúng và chuông thông báo đã có. | Tỷ lệ AI 82% và phễu lịch sử là số minh họa. RBAC/tài khoản demo dùng dữ liệu trình duyệt, không phải phân quyền máy chủ. Chuông/badge demo không chứng minh push từ xa; cần thử bàn phím, PWA và ảnh trên iOS/Android thật. |

## Thứ tự hoàn thiện

1. **P0 — Chinh, Hiền:** Chốt một khung giờ đúng giữa lời chào, FAQ và form: API hỏi địa chỉ trả **08:00–21:00**, Widget và nhánh đặt lịch ghi **08:00–10:30**. Nếu đây là giờ mở cửa và giờ tư vấn khác nhau, ghi rõ từng loại. Thêm CTA đặt lịch ngay ở tin ngoài phạm vi. Gắn nhãn **Bản demo vòng loại – Dữ liệu mô phỏng AI** trong app và README.
2. **P0 — Chinh, Hiền:** Chạy lại bằng trình duyệt sạch, gồm FAQ → 3 gợi ý → ngoài phạm vi → mời hẹn → tạo → tải lại vẫn còn → xem/xóa trong CRM. Chạy thêm với điện thoại thật. Đảm bảo giám khảo vào được CRM demo từ README; quay video ≤ 2 phút. Không minh họa Telegram thật nếu chưa xác minh.
3. **P0 — Chinh phụ trách nộp:** Chốt README (cách chạy, 8–10 FAQ, nguồn và giới hạn; bỏ khẳng định 100% và tốc độ chưa đo), xuất Source ZIP sạch, chuẩn bị minh chứng dùng AI tối đa một trang/kèm tối đa 5 ảnh hoặc đoạn hội thoại, và ghi kết quả ít nhất 3 ca kiểm thử. Repo có kịch bản video 1:50; chưa thấy video hoàn chỉnh hay minh chứng đã nộp. ZIP bàn giao cũ chỉ có thư mục `handoff`, không phải source ZIP. Kiểm tra xác thực đội, quyền mở các link và trạng thái nộp trên cổng.
4. **P1 — trước khi dùng với khách thật:** Chinh liên kết Page/Zalo và Telegram; Hiền nối Inbox realtime và CRM cloud. Trước khi nhận dữ liệu thật: xác thực webhook POST, xử lý gửi lại/trùng sự kiện, bỏ log payload/SĐT và kiểm tra lỗi DB; thay mật khẩu demo lưu trong trình duyệt bằng xác thực và phân quyền máy chủ; đối chiếu migration/RLS và adapter CRM. Không dùng schema bàn giao cũ để mở quyền bảng. Kiểm tra nguồn tri thức và cờ AI nhất quán giữa các kênh.
5. **P2 — sau khi luồng nộp ổn định:** Đo thời gian trả lời, lấy KPI từ sự kiện thật, kiểm tra push từ xa, tách dữ liệu và quyền theo doanh nghiệp nếu đưa lên SaaS.

## Bằng chứng kiểm tra

- Vercel: `/widget`, `/inbox`, `/leads`, `/dashboard`, `/training`, `/settings`, `/users`, `/download`, `/login`, `/embed.js`, `/manifest.json` trả 200. Đây là kiểm tra khả dụng HTTP, không thay thế thử toàn bộ giao diện.
- Ca bình thường: hỏi giá cọc → HTTP 200, **5.000.000 đồng** và **3 gợi ý**. Ca đầu vào sai: tin nhắn rỗng → HTTP 400, báo **Tin nhắn trống**. Ca biên: hỏi sửa máy giặt → HTTP 200, có chuyển giao và 3 gợi ý FAQ, thiếu lời mời đặt lịch trực tiếp.
- Bản nhánh Hiền sau tích hợp main: build qua, 20/20 trang tạo tĩnh, kiểm tra kiểu và lint qua với cảnh báo ảnh `<img>`; 49/49 test logic/API/SQL đạt (Postgres cục bộ, HTTP dịch vụ mô phỏng). 29/29 ca Playwright Chrome đạt, gồm tạo lịch Widget → Calendar → xóa ở CRM, tải lại và thao tác CRM, mobile mô phỏng, Inbox, Báo cáo, PWA và chuông thông báo. Không thay cho iOS/Android thật.
- Không có thử ghi dữ liệu khách lên production trong đợt rà soát. Không thay đổi schema bàn giao cục bộ hoặc các file setup chưa theo dõi.

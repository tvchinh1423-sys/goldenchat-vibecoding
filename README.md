# OmniChat AI · Module 1

Inbox theo `SPEC_GIAO_DIEN_TINH_NANG.md`, Next.js 14 App Router, TypeScript, Tailwind CSS, các primitive shadcn/ui (Radix) và Lucide.

## Chạy ứng dụng

```sh
npm install
npm run dev
```

Mở http://localhost:3000/inbox. `/` tự chuyển về `/inbox`.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

## Phạm vi hiện tại

- Tìm tên/SĐT/email/nội dung, hỗ trợ tên không dấu và Ctrl/Cmd+K. Tab và bộ lọc kênh, lịch hẹn, liên hệ kết hợp với nhau; bộ đếm lấy từ dữ liệu.
- Chat hai chiều: gửi tin của tư vấn viên, Enter/Shift+Enter, emoji, ảnh demo (PNG/JPG/WebP/GIF, tối đa 2 ảnh/tin, 700 KB/ảnh), thả tim, hoàn tất, lưu trữ, khôi phục, phân công. Khi sales gửi tin, cờ AI tự tắt.
- Soạn nháp dùng quy tắc ghép FAQ từ `mock_data.json`, điền vào ô soạn để người dùng sửa/duyệt. Đây là **gợi ý demo**, chưa gọi AI và không tự gửi trả lời.
- Tách SĐT/email từ tin nhắn **của khách**; form tạo lead cho phép sửa, kiểm tra số di động VN/email và chặn trùng SĐT với lead đã lưu trong Inbox.
- Ghi chú, cờ AI, tin nhắn, ảnh, lead, trạng thái được lưu trong `localStorage` với key `omnichat.inbox.v1`; giữ lại khi tải lại trang trên cùng trình duyệt. Lỗi đọc/ghi được thông báo. Liên kết hội thoại chỉ có ý nghĩa trên trình duyệt chứa dữ liệu này.
- Desktop từ 1280 px: ba cột. Tablet: danh sách + chat, thông tin ở drawer. Mobile: danh sách → chat → drawer thông tin. Mỗi cột cuộn riêng.

## Dữ liệu và điểm tích hợp tiếp theo

File mẫu gốc không có hội thoại. `lib/inbox/demo-data.ts` bổ sung **hội thoại minh họa**, dùng FAQ, lead và booking trong file gốc. Không cần biến môi trường để chạy Module 1.

Chưa có kết nối Supabase, webhook Facebook/Zalo/Web hoặc nhà cung cấp AI; gửi tin và tạo lead hiện là thao tác demo cục bộ. Bật AI chỉ lưu cờ cấu hình, chưa có worker trả lời tự động. Module 2 sẽ thay `createFaqDraft` bằng AI service; lớp kiểu dữ liệu nằm trong `lib/inbox/types.ts`. Module 3 sẽ bổ sung CRM và chỉnh lịch. Nút cấu hình Bot được vô hiệu hóa khi trang cấu hình chưa được tích hợp.

Schema bàn giao ở `handoff/supabase_schema.sql`. Khi tích hợp cần ánh xạ tên field phía UI sang schema, thêm lưu ghi chú/email và trạng thái lưu trữ (schema hiện chưa có), xác thực và chính sách RLS phù hợp. Không đưa service-role key/API key AI vào client component.

Để đưa demo về mặc định, xóa key `omnichat.inbox.v1` trong DevTools → Application → Local Storage và tải lại.

import test from "node:test";
import assert from "node:assert/strict";
import { getInboxUnreadCount } from "@/lib/inbox/use-unread-count";
import { STORAGE_KEY } from "@/lib/inbox/storage";

test("getInboxUnreadCount returns 0 when storage is empty or window is undefined", () => {
  // Trong môi trường node không có window/localStorage mặc định
  const count = getInboxUnreadCount();
  assert.equal(count, 0);
});

test("getInboxUnreadCount chỉ hiển thị số lượng cuộc trò chuyện chưa đọc (không tính tổng số tin nhắn)", () => {
  // Giả lập window và localStorage
  const mockStorage: Record<string, string> = {};
  (globalThis as any).window = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
  };

  try {
    // 1. Khi chưa có tin nhắn nào chưa đọc
    mockStorage[STORAGE_KEY] = JSON.stringify({
      version: 1,
      conversations: [
        { id: "c-1", status: "active", unread: 0 },
        { id: "c-2", status: "resolved", unread: 0 },
      ],
    });
    assert.equal(getInboxUnreadCount(), 0);

    // 2. Khi có 3 tin nhắn chưa đọc ở hội thoại 1 và 2 tin ở hội thoại 2:
    // ĐÚNG YÊU CẦU: Số đỏ chỉ đếm số CUỘC TRÒ CHUYỆN chưa đọc (2), KHÔNG cộng dồn tổng tin nhắn (5)
    mockStorage[STORAGE_KEY] = JSON.stringify({
      version: 1,
      conversations: [
        {
          id: "c-1",
          status: "active",
          unread: 3,
          messages: [{ id: "m1", sender: "customer", content: "Alo", createdAt: "2026-11-09T10:00:00Z" }],
        },
        {
          id: "c-2",
          status: "active",
          unread: 2,
          messages: [{ id: "m2", sender: "customer", content: "Báo giá", createdAt: "2026-11-09T10:01:00Z" }],
        },
        {
          id: "c-3",
          status: "archived",
          unread: 5, // Bỏ qua hội thoại đã lưu trữ
          messages: [{ id: "m3", sender: "customer", content: "Lưu trữ", createdAt: "2026-11-09T10:02:00Z" }],
        },
        {
          id: "c-4",
          status: "active",
          unread: 4, // Tin nhắn cuối do bot gửi -> Coi như đã xử lý, không đếm chưa đọc
          messages: [{ id: "m4", sender: "bot", content: "Đã tư vấn xong", createdAt: "2026-11-09T10:03:00Z" }],
        },
      ],
    });
    assert.equal(getInboxUnreadCount(), 2, "Chỉ hiển thị số lượng cuộc trò chuyện chưa đọc (2), không phải tổng số tin nhắn!");

    // 3. Khi người dùng đã đọc hết tin nhắn
    mockStorage[STORAGE_KEY] = JSON.stringify({
      version: 1,
      conversations: [
        { id: "c-1", status: "active", unread: 0 },
        { id: "c-2", status: "active", unread: 0 },
      ],
    });
    assert.equal(getInboxUnreadCount(), 0);
  } finally {
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
  }
});

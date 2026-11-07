import test from "node:test";
import assert from "node:assert/strict";
import { getInboxUnreadCount } from "@/lib/inbox/use-unread-count";
import { STORAGE_KEY } from "@/lib/inbox/storage";

test("getInboxUnreadCount returns 0 when storage is empty or window is undefined", () => {
  // Trong môi trường node không có window/localStorage mặc định
  const count = getInboxUnreadCount();
  assert.equal(count, 0);
});

test("getInboxUnreadCount correctly sums up unread messages from active conversations", () => {
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

    // 2. Khi có 3 tin nhắn chưa đọc ở hội thoại 1 và 2 tin ở hội thoại 2
    mockStorage[STORAGE_KEY] = JSON.stringify({
      version: 1,
      conversations: [
        { id: "c-1", status: "active", unread: 3 },
        { id: "c-2", status: "active", unread: 2 },
        { id: "c-3", status: "archived", unread: 5 }, // Bỏ qua hội thoại đã lưu trữ
      ],
    });
    assert.equal(getInboxUnreadCount(), 5);

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

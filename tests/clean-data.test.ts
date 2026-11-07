import test from "node:test";
import assert from "node:assert/strict";
import {
  clearAllDemoData,
  restoreDemoData,
  getCurrentDataStats,
  isDemoDataPresent,
  autoCleanupIfDemo,
  PRODUCTION_MODE_KEY,
} from "../lib/clean-data";
import { STORAGE_KEY as INBOX_KEY } from "../lib/inbox/storage";
import { CRM_STORAGE_KEY } from "../lib/crm/demo-store";
import { NOTIFICATIONS_STORAGE_KEY } from "../lib/notifications";

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: store.size,
  } as unknown as Storage;
}

test("clean-data: clearAllDemoData clears demo inbox, crm and notifications to clean production state", () => {
  const mockStorage = createMockStorage();
  (global as any).window = {
    localStorage: mockStorage,
    dispatchEvent: () => true,
  };
  (global as any).localStorage = mockStorage;

  // 1. Nạp demo data trước
  restoreDemoData();
  assert.equal(isDemoDataPresent(), true);
  const beforeStats = getCurrentDataStats();
  assert.ok(beforeStats.conversations > 0);
  assert.ok(beforeStats.leads > 0);
  assert.ok(beforeStats.bookings > 0);

  // 2. Chạy dọn dẹp sạch toàn bộ
  const result = clearAllDemoData();
  assert.equal(result.success, true);

  // 3. Kiểm tra kết quả
  assert.equal(isDemoDataPresent(), false);
  const afterStats = getCurrentDataStats();
  // Giữ lại hội thoại khách Web Widget kèm thẻ xác nhận đặt lịch để con người kiểm soát
  assert.equal(afterStats.conversations, 1);
  assert.equal(afterStats.leads, 1);
  assert.equal(afterStats.bookings, 1);
  assert.equal(afterStats.isClean, true);
  assert.equal(mockStorage.getItem(PRODUCTION_MODE_KEY), "true");
});

test("clean-data: autoCleanupIfDemo automatically detects and clears legacy demo data", () => {
  const mockStorage = createMockStorage();
  (global as any).window = {
    localStorage: mockStorage,
    dispatchEvent: () => true,
  };
  (global as any).localStorage = mockStorage;

  restoreDemoData();
  assert.equal(isDemoDataPresent(), true);

  const cleaned = autoCleanupIfDemo();
  assert.equal(cleaned, true);
  assert.equal(isDemoDataPresent(), false);

  // Lần 2 chạy lại không còn demo -> trả về false
  const secondRun = autoCleanupIfDemo();
  assert.equal(secondRun, false);
});

test("widget-sync: syncWidgetChatToInbox syncs messages and booking confirmation to inbox in real-time", async () => {
  const { syncWidgetChatToInbox, getInboxConversations } = await import(
    "../lib/inbox/widget-sync"
  );
  const mockStorage = createMockStorage();
  (global as any).window = {
    localStorage: mockStorage,
    dispatchEvent: () => true,
  };
  (global as any).localStorage = mockStorage;

  const widgetMessages = [
    {
      id: "u-1",
      sender: "user" as const,
      text: "Tôi muốn đặt lịch xem sảnh tiệc cưới 35 bàn vào 9h ngày 12/11",
      time: "10:30",
    },
    {
      id: "b-1",
      sender: "bot" as const,
      text: "🎉 ĐẶT LỊCH THÀNH CÔNG!\nThời gian: 09:00 · 12/11/2026",
      time: "10:30",
    },
  ];

  syncWidgetChatToInbox(widgetMessages, {
    fullName: "Vũ Khánh Linh",
    phone: "0977123456",
    appointmentTime: "2026-11-12T09:00:00+07:00",
    eventType: "xem_sanh",
    guestsCount: 2,
    notes: "Đặt lịch xem sảnh 35 bàn từ Web Widget",
  });

  const inboxList = getInboxConversations();
  assert.ok(inboxList.length >= 1);
  const webConv = inboxList.find((c) => c.channel === "web");
  assert.ok(webConv);
  assert.ok(webConv.name.includes("Vũ Khánh Linh"));
  assert.equal(webConv.messages.length, 2);
  assert.ok(webConv.messages[1].bookingConfirmation);
  assert.equal(webConv.messages[1].bookingConfirmation.event_type, "xem_sanh");
  assert.equal(webConv.lead?.phone, "0977123456");
});

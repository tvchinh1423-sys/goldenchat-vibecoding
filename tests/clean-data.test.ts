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
  assert.equal(afterStats.conversations, 0);
  assert.equal(afterStats.leads, 0);
  assert.equal(afterStats.bookings, 0);
  assert.equal(afterStats.notifications, 0);
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

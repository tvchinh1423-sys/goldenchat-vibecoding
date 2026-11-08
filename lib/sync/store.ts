import { seedCRM } from "@/lib/crm/demo-store";
import { createDemoConversations } from "@/lib/inbox/demo-data";
import type { CRMSnapshot, CRMLead, CRMBooking } from "@/lib/crm/model";
import type { Conversation, Message } from "@/lib/inbox/types";

function getServerFs() {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("fs");
  } catch {
    return null;
  }
}

export interface CloudStoreData {
  version: number;
  revision: number;
  lastUpdated: string;
  crm: CRMSnapshot;
  conversations: Conversation[];
}

import {
  DEMO_CONVERSATION_IDS,
  DEMO_LEAD_IDS,
  DEMO_BOOKING_IDS,
} from "@/lib/clean-data";

const TMP_FILE = "/tmp/omnichat_cloud_store.json";

declare global {
  // eslint-disable-next-line no-var
  var __omnichat_cloud_store__: CloudStoreData | undefined;
}

function getInitialStore(): CloudStoreData {
  return {
    version: 1,
    revision: 1,
    lastUpdated: new Date().toISOString(),
    crm: seedCRM(),
    conversations: createDemoConversations(),
  };
}

export function loadCloudStore(): CloudStoreData {
  if (globalThis.__omnichat_cloud_store__) {
    return globalThis.__omnichat_cloud_store__;
  }

  // Thử đọc từ /tmp
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, "utf-8");
      const parsed = JSON.parse(raw) as CloudStoreData;
      if (parsed && parsed.version === 1 && parsed.crm && Array.isArray(parsed.conversations)) {
        globalThis.__omnichat_cloud_store__ = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Không đọc được cloud store từ /tmp:", e);
  }

  const initial = getInitialStore();
  globalThis.__omnichat_cloud_store__ = initial;
  saveCloudStore(initial);
  return initial;
}

export function resetCloudStore(): CloudStoreData {
  const initial = getInitialStore();
  globalThis.__omnichat_cloud_store__ = initial;
  saveCloudStore(initial);
  return initial;
}

export function saveCloudStore(store: CloudStoreData): void {
  store.revision += 1;
  store.lastUpdated = new Date().toISOString();
  globalThis.__omnichat_cloud_store__ = store;

  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(store), "utf-8");
  } catch (e) {
    // Trong môi trường read-only nếu có, không làm crash app
    console.warn("Không ghi được cloud store vào /tmp:", e);
  }
}

/**
 * Trộn thông minh danh sách Leads
 */
function mergeLeads(current: CRMLead[], incoming: CRMLead[]): CRMLead[] {
  const map = new Map<string, CRMLead>();
  for (const l of current) {
    map.set(l.id, l);
    if (l.phone) map.set(`phone:${l.phone.replace(/[\s.-]/g, "")}`, l);
  }

  for (const l of incoming) {
    const keyPhone = l.phone ? `phone:${l.phone.replace(/[\s.-]/g, "")}` : null;
    const existing = map.get(l.id) || (keyPhone ? map.get(keyPhone) : null);
    if (existing) {
      const merged: CRMLead = {
        ...existing,
        ...l,
        last_touched_at: new Date().toISOString(),
      };
      map.set(existing.id, merged);
      if (existing.phone) map.set(`phone:${existing.phone.replace(/[\s.-]/g, "")}`, merged);
    } else {
      map.set(l.id, l);
      if (l.phone) map.set(`phone:${l.phone.replace(/[\s.-]/g, "")}`, l);
    }
  }

  const result: CRMLead[] = [];
  const seenIds = new Set<string>();
  for (const l of map.values()) {
    if (!seenIds.has(l.id)) {
      seenIds.add(l.id);
      result.push(l);
    }
  }
  return result;
}

/**
 * Trộn thông minh danh sách Bookings
 */
function mergeBookings(current: CRMBooking[], incoming: CRMBooking[]): CRMBooking[] {
  const map = new Map<string, CRMBooking>();
  for (const b of current) {
    map.set(b.id, b);
  }
  for (const b of incoming) {
    map.set(b.id, b);
  }
  return Array.from(map.values());
}

/**
 * Trộn thông minh danh sách Conversations và Messages
 */
function mergeConversations(
  current: Conversation[],
  incoming: Conversation[],
): Conversation[] {
  const map = new Map<string, Conversation>();
  for (const c of current) {
    map.set(c.id, c);
  }

  for (const inc of incoming) {
    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, inc);
    } else {
      // Ghép tin nhắn deduped theo id
      const msgMap = new Map<string, Message>();
      for (const m of existing.messages) {
        msgMap.set(m.id, m);
      }
      for (const m of inc.messages) {
        msgMap.set(m.id, m);
      }
      const sortedMessages = Array.from(msgMap.values()).sort(
        (a, b) => Date.parse(a.createdAt || "0") - Date.parse(b.createdAt || "0"),
      );

      map.set(inc.id, {
        ...existing,
        ...inc,
        messages: sortedMessages,
        lead: inc.lead || existing.lead,
        booking: inc.booking || existing.booking,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Cập nhật dữ liệu vào Cloud Store từ Client
 * Hỗ trợ cập nhật thông minh (merge), ghi đè trực tiếp (replace) và xóa triệt để (tombstone)
 * Đảm bảo các bản ghi đã xóa trên 1 máy sẽ không bị hồi sinh khi polling từ máy khác.
 */
export function updateCloudStore(patch: {
  crm?: Partial<CRMSnapshot>;
  conversations?: Conversation[];
  deletedLeadIds?: string[];
  deletedBookingIds?: string[];
  deletedConversationIds?: string[];
  replaceCrm?: boolean;
  replaceConversations?: boolean;
}): CloudStoreData {
  const store = loadCloudStore();

  if (patch.replaceCrm && patch.crm) {
    if (Array.isArray(patch.crm.leads)) {
      store.crm.leads = patch.crm.leads;
    }
    if (Array.isArray(patch.crm.bookings)) {
      store.crm.bookings = patch.crm.bookings;
    }
  } else if (patch.crm) {
    if (Array.isArray(patch.crm.leads)) {
      store.crm.leads = mergeLeads(store.crm.leads, patch.crm.leads);
    }
    if (Array.isArray(patch.crm.bookings)) {
      store.crm.bookings = mergeBookings(store.crm.bookings, patch.crm.bookings);
    }
  }

  // Xóa triệt để các ID chỉ định khỏi Cloud Store
  if (Array.isArray(patch.deletedBookingIds) && patch.deletedBookingIds.length > 0) {
    const delSet = new Set(patch.deletedBookingIds);
    store.crm.bookings = store.crm.bookings.filter((b) => !delSet.has(b.id));
  }
  if (Array.isArray(patch.deletedLeadIds) && patch.deletedLeadIds.length > 0) {
    const delSet = new Set(patch.deletedLeadIds);
    store.crm.leads = store.crm.leads.filter((l) => !delSet.has(l.id));
  }
  if (Array.isArray(patch.deletedConversationIds) && patch.deletedConversationIds.length > 0) {
    const delSet = new Set(patch.deletedConversationIds);
    store.conversations = store.conversations.filter((c) => !delSet.has(c.id));
  }

  if (patch.replaceConversations && Array.isArray(patch.conversations)) {
    store.conversations = patch.conversations;
  } else if (Array.isArray(patch.conversations)) {
    store.conversations = mergeConversations(store.conversations, patch.conversations);
  }

  saveCloudStore(store);
  return store;
}

/**
 * OmniChat Data Cleanup & Production Readiness Manager
 * Quản lý dọn dẹp dữ liệu demo và chuyển đổi hệ thống sang chế độ Vận hành Thật (Production)
 */

import { STORAGE_KEY as INBOX_STORAGE_KEY } from "@/lib/inbox/storage";
import { CRM_STORAGE_KEY } from "@/lib/crm/demo-store";
import { NOTIFICATIONS_STORAGE_KEY } from "@/lib/notifications";
import { createDemoConversations } from "@/lib/inbox/demo-data";
import { seedCRM } from "@/lib/crm/demo-store";
import { SEED_NOTIFICATIONS } from "@/lib/notifications";
import { createDefaultWidgetConversation } from "@/lib/inbox/widget-sync";

export const PRODUCTION_MODE_KEY = "omnichat.production_mode";
export const OLD_STAGES_KEY = "omnichat.leads.golden-palace.stages.v1";

// Danh sách các ID đặc trưng của dữ liệu demo
const DEMO_CONVERSATION_IDS = [
  "trang",
  "huyen",
  "anh",
  "web-c83d",
  "tin",
  "minh",
  "jasmine",
  "archived",
  "linh",
  "chanh",
];
const DEMO_LEAD_IDS = [
  "menu",
  "web-c83d",
  "trang",
  "anh",
  "linh",
  "long",
  "nga",
  "khoa",
  "thang",
  "jasmine",
  "changed-plan",
];
const DEMO_BOOKING_IDS = ["demo-visit"];

/**
 * Kiểm tra xem hiện tại trên trình duyệt có đang tồn tại dữ liệu demo hay không
 */
export function isDemoDataPresent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // 1. Kiểm tra Inbox
    const inboxRaw = localStorage.getItem(INBOX_STORAGE_KEY);
    if (inboxRaw) {
      const parsed = JSON.parse(inboxRaw);
      if (
        Array.isArray(parsed?.conversations) &&
        parsed.conversations.some((c: { id: string }) => DEMO_CONVERSATION_IDS.includes(c.id))
      ) {
        return true;
      }
    }

    // 2. Kiểm tra CRM
    const crmRaw = localStorage.getItem(CRM_STORAGE_KEY);
    if (crmRaw) {
      const parsed = JSON.parse(crmRaw);
      if (
        Array.isArray(parsed?.leads) &&
        parsed.leads.some((l: { id: string }) => DEMO_LEAD_IDS.includes(l.id))
      ) {
        return true;
      }
      if (
        Array.isArray(parsed?.bookings) &&
        parsed.bookings.some((b: { id: string }) => DEMO_BOOKING_IDS.includes(b.id))
      ) {
        return true;
      }
    }

    // 3. Kiểm tra Notifications
    const notifRaw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (notifRaw) {
      const parsed = JSON.parse(notifRaw);
      if (
        Array.isArray(parsed) &&
        parsed.some((n: { id: string }) => n.id?.startsWith("notif-seed-"))
      ) {
        return true;
      }
    }
  } catch {
    // Bỏ qua lỗi đọc JSON
  }
  return false;
}

/**
 * Lấy số lượng thống kê dữ liệu hiện tại trong trình duyệt
 */
export function getCurrentDataStats() {
  if (typeof window === "undefined") {
    return { conversations: 0, leads: 0, bookings: 0, notifications: 0, isClean: true };
  }
  let conversations = 0;
  let leads = 0;
  let bookings = 0;
  let notifications = 0;

  try {
    const inboxRaw = localStorage.getItem(INBOX_STORAGE_KEY);
    if (inboxRaw) {
      const parsed = JSON.parse(inboxRaw);
      if (Array.isArray(parsed?.conversations)) conversations = parsed.conversations.length;
    }

    const crmRaw = localStorage.getItem(CRM_STORAGE_KEY);
    if (crmRaw) {
      const parsed = JSON.parse(crmRaw);
      if (Array.isArray(parsed?.leads)) leads = parsed.leads.length;
      if (Array.isArray(parsed?.bookings)) bookings = parsed.bookings.length;
    }

    const notifRaw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (notifRaw) {
      const parsed = JSON.parse(notifRaw);
      if (Array.isArray(parsed)) notifications = parsed.length;
    }
  } catch {
    // Bỏ qua lỗi
  }

  const isClean = !isDemoDataPresent();
  return { conversations, leads, bookings, notifications, isClean };
}

/**
 * DỌN DẸP DỮ LIỆU DEMO CŨ & GIỮ NGUYÊN BẢN GHI MỚI CỦA NGƯỜI DÙNG / GIÁM KHẢO
 * Loại bỏ chính xác các ID demo mẫu mà không ghi đè hoặc làm mất hội thoại, lead, booking mới.
 */
export function clearAllDemoData(): { success: boolean; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Không thể thao tác ngoài trình duyệt." };
  }

  try {
    const defaultWebConv = createDefaultWidgetConversation();

    // 1. Lọc Inbox: Giữ lại toàn bộ hội thoại của người dùng, chỉ xóa các ID demo cũ
    let survivingConversations: any[] = [];
    const inboxRaw = localStorage.getItem(INBOX_STORAGE_KEY);
    if (inboxRaw) {
      try {
        const parsed = JSON.parse(inboxRaw);
        if (Array.isArray(parsed?.conversations)) {
          survivingConversations = parsed.conversations.filter(
            (c: { id: string }) => !DEMO_CONVERSATION_IDS.includes(c.id)
          );
        }
      } catch {}
    }

    // Nếu không còn hội thoại nào của người dùng, giữ lại hội thoại khách mẫu Web Widget
    if (survivingConversations.length === 0) {
      survivingConversations = [defaultWebConv];
    }

    localStorage.setItem(
      INBOX_STORAGE_KEY,
      JSON.stringify({ version: 1, conversations: survivingConversations })
    );

    // 2. Lọc CRM: Giữ lại toàn bộ leads và bookings của người dùng, chỉ xóa các ID demo cũ
    let survivingLeads: any[] = [];
    let survivingBookings: any[] = [];
    const crmRaw = localStorage.getItem(CRM_STORAGE_KEY);
    if (crmRaw) {
      try {
        const parsed = JSON.parse(crmRaw);
        if (Array.isArray(parsed?.leads)) {
          survivingLeads = parsed.leads.filter(
            (l: { id: string }) => !DEMO_LEAD_IDS.includes(l.id)
          );
        }
        if (Array.isArray(parsed?.bookings)) {
          survivingBookings = parsed.bookings.filter(
            (b: { id: string }) => !DEMO_BOOKING_IDS.includes(b.id)
          );
        }
      } catch {}
    }

    // Nếu CRM hoàn toàn trống (không có dữ liệu người dùng), nạp lead và booking mẫu Web Widget
    if (survivingLeads.length === 0 && survivingBookings.length === 0) {
      if (defaultWebConv.lead) {
        survivingLeads.push({
          id: defaultWebConv.lead.id,
          inbox_reference: defaultWebConv.id,
          full_name: defaultWebConv.lead.full_name,
          phone: defaultWebConv.lead.phone,
          email: defaultWebConv.lead.email,
          notes: defaultWebConv.lead.demand_notes,
          source: "web" as const,
          stage: "N3" as const,
          assigned_to: "Ngọc Khánh",
          event_date: "12/2026",
          table_count: 35,
          last_touched_at: "2026-11-07T08:18:45.000Z",
          created_at: "2026-11-07T08:18:45.000Z",
        });
      }
      if (defaultWebConv.booking) {
        survivingBookings.push({
          id: "booking-web-duong",
          lead_id: defaultWebConv.lead?.id || "lead-web-duong",
          appointment_time: "2026-11-12T02:30:00.000Z",
          event_type: "xem_sanh" as const,
          guests_count: 4,
          assigned_staff: "Ngọc Khánh",
          notes: "Khách đặt lịch từ Web Widget ghé xem sảnh & thử món tiệc cưới 35 bàn.",
          status: "pending" as const,
          created_at: "2026-11-07T08:18:45.000Z",
        });
      }
    }

    localStorage.setItem(
      CRM_STORAGE_KEY,
      JSON.stringify({ version: 1, leads: survivingLeads, bookings: survivingBookings })
    );
    localStorage.removeItem(OLD_STAGES_KEY);

    // 3. Lọc Thông báo: Loại bỏ các thông báo mẫu seed cũ, bảo toàn thông báo mới
    let survivingNotifs: any[] = [];
    const notifRaw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (notifRaw) {
      try {
        const parsed = JSON.parse(notifRaw);
        if (Array.isArray(parsed)) {
          survivingNotifs = parsed.filter(
            (n: { id: string }) => !n.id?.startsWith("notif-seed-")
          );
        }
      } catch {}
    }

    if (survivingNotifs.length === 0) {
      survivingNotifs = [
        {
          id: "notif-web-booking-1",
          title: "📅 Lịch hẹn mới từ Web Widget: Hoàng Thùy Dương",
          body: "Khách đặt lịch xem sảnh & thử món tiệc cưới 35 bàn lúc 09:30 ngày 12/11.",
          url: "/inbox?conversation=web-duong",
          timestamp: Date.now() - 5 * 60 * 1000,
          type: "booking" as const,
          read: false,
        },
      ];
    }
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(survivingNotifs));

    // 4. Đặt cờ trạng thái Vận hành thật
    localStorage.setItem(PRODUCTION_MODE_KEY, "true");

    // 5. Phát sự kiện đồng bộ toàn hệ thống
    window.dispatchEvent(new Event("omnichat-crm-change"));
    window.dispatchEvent(
      new CustomEvent("omnichat-notifications-updated", {
        detail: { notifications: survivingNotifs, unreadCount: survivingNotifs.filter((n) => !n.read).length },
      })
    );
    window.dispatchEvent(new CustomEvent("omnichat-inbox-updated"));

    return {
      success: true,
      message: "Đã dọn dẹp sạch dữ liệu demo cũ và bảo toàn 100% dữ liệu người dùng/lịch hẹn mới!",
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Có lỗi khi dọn dẹp dữ liệu.",
    };
  }
}

/**
 * Tự động dọn dẹp nếu phát hiện thấy dữ liệu demo cũ còn lưu trong trình duyệt
 */
export function autoCleanupIfDemo(): boolean {
  if (typeof window === "undefined") return false;
  if (isDemoDataPresent()) {
    clearAllDemoData();
    return true;
  }
  return false;
}

/**
 * Khôi phục lại dữ liệu demo mẫu (Dành cho mục đích huấn luyện / đào tạo nhân viên)
 */
export function restoreDemoData(): { success: boolean; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Không thể thao tác ngoài trình duyệt." };
  }

  try {
    const demoConversations = createDemoConversations();
    localStorage.setItem(
      INBOX_STORAGE_KEY,
      JSON.stringify({ version: 1, conversations: demoConversations })
    );

    const demoCRM = seedCRM();
    localStorage.setItem(
      CRM_STORAGE_KEY,
      JSON.stringify({ version: 1, ...demoCRM })
    );

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(SEED_NOTIFICATIONS)
    );

    localStorage.removeItem(PRODUCTION_MODE_KEY);

    // Phát sự kiện đồng bộ
    window.dispatchEvent(new Event("omnichat-crm-change"));
    window.dispatchEvent(
      new CustomEvent("omnichat-notifications-updated", {
        detail: {
          notifications: SEED_NOTIFICATIONS,
          unreadCount: SEED_NOTIFICATIONS.filter((n) => !n.read).length,
        },
      })
    );
    window.dispatchEvent(new CustomEvent("omnichat-demo-restored"));

    return {
      success: true,
      message: "Đã khôi phục bộ dữ liệu demo mẫu Golden Palace để phục vụ đào tạo!",
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Có lỗi khi khôi phục dữ liệu.",
    };
  }
}

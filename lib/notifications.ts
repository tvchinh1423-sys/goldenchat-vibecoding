/**
 * OmniChat Web Notification, In-App Notification & App Badging Manager
 * Đồng bộ chuông thông báo, âm thanh Chime, số lượng badge trên App PWA và Web
 */

import {
  playNotificationChime,
  playBookingSuccessCelebrationTone,
} from "@/lib/chat/sound";
import { triggerHaptic } from "./mobile/haptics";

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
  type?: "message" | "booking" | "lead" | "system";
  read?: boolean;
}

type NotificationListener = (notification: InAppNotification) => void;
const listeners = new Set<NotificationListener>();

export function subscribeInAppNotifications(listener: NotificationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Cập nhật số lượng thông báo (App Badge & Tab Title)
 * Hỗ trợ Web App Badging API cho PWA icon trên màn hình chính và thanh Taskbar/Dock
 */
export function updateAppBadge(count: number) {
  if (typeof window === "undefined") return;

  // 1. Web App Badging API
  try {
    if ("setAppBadge" in navigator) {
      if (count > 0) {
        void (navigator as any).setAppBadge(count).catch(() => {});
      } else {
        void (navigator as any).clearAppBadge().catch(() => {});
      }
    }
  } catch {
    // Không hỗ trợ thì bỏ qua
  }

  // 2. Cập nhật Title tab trình duyệt: "(3) OmniChat AI - Hộp thư"
  try {
    const rawTitle = document.title.replace(/^\(\d+\)\s*/, "");
    if (count > 0) {
      document.title = `(${count}) ${rawTitle || "OmniChat AI - Hộp thư"}`;
    } else {
      document.title = rawTitle || "OmniChat AI - Hộp thư";
    }
  } catch {
    // Bỏ qua lỗi truy cập title
  }
}

/**
 * Danh sách thông báo mẫu thực tế của Golden Palace cho demo (dùng khi cần khôi phục đào tạo)
 */
export const SEED_NOTIFICATIONS: InAppNotification[] = [
  {
    id: "notif-seed-1",
    title: "Tin nhắn mới từ Dũ Chanh",
    body: "Nhà em dự kiến khoảng 35 bàn. Bên mình có ưu đãi gì cho tiệc cưới không ạ?",
    url: "/inbox?conversation=chanh",
    timestamp: Date.now() - 2 * 60 * 1000, // 2 phút trước
    type: "message",
    read: false,
  },
  {
    id: "notif-seed-2",
    title: "Lịch hẹn mới: Vũ Huyền Trang",
    body: "Hẹn xem sảnh & thử món cuối tuần lúc 09:30 ngày 12/11 (300 khách)",
    url: "/leads",
    timestamp: Date.now() - 5 * 60 * 1000, // 5 phút trước
    type: "booking",
    read: false,
  },
  {
    id: "notif-seed-3",
    title: "Cảnh báo SLA: Chờ phản hồi gấp",
    body: "Hội thoại với Hoàng Thuỳ Dương trên Web Widget đã quá hạn 15 phút chưa có nhân viên tiếp quản.",
    url: "/inbox",
    timestamp: Date.now() - 12 * 60 * 1000, // 12 phút trước
    type: "lead",
    read: false,
  },
  {
    id: "notif-seed-4",
    title: "Chỉ định phiên chat mới",
    body: "Quản trị viên đã chỉ định phiên chat của khách Đoàn Thị Mai cho bạn.",
    url: "/inbox",
    timestamp: Date.now() - 35 * 60 * 1000, // 35 phút trước
    type: "system",
    read: true,
  },
];

export const NOTIFICATIONS_STORAGE_KEY = "omnichat_notifications_v1";
const STORAGE_KEY = NOTIFICATIONS_STORAGE_KEY;

/**
 * Lấy danh sách thông báo từ Storage (mặc định rỗng khi chạy thật)
 */
export function getStoredNotifications(): InAppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Tự động loại bỏ thông báo seed demo cũ nếu có
      const filtered = parsed.filter((n: any) => !n.id?.startsWith("notif-seed-"));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Lưu danh sách thông báo và phát sự kiện đồng bộ
 */
export function saveStoredNotifications(notifications: InAppNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    const unread = notifications.filter((n) => !n.read).length;
    updateAppBadge(unread);
    window.dispatchEvent(
      new CustomEvent("omnichat-notifications-updated", {
        detail: { notifications, unreadCount: unread },
      })
    );
  } catch {
    // Bỏ qua lỗi
  }
}

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
export function markNotificationAsRead(id: string) {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
}

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export function markAllNotificationsAsRead() {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
}

/**
 * Xóa toàn bộ lịch sử thông báo
 */
export function clearAllNotifications() {
  saveStoredNotifications([]);
}

/**
 * Gửi thông báo hệ thống (Phát âm thanh chuông Chime, rung Haptic, hiển thị Banner và đẩy Notification API)
 */
export function sendOmniNotification(options: {
  title: string;
  body: string;
  url?: string;
  type?: "message" | "booking" | "lead" | "system";
  playSound?: boolean;
  haptic?: boolean;
}) {
  const notification: InAppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: options.title,
    body: options.body,
    url: options.url,
    timestamp: Date.now(),
    type: options.type || "message",
    read: false,
  };

  // 1. Lưu vào danh sách thông báo
  const current = getStoredNotifications();
  saveStoredNotifications([notification, ...current]);

  // 2. Phát hiệu ứng âm thanh: chuông chúc mừng cho booking, chuông Ding-Dong cho tin nhắn thông thường
  if (options.playSound !== false) {
    try {
      if (options.type === "booking") {
        playBookingSuccessCelebrationTone();
      } else {
        playNotificationChime();
      }
    } catch {
      // AudioContext requires user gesture
    }
  }

  // 3. Rung Haptic phản hồi trên Mobile
  if (options.haptic !== false) {
    triggerHaptic(options.type === "booking" ? "success" : "light");
  }

  // 4. Bắn sự kiện tới in-app listeners (Dynamic Island banner)
  listeners.forEach((listener) => {
    try {
      listener(notification);
    } catch {
      // Ignore
    }
  });

  // 5. Web Push / Native Notification nếu được cho phép
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted" &&
    (document.hidden || options.type === "booking")
  ) {
    try {
      const nativeNotif = new Notification(options.title, {
        body: options.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });
      nativeNotif.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        nativeNotif.close();
      };
    } catch {
      // Fallback
    }
  }

  return notification;
}

/**
 * Yêu cầu quyền gửi thông báo từ người dùng
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

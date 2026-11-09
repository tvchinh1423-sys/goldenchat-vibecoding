import type { Conversation, Message } from "./types";
import { STORAGE_KEY } from "./storage";

export const READ_TRACKING_KEY = "omnichat_last_read_v1";

export interface ReadTrackingInfo {
  readAt: number;
  lastMsgId?: string;
  read: boolean;
}

/**
 * Đọc bản đồ theo dõi trạng thái đã đọc từ LocalStorage
 */
export function getReadTrackingMap(): Record<string, ReadTrackingInfo | string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(READ_TRACKING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Ghi nhận một cuộc trò chuyện đã được nhân viên đọc tại thời điểm cụ thể
 */
export function saveReadTracking(
  conversationId: string,
  lastMessageId?: string,
  readAt?: number
): void {
  if (typeof window === "undefined" || !conversationId) return;
  try {
    const map = getReadTrackingMap();
    map[conversationId] = {
      readAt: readAt || Date.now(),
      lastMsgId: lastMessageId,
      read: true,
    };
    localStorage.setItem(READ_TRACKING_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Kiểm tra xem một cuộc trò chuyện đã được đọc hay chưa:
 * 1. Nếu không có tin nhắn hoặc tin nhắn cuối cùng do Bot / Nhân viên gửi -> LUÔN LÀ ĐÃ ĐỌC (unread = 0).
 * 2. Nếu đã được nhân viên mở đọc tại thời điểm T, và không có tin nhắn mới nào từ khách sau T -> ĐÃ ĐỌC.
 * 3. Nếu tin nhắn cuối khớp với lastMsgId đã lưu -> ĐÃ ĐỌC.
 */
export function isConversationRead(
  conv: Conversation | any,
  readMap?: Record<string, ReadTrackingInfo | string>
): boolean {
  if (!conv) return true;
  if (conv.status === "archived") return true;

  const msgs = Array.isArray(conv.messages) ? conv.messages : [];
  const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

  // QUY TẮC VÀNG 1: Nếu không có tin nhắn, hoặc tin nhắn cuối do Bot / Nhân viên gửi
  // (khách hàng không đang đợi trả lời) -> Luôn coi là ĐÃ ĐỌC!
  if (!lastMsg || lastMsg.sender !== "customer") {
    return true;
  }

  const map = readMap || getReadTrackingMap();
  const tracking = map[conv.id];

  // Nếu chưa có tracking trong map
  if (!tracking) {
    return typeof conv.unread === "number" ? conv.unread === 0 : false;
  }

  // Tracking dạng string tương thích phiên bản cũ
  if (typeof tracking === "string") {
    if (tracking === "read" || (lastMsg.id && tracking === lastMsg.id)) {
      return true;
    }
  }

  // Tracking dạng Object với thời gian readAt
  if (typeof tracking === "object" && tracking !== null) {
    if (tracking.lastMsgId && lastMsg.id && tracking.lastMsgId === lastMsg.id) {
      return true;
    }
    if (tracking.readAt) {
      const msgTime = Date.parse(lastMsg.createdAt || "0");
      if (!Number.isNaN(msgTime) && msgTime <= tracking.readAt) {
        return true;
      }
    }
    if (tracking.read === true && !tracking.readAt && !tracking.lastMsgId) {
      return true;
    }
  }

  return false;
}

/**
 * Chuẩn hóa danh sách hội thoại: Ép unread = 0 nếu hội thoại đã được đọc
 */
export function applyReadTracking(
  convs: Conversation[],
  readMap?: Record<string, ReadTrackingInfo | string>
): Conversation[] {
  const map = readMap || getReadTrackingMap();
  return convs.map((c) => {
    if (isConversationRead(c, map)) {
      if (c.unread !== 0) {
        return { ...c, unread: 0 };
      }
      return c;
    }

    // Nếu là hội thoại chưa đọc và có tin nhắn mới từ khách hàng
    const msgs = Array.isArray(c.messages) ? c.messages : [];
    const tracking = map[c.id];
    const readAt =
      typeof tracking === "object" && tracking?.readAt ? tracking.readAt : 0;
    
    if (readAt > 0) {
      const newCustomerMsgs = msgs.filter(
        (m: Message) =>
          m &&
          m.sender === "customer" &&
          Date.parse(m.createdAt || "0") > readAt
      );
      const calculatedUnread =
        newCustomerMsgs.length > 0 ? newCustomerMsgs.length : (c.unread > 0 ? c.unread : 1);
      if (c.unread !== calculatedUnread) {
        return { ...c, unread: calculatedUnread };
      }
    }

    return c;
  });
}

/**
 * Đếm số lượng CUỘC TRÒ CHUYỆN CHƯA ĐỌC (Mỗi cuộc trò chuyện chưa đọc tính là 1,
 * KHÔNG cộng dồn tổng số lượng tin nhắn)
 */
export function getUnreadConversationsCount(
  conversations: Conversation[],
  readMap?: Record<string, ReadTrackingInfo | string>
): number {
  if (!Array.isArray(conversations)) return 0;
  const map = readMap || getReadTrackingMap();

  let unreadConversations = 0;
  for (const c of conversations) {
    if (c && c.status !== "archived") {
      if (!isConversationRead(c, map)) {
        unreadConversations += 1;
      }
    }
  }
  return unreadConversations;
}

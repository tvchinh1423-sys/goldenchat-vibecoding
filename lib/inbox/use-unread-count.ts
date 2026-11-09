import { useState, useEffect } from "react";
import { STORAGE_KEY } from "./storage";
import { updateAppBadge } from "@/lib/notifications";
import {
  getReadTrackingMap,
  getUnreadConversationsCount,
} from "./read-tracker";

/**
 * Tính toán số lượng CUỘC TRÒ CHUYỆN CHƯA ĐỌC thực tế từ các hội thoại đang hoạt động.
 * QUY TẮC BẮT BUỘC:
 * - Số đỏ chỉ hiển thị số lượng CUỘC TRÒ CHUYỆN chưa đọc (mỗi cuộc trò chuyện tính là 1),
 *   KHÔNG tính tổng số tin nhắn chưa đọc.
 * - Nếu tin nhắn cuối đã đọc hoặc do bot/nhân viên gửi thì hội thoại đó đã xong, không đếm chưa đọc.
 */
export function getInboxUnreadCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const conversations = Array.isArray(parsed?.conversations)
      ? parsed.conversations
      : [];

    const readMap = getReadTrackingMap();
    return getUnreadConversationsCount(conversations, readMap);
  } catch {
    return 0;
  }
}

/**
 * Hook theo dõi số cuộc trò chuyện chưa đọc thực tế theo thời gian thực (Real-time Unread Conversations Count)
 * Tự động cập nhật khi có tin nhắn mới hoặc khi người dùng mở đọc tin nhắn
 */
export function useInboxUnreadCount(): number {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      const count = getInboxUnreadCount();
      setUnreadCount(count);
      try {
        updateAppBadge(count);
      } catch {}
    };

    // Đọc số lượng thực tế ban đầu
    update();

    // Lắng nghe các sự kiện cập nhật hội thoại từ các luồng khác nhau
    window.addEventListener("storage", update);
    window.addEventListener("omnichat-inbox-updated", update);
    window.addEventListener("omnichat-inbox-cleared", update);
    window.addEventListener("omnichat-demo-restored", update);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("omnichat-widget-sync");
        bc.onmessage = () => update();
      }
    } catch {}

    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("omnichat-inbox-updated", update);
      window.removeEventListener("omnichat-inbox-cleared", update);
      window.removeEventListener("omnichat-demo-restored", update);
      if (bc) bc.close();
    };
  }, []);

  return unreadCount;
}

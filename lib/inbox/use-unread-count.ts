import { useState, useEffect } from "react";
import { STORAGE_KEY } from "./storage";
import { updateAppBadge } from "@/lib/notifications";

/**
 * Tính toán tổng số tin nhắn chưa đọc thực tế từ các hội thoại đang hoạt động (không tính lưu trữ)
 * Bảo vệ triệt để: Nếu tin nhắn cuối đã đọc hoặc do shop gửi thì không bao giờ đếm là chưa đọc.
 */
export function getInboxUnreadCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const conversations = Array.isArray(parsed?.conversations) ? parsed.conversations : [];

    let readMap: Record<string, string> = {};
    try {
      const rawMap = localStorage.getItem("omnichat_last_read_v1");
      if (rawMap) readMap = JSON.parse(rawMap);
    } catch {}
    
    return conversations.reduce((sum: number, c: any) => {
      if (c && c.status !== "archived") {
        const msgs = Array.isArray(c.messages) ? c.messages : [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

        // Nếu tin nhắn cuối đã nằm trong danh sách đã đọc hoặc do shop/bot gửi: unread = 0
        if (lastMsg && (readMap[c.id] === lastMsg.id || lastMsg.sender !== "customer")) {
          return sum;
        }

        const unread = typeof c.unread === "number" && c.unread > 0 ? c.unread : 0;
        return sum + unread;
      }
      return sum;
    }, 0);
  } catch {
    return 0;
  }
}

/**
 * Hook theo dõi số tin nhắn chưa đọc thực tế theo thời gian thực (Real-time Unread Count)
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

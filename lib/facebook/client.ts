import type { Conversation, Message } from "@/lib/inbox/types";

export const FB_PAGE_ID =
  process.env.FB_PAGE_ID ||
  process.env.FACEBOOK_PAGE_ID ||
  "1394308590434958";

export const FB_PAGE_ACCESS_TOKEN =
  process.env.FB_PAGE_ACCESS_TOKEN ||
  process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
  "EAAVpOzSTwMsBSz8lGvACq0KGly3h5EFVZCA9s1xRPD9lces8mKLdliDoNqtnV39eggxpMGA3PBvaBEQajKAuwuCXMx2ay05v4LfiXvwZCOlWMrSQ7RkJUoZCclY3gRAXLpJ1vXVyk0XL2ZBDoGyFyjQlboidKQZC0IvqQxY8QK93Rm4WqHrItnrv4qDsixH9TYusCZAwZDZD";

export const FB_VERIFY_TOKEN =
  process.env.FB_VERIFY_TOKEN ||
  process.env.FACEBOOK_VERIFY_TOKEN ||
  "omnichat_verify_2026";

/** Cache ngắn trong bộ nhớ serverless để chống rate-limit khi nhiều client poll liên tục */
let cachedLiveConversations: {
  timestamp: number;
  data: Conversation[];
} | null = null;
const CACHE_TTL_MS = 2500; // 2.5 giây

/**
 * Gửi tin nhắn từ OmniChat về trực tiếp Messenger của khách hàng qua Facebook Graph API
 */
export async function sendFacebookMessage(recipientId: string, text: string) {
  const cleanId = recipientId.replace(/^facebook-/, "").replace(/^t_/, "");
  if (!cleanId || !text.trim()) {
    throw new Error("Thiếu recipientId hoặc nội dung tin nhắn");
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: cleanId },
        messaging_type: "RESPONSE",
        message: { text: text.trim() },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("Facebook Send Error:", data);
    throw new Error(data.error?.message || "Lỗi gửi tin nhắn qua Meta Graph API");
  }

  // Xóa cache để lần sync tiếp theo nạp ngay tin nhắn mới gửi
  cachedLiveConversations = null;
  return data;
}

/**
 * Đọc toàn bộ danh sách hội thoại và tin nhắn thật từ Facebook Fanpage
 */
export async function fetchFacebookConversations(): Promise<Conversation[]> {
  const now = Date.now();
  if (cachedLiveConversations && now - cachedLiveConversations.timestamp < CACHE_TTL_MS) {
    return cachedLiveConversations.data;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/me/conversations?fields=id,updated_time,participants,unread_count,messages.limit(50){id,message,from,created_time}&access_token=${FB_PAGE_ACCESS_TOKEN}`;
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("Không thể tải Facebook Conversations:", res.status, res.statusText);
      return cachedLiveConversations?.data || [];
    }

    const json = await res.json();
    const threads = json?.data;
    if (!Array.isArray(threads)) {
      return cachedLiveConversations?.data || [];
    }

    const conversations: Conversation[] = [];

    for (const item of threads) {
      const parts = item?.participants?.data || [];
      const customer =
        parts.find((p: any) => String(p?.id) !== String(FB_PAGE_ID)) || parts[0];

      if (!customer || !customer.id) continue;

      const rawMessages = item?.messages?.data || [];
      // Đảo chiều mảng messages để tin nhắn cũ ở trên, mới nhất ở dưới
      const sortedRaw = [...rawMessages].reverse();

      const messages: Message[] = [];
      for (const m of sortedRaw) {
        const text = m?.message?.trim();
        if (!text) continue;

        const isPage = String(m?.from?.id) === String(FB_PAGE_ID);
        const createdAt = m?.created_time
          ? new Date(m.created_time).toISOString()
          : new Date().toISOString();

        messages.push({
          id: m.id || `fb-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: isPage ? "bot" : "customer",
          content: text,
          createdAt,
        });
      }

      if (messages.length === 0) continue;

      const customerId = String(customer.id);
      const customerName =
        customer.name?.trim() || `Khách Facebook (${customerId.slice(-4)})`;

      conversations.push({
        id: `facebook-${customerId}`,
        name: customerName,
        channel: "facebook",
        avatarColor: "sky",
        status: "active",
        aiEnabled: true,
        assignedTo: "unassigned",
        unread: typeof item.unread_count === "number" ? item.unread_count : 0,
        note: `Hội thoại Fanpage Messenger (Thread: ${item.id})`,
        messages,
      });
    }

    cachedLiveConversations = {
      timestamp: now,
      data: conversations,
    };

    return conversations;
  } catch (error) {
    console.error("Lỗi fetchFacebookConversations:", error);
    return cachedLiveConversations?.data || [];
  }
}

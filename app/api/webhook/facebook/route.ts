import { NextRequest, NextResponse } from "next/server";
import { loadCloudStore, updateCloudStore } from "@/lib/sync/store";
import type { Conversation, Message } from "@/lib/inbox/types";

const FB_VERIFY_TOKEN =
  process.env.FB_VERIFY_TOKEN ||
  process.env.FACEBOOK_VERIFY_TOKEN ||
  "omnichat_verify_2026";

/**
 * GET: Xác thực Webhook với Meta for Developers
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === FB_VERIFY_TOKEN) {
    console.log("✅ [Facebook Webhook] Đã xác thực thành công!");
    return new Response(challenge || "VERIFIED", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    {
      status: "ready",
      message: "Facebook Messenger Webhook is alive",
      verify_token: FB_VERIFY_TOKEN,
    },
    { status: 200 }
  );
}

/**
 * POST: Nhận tin nhắn từ Facebook Messenger và gửi câu trả lời tự động qua Graph API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== "page") {
      return NextResponse.json({ status: "IGNORED" }, { status: 200 });
    }

    const pageAccessToken =
      process.env.FB_PAGE_ACCESS_TOKEN ||
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
      "";

    // Duyệt qua tất cả entries
    for (const entry of body.entry || []) {
      const pageId = entry.id;

      for (const messagingEvent of entry.messaging || []) {
        // Bỏ qua tin nhắn do bot gửi (echo) hoặc tin nhắn giao hàng
        if (messagingEvent.message?.is_echo || !messagingEvent.message?.text) {
          continue;
        }

        const senderId = messagingEvent.sender?.id;
        const userText = messagingEvent.message.text.trim();

        if (!senderId || !userText) continue;

        console.log(`📩 [Facebook Webhook] Nhận tin nhắn từ PSID ${senderId}: "${userText}"`);

        // Gọi trực tiếp bộ xử lý NLP & FAQ của OmniChat
        let botReply = "Dạ Golden Palace xin chào Quý khách! Em có thể hỗ trợ tư vấn thực đơn tiệc cưới, giá bàn hay đặt lịch xem sảnh tại 98 Đông A ạ?";
        try {
          const simRes = await fetch(
            `${req.nextUrl.origin}/api/simulator/chat?channel=facebook&message=${encodeURIComponent(
              userText
            )}&sender_id=${senderId}`,
            { method: "GET" }
          );
          if (simRes.ok) {
            const simData = await simRes.json();
            if (simData.reply) {
              botReply = simData.reply;
            }
          }
        } catch (e) {
          console.warn("Lỗi gọi Simulator API:", e);
        }

        // 1. Gửi tin nhắn trả lời ngược lại Facebook Messenger qua Meta Graph API
        if (pageAccessToken) {
          try {
            const fbRes = await fetch(
              `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  messaging_type: "RESPONSE",
                  message: { text: botReply },
                }),
              }
            );
            const fbJson = await fbRes.json();
            console.log("📤 [Facebook Graph API Send]:", fbJson);
          } catch (sendErr) {
            console.error("Lỗi gửi tin qua Meta Graph API:", sendErr);
          }
        } else {
          console.warn(
            "⚠️ Chưa cấu hình FB_PAGE_ACCESS_TOKEN! Tin nhắn đã được xử lý và lưu vào Inbox nhưng chưa gửi ra Messenger qua Graph API."
          );
        }

        // 2. Đồng bộ vào Hộp thư hợp nhất /inbox
        try {
          const store = loadCloudStore();
          const convId = `facebook-${senderId}`;
          const nowIso = new Date().toISOString();

          const custMsg: Message = {
            id: `msg-fb-c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender: "customer",
            content: userText,
            createdAt: nowIso,
          };
          const botMsg: Message = {
            id: `msg-fb-b-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
            sender: "bot",
            content: botReply,
            createdAt: new Date(Date.now() + 500).toISOString(),
          };

          const existing = store.conversations.find((c) => c.id === convId);
          if (existing) {
            existing.messages.push(custMsg, botMsg);
            existing.unread = (existing.unread || 0) + 1;
            existing.status = "active";
          } else {
            store.conversations.unshift({
              id: convId,
              name: `Khách Facebook (${senderId.slice(-4)})`,
              channel: "facebook",
              avatarColor: "bg-blue-600",
              status: "active",
              aiEnabled: true,
              assignedTo: "unassigned",
              unread: 1,
              note: "Tin nhắn trực tiếp qua Meta Webhook",
              messages: [custMsg, botMsg],
            });
          }

          updateCloudStore({ conversations: store.conversations });
        } catch (syncErr) {
          console.warn("Lỗi đồng bộ Cloud Store từ FB Webhook:", syncErr);
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Lỗi xử lý Facebook Webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

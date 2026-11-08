import { NextRequest, NextResponse } from "next/server";
import { loadCloudStore, updateCloudStore } from "@/lib/sync/store";
import {
  FB_VERIFY_TOKEN,
  FB_PAGE_ACCESS_TOKEN,
  sendFacebookMessage,
} from "@/lib/facebook/client";
import { processChatRequest } from "@/app/api/simulator/chat/route";
import type { Message } from "@/lib/inbox/types";

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

    // Duyệt qua tất cả entries
    for (const entry of body.entry || []) {
      for (const messagingEvent of entry.messaging || []) {
        // Bỏ qua tin nhắn do bot gửi (echo)
        if (messagingEvent.message?.is_echo) {
          continue;
        }

        const senderId = messagingEvent.sender?.id;
        const rawText = messagingEvent.message?.text?.trim();
        const hasAttachments = Array.isArray(messagingEvent.message?.attachments) && messagingEvent.message.attachments.length > 0;
        const userText = rawText || (hasAttachments ? "[Hình ảnh/Tệp đính kèm]" : "");

        if (!senderId || !userText) continue;

        console.log(`📩 [Facebook Webhook] Nhận tin từ PSID ${senderId}: "${userText}"`);

        const convId = `facebook-${senderId}`;
        const store = loadCloudStore();
        const existing = store.conversations.find((c) => c.id === convId);

        // Kiểm tra xem hội thoại này AI có đang bật không (nếu nhân viên tắt AI thì không tự động trả lời)
        const isAiEnabled = existing ? existing.aiEnabled !== false : true;

        let botReply = "";

        if (isAiEnabled) {
          botReply =
            "Dạ Golden Palace xin chào Quý khách! Em có thể hỗ trợ tư vấn thực đơn tiệc cưới, giá bàn hay đặt lịch xem sảnh tại 98 Đông A ạ?";
          try {
            const simRes = await processChatRequest({
              channel: "facebook",
              message: userText,
              sender_id: senderId,
            });
            const simData = await simRes.json();
            if (simData?.reply) {
              botReply = simData.reply;
            }
          } catch (e) {
            console.warn("Lỗi xử lý chatbot FAQ:", e);
          }

          // 1. Gửi tin nhắn trả lời ngược lại Facebook Messenger qua Meta Graph API
          try {
            await sendFacebookMessage(senderId, botReply);
            console.log(`📤 [Facebook Webhook] Đã gửi trả lời tự động cho PSID ${senderId}`);
          } catch (sendErr) {
            console.error("Lỗi gửi tin qua Meta Graph API:", sendErr);
          }
        } else {
          console.log(`ℹ️ [Facebook Webhook] AI đang tắt cho ${convId}, nhân viên tiếp quản thủ công.`);
        }

        // 2. Đồng bộ tin nhắn vào Cloud Store
        try {
          const nowIso = new Date().toISOString();
          const custMsg: Message = {
            id: `msg-fb-c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender: "customer",
            content: userText,
            createdAt: nowIso,
          };

          const newMessages: Message[] = [custMsg];
          if (isAiEnabled && botReply) {
            newMessages.push({
              id: `msg-fb-b-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
              sender: "bot",
              content: botReply,
              createdAt: new Date(Date.now() + 500).toISOString(),
            });
          }

          if (existing) {
            existing.messages.push(...newMessages);
            existing.unread = (existing.unread || 0) + 1;
            existing.status = "active";
          } else {
            store.conversations.unshift({
              id: convId,
              name: `Khách Facebook (${senderId.slice(-4)})`,
              channel: "facebook",
              avatarColor: "sky",
              status: "active",
              aiEnabled: isAiEnabled,
              assignedTo: "unassigned",
              unread: 1,
              note: "Tin nhắn trực tiếp qua Meta Webhook",
              messages: newMessages,
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

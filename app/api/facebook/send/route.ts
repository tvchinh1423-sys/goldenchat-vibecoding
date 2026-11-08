import { NextRequest, NextResponse } from "next/server";
import { sendFacebookMessage } from "@/lib/facebook/client";
import { loadCloudStore, updateCloudStore } from "@/lib/sync/store";
import type { Message } from "@/lib/inbox/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipientId, message, conversationId } = body || {};

    if (!recipientId || !message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Thiếu recipientId hoặc nội dung tin nhắn" },
        { status: 400 }
      );
    }

    const cleanPsid = recipientId.replace(/^facebook-/, "").replace(/^t_/, "");
    const sendResult = await sendFacebookMessage(cleanPsid, message.trim());

    // Cập nhật tin nhắn vừa gửi vào Cloud Store
    try {
      const convId = conversationId || `facebook-${cleanPsid}`;
      const store = loadCloudStore();
      const existing = store.conversations.find((c) => c.id === convId);

      const agentMsg: Message = {
        id: sendResult.message_id || `fb-agent-${Date.now()}`,
        sender: "agent",
        content: message.trim(),
        createdAt: new Date().toISOString(),
      };

      if (existing) {
        existing.messages.push(agentMsg);
        existing.aiEnabled = false; // Nhân viên can thiệp thì tạm tắt bot auto
        existing.status = "active";
      } else {
        store.conversations.unshift({
          id: convId,
          name: `Khách Facebook (${cleanPsid.slice(-4)})`,
          channel: "facebook",
          avatarColor: "sky",
          status: "active",
          aiEnabled: false,
          assignedTo: "me",
          unread: 0,
          note: "Tin nhắn gửi từ Hộp thư OmniChat",
          messages: [agentMsg],
        });
      }

      updateCloudStore({ conversations: store.conversations });
    } catch (e) {
      console.warn("Lưu tin nhắn gửi vào cloud store:", e);
    }

    return NextResponse.json({
      success: true,
      messageId: sendResult.message_id,
      recipientId: cleanPsid,
    });
  } catch (error: any) {
    console.error("Lỗi gửi tin nhắn Facebook từ Hộp thư:", error);
    return NextResponse.json(
      { error: error?.message || "Không thể gửi tin nhắn qua Facebook Messenger" },
      { status: 500 }
    );
  }
}

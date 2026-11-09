import { NextRequest, NextResponse } from "next/server";
import { loadCloudStore, updateCloudStore, saveCloudStore } from "@/lib/sync/store";
import { fetchFacebookConversations } from "@/lib/facebook/client";
import type { Conversation, Message } from "@/lib/inbox/types";

export const dynamic = "force-dynamic";

/**
 * Trộn thông minh tin nhắn Facebook trực tiếp từ Meta Graph API vào danh sách hội thoại
 */
function mergeLiveFacebook(
  conversations: Conversation[],
  liveFb: Conversation[]
): Conversation[] {
  if (!liveFb.length) return conversations;

  const result = [...conversations];
  for (const fb of liveFb) {
    const idx = result.findIndex((c) => c.id === fb.id);
    if (idx >= 0) {
      const existing = result[idx];
      // Ghép tin nhắn deduped
      const mergedMsgs = dedupeMessages(existing.messages, fb.messages);

      // Tìm các tin nhắn mới từ khách hàng mà existing chưa có
      const existingCustomerMsgIds = new Set(
        existing.messages
          .filter((m) => m && m.sender === "customer")
          .map((m) => m.id)
      );
      const newCustomerMsgs = fb.messages.filter(
        (m) => m && m.sender === "customer" && !existingCustomerMsgIds.has(m.id)
      );

      // BẢO TOÀN TRẠNG THÁI ĐÃ ĐỌC (Unread Preservation Guard):
      // Nếu tin nhắn cuối cùng do Bot hoặc Nhân viên gửi: Khách hàng không đợi, unread luôn là 0!
      // Nếu nhân viên trên OmniChat đã đọc (existing.unread === 0) và không có tin mới: unread = 0.
      const lastMergedMsg = mergedMsgs.at(-1);
      let resolvedUnread = 0;
      if (!lastMergedMsg || lastMergedMsg.sender !== "customer") {
        resolvedUnread = 0;
      } else if (typeof existing.unread === "number" && existing.unread === 0) {
        resolvedUnread = newCustomerMsgs.length;
      } else if (newCustomerMsgs.length > 0) {
        resolvedUnread = Math.max(1, (existing.unread || 0) + newCustomerMsgs.length);
      } else {
        resolvedUnread = typeof existing.unread === "number" ? existing.unread : (fb.unread || 0);
      }

      result[idx] = {
        ...existing,
        name: fb.name || existing.name,
        unread: resolvedUnread,
        messages: mergedMsgs,
      };
    } else {
      // Đưa cuộc trò chuyện Facebook thật lên đầu danh sách
      result.unshift(fb);
    }
  }
  return result;
}

function dedupeMessages(current: Message[], incoming: Message[]): Message[] {
  const all = [...current, ...incoming];
  const unique: Message[] = [];

  for (const m of all) {
    if (!m || !m.content) continue;
    const exists = unique.some((u) => {
      if (u.id === m.id) return true;
      if (
        u.sender === m.sender &&
        u.content.trim() === m.content.trim() &&
        Math.abs(Date.parse(u.createdAt) - Date.parse(m.createdAt)) < 15000
      ) {
        return true;
      }
      return false;
    });
    if (!exists) {
      unique.push(m);
    }
  }

  return unique.sort(
    (a, b) => Date.parse(a.createdAt || "0") - Date.parse(b.createdAt || "0")
  );
}

export async function GET(req: NextRequest) {
  try {
    const store = loadCloudStore();
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get("since") || "0", 10);

    // Đồng bộ trực tiếp các cuộc trò chuyện thật từ Facebook Fanpage Messenger
    let liveFb: Conversation[] = [];
    try {
      liveFb = await fetchFacebookConversations();
    } catch (fbErr) {
      console.warn("Không thể fetch trực tiếp từ Facebook:", fbErr);
    }

    let hasFbChanges = false;
    if (liveFb.length > 0) {
      const prevMsgsCount = store.conversations
        .filter((c) => c.channel === "facebook")
        .reduce((sum, c) => sum + c.messages.length, 0);
      const newMsgsCount = liveFb.reduce((sum, c) => sum + c.messages.length, 0);

      store.conversations = mergeLiveFacebook(store.conversations, liveFb);

      if (newMsgsCount !== prevMsgsCount || store.conversations.length !== (store as any).__last_conv_count) {
        store.revision += 1;
        hasFbChanges = true;
        (store as any).__last_conv_count = store.conversations.length;
        saveCloudStore(store);
      }
    }

    // Nếu client hỏi kể từ revision cũ và không có thay đổi nào, trả về modified: false
    if (since > 0 && since >= store.revision && !hasFbChanges && !searchParams.get("force")) {
      return NextResponse.json({
        modified: false,
        revision: store.revision,
      });
    }

    return NextResponse.json({
      modified: true,
      revision: store.revision,
      lastUpdated: store.lastUpdated,
      crm: store.crm,
      conversations: store.conversations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi đọc dữ liệu đồng bộ" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateCloudStore(body);

    return NextResponse.json({
      success: true,
      revision: updated.revision,
      lastUpdated: updated.lastUpdated,
      crm: updated.crm,
      conversations: updated.conversations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi lưu dữ liệu đồng bộ" },
      { status: 500 }
    );
  }
}

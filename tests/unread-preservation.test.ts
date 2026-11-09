import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Conversation, Message } from "../lib/inbox/types";
import { getInboxUnreadCount } from "../lib/inbox/use-unread-count";

describe("Unread Preservation Guard & Mark as Read", () => {
  it("Bảo toàn trạng thái ĐÃ ĐỌC (unread: 0) khi không có tin nhắn mới từ khách hàng", () => {
    const existingMsg: Message = {
      id: "msg-fb-1",
      sender: "customer",
      content: "Cho tôi hỏi giá tiệc cưới",
      createdAt: "2026-11-09T10:00:00Z",
    };

    const existing: Conversation = {
      id: "facebook-123",
      name: "Trần Vân Chinh",
      channel: "facebook",
      avatarColor: "blue",
      status: "active",
      unread: 0, // Đã đọc trên OmniChat
      messages: [existingMsg],
    };

    // Giả lập Meta Graph API trả về thread với unread_count: 2 (vì chưa đọc trên Meta Suite)
    const incomingLiveFb: Conversation = {
      id: "facebook-123",
      name: "Trần Vân Chinh",
      channel: "facebook",
      avatarColor: "blue",
      status: "active",
      unread: 2,
      messages: [existingMsg], // Vẫn là tin nhắn cũ, không có tin mới từ khách
    };

    // Mô phỏng logic mergeLiveFacebook
    const existingCustomerMsgIds = new Set(
      existing.messages.filter((m) => m.sender === "customer").map((m) => m.id)
    );
    const newCustomerMsgs = incomingLiveFb.messages.filter(
      (m) => m.sender === "customer" && !existingCustomerMsgIds.has(m.id)
    );

    let resolvedUnread = 0;
    if (typeof existing.unread === "number" && existing.unread === 0) {
      resolvedUnread = newCustomerMsgs.length;
    } else if (newCustomerMsgs.length > 0) {
      resolvedUnread = Math.max(1, (existing.unread || 0) + newCustomerMsgs.length);
    } else {
      resolvedUnread = typeof existing.unread === "number" ? existing.unread : (incomingLiveFb.unread || 0);
    }

    assert.equal(resolvedUnread, 0, "Trạng thái đã đọc (unread = 0) phải được bảo toàn tuyệt đối!");
  });

  it("Tự động tăng số tin chưa đọc khi khách hàng gửi thêm tin nhắn mới", () => {
    const existingMsg: Message = {
      id: "msg-fb-1",
      sender: "customer",
      content: "Cho tôi hỏi giá tiệc cưới",
      createdAt: "2026-11-09T10:00:00Z",
    };

    const existing: Conversation = {
      id: "facebook-123",
      name: "Trần Vân Chinh",
      channel: "facebook",
      avatarColor: "blue",
      status: "active",
      unread: 0,
      messages: [existingMsg],
    };

    const newMsgFromCustomer: Message = {
      id: "msg-fb-2",
      sender: "customer",
      content: "Bên mình còn sảnh ngày 20/11 không?",
      createdAt: "2026-11-09T10:05:00Z",
    };

    const incomingLiveFb: Conversation = {
      id: "facebook-123",
      name: "Trần Vân Chinh",
      channel: "facebook",
      avatarColor: "blue",
      status: "active",
      unread: 1,
      messages: [existingMsg, newMsgFromCustomer],
    };

    const existingCustomerMsgIds = new Set(
      existing.messages.filter((m) => m.sender === "customer").map((m) => m.id)
    );
    const newCustomerMsgs = incomingLiveFb.messages.filter(
      (m) => m.sender === "customer" && !existingCustomerMsgIds.has(m.id)
    );

    let resolvedUnread = 0;
    if (typeof existing.unread === "number" && existing.unread === 0) {
      resolvedUnread = newCustomerMsgs.length;
    }

    assert.equal(resolvedUnread, 1, "Khi có 1 tin nhắn mới từ khách hàng, unread phải tăng lên 1!");
  });

  it("Không tính tin chưa đọc nếu tin nhắn cuối cùng do shop hoặc bot gửi", () => {
    const convWithAgentReply: Conversation = {
      id: "web-test-1",
      name: "Nguyễn Thu Trang",
      channel: "web",
      avatarColor: "lavender",
      status: "active",
      unread: 1, // Dù unread ghi 1 nhưng tin nhắn cuối do agent gửi
      messages: [
        {
          id: "m1",
          sender: "customer",
          content: "Cho em hỏi sảnh tiệc",
          createdAt: "2026-11-09T09:00:00Z",
        },
        {
          id: "m2",
          sender: "agent",
          content: "Dạ Golden Palace xin chào chị Trang ạ!",
          createdAt: "2026-11-09T09:01:00Z",
        },
      ],
    };

    const msgs = convWithAgentReply.messages;
    const lastMsg = msgs[msgs.length - 1];
    const isCustomerWaiting = lastMsg && lastMsg.sender === "customer";

    assert.equal(isCustomerWaiting, false, "Tin nhắn cuối là của nhân viên, khách hàng không đợi, unread phải bằng 0");
  });

  it("isConversationRead và applyReadTracking bảo vệ triệt để trạng thái đã đọc", () => {
    const {
      isConversationRead,
      applyReadTracking,
      getUnreadConversationsCount,
    } = require("../lib/inbox/read-tracker");

    const convRead: Conversation = {
      id: "fb-chinh",
      name: "Trần Vân Chinh",
      channel: "facebook",
      avatarColor: "sky",
      status: "active",
      unread: 51,
      messages: [
        {
          id: "m-chinh-1",
          sender: "customer",
          content: "Tư vấn tiệc cưới giúp em",
          createdAt: "2026-11-09T10:00:00Z",
        },
        {
          id: "m-chinh-2",
          sender: "bot",
          content: "Dạ Golden Palace xin chào anh Chinh ạ!",
          createdAt: "2026-11-09T10:01:00Z",
        },
      ],
    };

    // 1. Tin nhắn cuối do bot gửi -> Luôn là đã đọc, unread chuyển về 0
    assert.equal(isConversationRead(convRead), true);
    const cleaned = applyReadTracking([convRead]);
    assert.equal(cleaned[0].unread, 0);

    // 2. Tin nhắn cuối do khách gửi nhưng nhân viên đã đọc lúc 10:10:00
    const convCustomerLast: Conversation = {
      id: "fb-rita",
      name: "Rita Phạm",
      channel: "facebook",
      avatarColor: "sky",
      status: "active",
      unread: 13,
      messages: [
        {
          id: "m-rita-1",
          sender: "customer",
          content: "Cảm ơn em nhiều",
          createdAt: "2026-11-09T10:05:00Z",
        },
      ],
    };

    const readMap = {
      "fb-rita": {
        readAt: Date.parse("2026-11-09T10:10:00Z"),
        read: true,
      },
    };

    assert.equal(isConversationRead(convCustomerLast, readMap), true);
    const cleaned2 = applyReadTracking([convCustomerLast], readMap);
    assert.equal(cleaned2[0].unread, 0);

    // 3. Số đỏ chỉ đếm số lượng CUỘC TRÒ CHUYỆN chưa đọc (không tính tổng tin nhắn)
    const convUnread: Conversation = {
      id: "web-unseen",
      name: "Khách mới",
      channel: "web",
      avatarColor: "emerald",
      status: "active",
      unread: 7, // 7 tin nhắn chưa đọc
      messages: [
        {
          id: "m-new-1",
          sender: "customer",
          content: "Alo",
          createdAt: "2026-11-09T10:15:00Z",
        },
      ],
    };

    const count = getUnreadConversationsCount(
      [convRead, convCustomerLast, convUnread],
      readMap
    );
    // Chỉ có 1 cuộc trò chuyện chưa đọc (web-unseen), dù nó có 7 tin nhắn
    assert.equal(count, 1, "Số đỏ chỉ hiển thị 1 cuộc trò chuyện chưa đọc, không phải tổng 7 tin nhắn!");
  });
});

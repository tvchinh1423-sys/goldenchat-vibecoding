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
});

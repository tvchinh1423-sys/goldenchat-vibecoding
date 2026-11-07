import test from "node:test";
import assert from "node:assert/strict";
import { loadCloudStore, updateCloudStore } from "../lib/sync/store";

test("Cloud Store loads initial demo data and increments revision on updates", () => {
  const initial = loadCloudStore();
  assert.ok(initial.revision >= 1);
  assert.ok(initial.crm.leads.length > 0);
  assert.ok(initial.conversations.length > 0);

  const prevRev = initial.revision;
  const updated = updateCloudStore({
    crm: {
      leads: [
        {
          id: "test-cloud-lead-1",
          full_name: "Nguyễn Đồng Bộ",
          phone: "0912345678",
          email: "dongbo@example.com",
          notes: "Thử nghiệm sync đa thiết bị",
          source: "web",
          stage: "N1",
          assigned_to: "Ngọc Khánh",
          event_date: "",
          table_count: null,
          created_at: new Date().toISOString(),
          last_touched_at: new Date().toISOString(),
          inbox_reference: null,
        },
      ],
    },
  });

  assert.ok(updated.revision > prevRev);
  const found = updated.crm.leads.find((l) => l.id === "test-cloud-lead-1");
  assert.ok(found);
  assert.equal(found?.full_name, "Nguyễn Đồng Bộ");
});

test("Cloud Store merges incoming conversations without duplicating existing messages", () => {
  const store = loadCloudStore();
  const testConvId = "test-conv-sync";
  const now = new Date().toISOString();

  updateCloudStore({
    conversations: [
      {
        id: testConvId,
        name: "Khách iPhone",
        channel: "web",
        avatarColor: "lavender",
        status: "active",
        aiEnabled: true,
        unread: 0,
        note: "",
        assignedTo: "me",
        messages: [
          {
            id: "msg-sync-1",
            sender: "customer",
            content: "Chào bạn, mình xem sảnh",
            createdAt: now,
          },
        ],
      },
    ],
  });

  // Gửi tiếp tin nhắn thứ hai từ thiết bị khác
  const updated = updateCloudStore({
    conversations: [
      {
        id: testConvId,
        name: "Khách iPhone",
        channel: "web",
        avatarColor: "lavender",
        status: "active",
        aiEnabled: true,
        unread: 1,
        note: "",
        assignedTo: "me",
        messages: [
          {
            id: "msg-sync-1",
            sender: "customer",
            content: "Chào bạn, mình xem sảnh",
            createdAt: now,
          },
          {
            id: "msg-sync-2",
            sender: "bot",
            content: "Dạ em hỗ trợ mình ngay ạ!",
            createdAt: new Date(Date.now() + 1000).toISOString(),
          },
        ],
      },
    ],
  });

  const conv = updated.conversations.find((c) => c.id === testConvId);
  assert.ok(conv);
  assert.equal(conv?.messages.length, 2);
  assert.equal(conv?.messages[0].id, "msg-sync-1");
  assert.equal(conv?.messages[1].id, "msg-sync-2");
});

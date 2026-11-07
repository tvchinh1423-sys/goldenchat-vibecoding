import test from "node:test";
import assert from "node:assert/strict";
import { loadCloudStore, updateCloudStore, resetCloudStore } from "../lib/sync/store";

test("Cloud Store loads initial demo data and increments revision on updates", () => {
  resetCloudStore();
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

test("Cloud Store permanently purges records on deletion with tombstone and replaceCrm", () => {
  // 1. Thêm 1 booking và 1 lead vào store
  const testBookingId = "booking-tombstone-test";
  const testLeadId = "lead-tombstone-test";

  updateCloudStore({
    crm: {
      leads: [
        {
          id: testLeadId,
          full_name: "Khách Sắp Xóa",
          phone: "0999888777",
          email: "",
          notes: "",
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
      bookings: [
        {
          id: testBookingId,
          lead_id: testLeadId,
          appointment_time: "2026-11-20T09:00:00.000Z",
          event_type: "xem_sanh",
          guests_count: 2,
          assigned_staff: "Ngọc Khánh",
          notes: "Lịch hẹn sẽ xóa",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ],
    },
  });

  const beforeStore = loadCloudStore();
  assert.ok(beforeStore.crm.bookings.some((b) => b.id === testBookingId));
  assert.ok(beforeStore.crm.leads.some((l) => l.id === testLeadId));

  // 2. Client gửi xóa với deletedBookingIds và deletedLeadIds
  const afterDelete = updateCloudStore({
    deletedBookingIds: [testBookingId],
    deletedLeadIds: [testLeadId],
  });

  // 3. Đảm bảo bản ghi đã bị xóa triệt để, không còn tồn tại trong cloud store
  assert.equal(afterDelete.crm.bookings.some((b) => b.id === testBookingId), false);
  assert.equal(afterDelete.crm.leads.some((l) => l.id === testLeadId), false);

  // 4. Kiểm tra replaceCrm xóa sạch mảng khi gửi mảng rỗng
  const cleared = updateCloudStore({
    replaceCrm: true,
    crm: {
      leads: [],
      bookings: [],
    },
  });
  assert.equal(cleared.crm.leads.length, 0);
  assert.equal(cleared.crm.bookings.length, 0);
});

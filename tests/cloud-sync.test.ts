import test from "node:test";
import assert from "node:assert/strict";
import { loadCloudStore, updateCloudStore, resetCloudStore } from "../lib/sync/store";
import { mergeCRMSnapshots } from "../lib/crm/client";

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

test("Cloud Store automatically synchronizes customer bookings from conversations to CRM Leads (N3) and Bookings", () => {
  const store = loadCloudStore();
  const testConvId = "web-test-auto-crm";
  const now = new Date().toISOString();

  // Khách Hà My đặt lịch trong hội thoại chat
  updateCloudStore({
    conversations: [
      {
        id: testConvId,
        name: "Hà My (Web Widget)",
        channel: "web",
        avatarColor: "lavender",
        status: "active",
        aiEnabled: true,
        unread: 1,
        note: "Khách đặt lịch xem sảnh 09:00 ngày 15/11",
        assignedTo: "me",
        messages: [
          {
            id: "msg-1",
            sender: "customer",
            content: "Hà My 0947288299",
            createdAt: now,
          },
        ],
        lead: {
          id: "lead-0947288299",
          conversation_id: testConvId,
          full_name: "Hà My",
          phone: "0947288299",
          email: "",
          demand_notes: "Xem sảnh 2 người",
          source: "web",
          status: "new",
          created_at: now,
        },
        booking: {
          appointmentTime: "2026-11-15T09:00:00+07:00",
          staff: "Ngọc Khánh",
          notes: "Xem sảnh 2 người",
        },
      },
    ],
  });

  const fresh = loadCloudStore();
  // Khách hàng Hà My phải lập tức có mặt trong CRM Leads ở Stage N3 (Khảo sát 1-1)
  const lead = fresh.crm.leads.find((l) => l.phone === "0947288299");
  assert.ok(lead, "Hà My phải xuất hiện trong crm.leads");
  assert.equal(lead?.full_name, "Hà My");
  assert.equal(lead?.stage, "N3", "Khách có lịch hẹn phải ở Stage N3");

  // Lịch hẹn phải có trong crm.bookings
  const booking = fresh.crm.bookings.find((b) => b.lead_id === lead?.id);
  assert.ok(booking, "Lịch hẹn của Hà My phải xuất hiện trong crm.bookings");
  assert.equal(booking?.assigned_staff, "Ngọc Khánh");
  assert.ok(booking?.appointment_time.includes("2026-11-15T09:00"));
});

test("mergeCRMSnapshots preserves locally created customer leads and bookings when cloud returns stale data", () => {
  const localSnapshot = {
    leads: [
      {
        id: "lead-local-amy",
        full_name: "Hà My",
        phone: "0947288299",
        email: "",
        notes: "Xem sảnh 2 người",
        source: "web" as const,
        stage: "N3" as const,
        assigned_to: "Ngọc Khánh",
        event_date: "",
        table_count: null,
        created_at: "2026-11-08T10:00:00.000Z",
        last_touched_at: "2026-11-08T10:00:00.000Z",
        inbox_reference: "web-0947288299",
      },
    ],
    bookings: [
      {
        id: "booking-local-amy",
        lead_id: "lead-local-amy",
        appointment_time: "2026-11-15T09:00:00+07:00",
        event_type: "xem_sanh" as const,
        guests_count: 2,
        assigned_staff: "Ngọc Khánh",
        notes: "Xem sảnh",
        status: "pending" as const,
        created_at: "2026-11-08T10:00:00.000Z",
      },
    ],
  };

  // Cloud store cũ chỉ có Hoàng Thùy Dương, chưa có Hà My
  const cloudSnapshot = {
    leads: [
      {
        id: "lead-web-duong",
        full_name: "Hoàng Thùy Dương",
        phone: "0918234567",
        email: "duong@example.com",
        notes: "Tiệc 35 bàn",
        source: "web" as const,
        stage: "N3" as const,
        assigned_to: "Ngọc Khánh",
        event_date: "",
        table_count: 35,
        created_at: "2026-11-07T08:00:00.000Z",
        last_touched_at: "2026-11-07T08:00:00.000Z",
        inbox_reference: "web-duong",
      },
    ],
    bookings: [
      {
        id: "booking-web-duong",
        lead_id: "lead-web-duong",
        appointment_time: "2026-11-12T09:30:00+07:00",
        event_type: "xem_sanh" as const,
        guests_count: 4,
        assigned_staff: "Ngọc Khánh",
        notes: "Xem sảnh",
        status: "pending" as const,
        created_at: "2026-11-07T08:00:00.000Z",
      },
    ],
  };

  const merged = mergeCRMSnapshots(localSnapshot, cloudSnapshot);

  // Cả Hà My và Hoàng Thùy Dương đều phải được bảo toàn 100%
  assert.equal(merged.leads.length, 2);
  assert.ok(merged.leads.some((l) => l.full_name === "Hà My" && l.phone === "0947288299"));
  assert.ok(merged.leads.some((l) => l.full_name === "Hoàng Thùy Dương" && l.phone === "0918234567"));

  // Cả 2 lịch hẹn đều tồn tại
  assert.equal(merged.bookings.length, 2);
  assert.ok(merged.bookings.some((b) => b.id === "booking-local-amy"));
  assert.ok(merged.bookings.some((b) => b.id === "booking-web-duong"));
});

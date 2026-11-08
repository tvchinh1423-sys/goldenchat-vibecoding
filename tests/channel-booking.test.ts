import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { getSmartBookingDefault } from "../lib/crm/appointment";
import { visitIntent } from "../lib/chat/follow-ups";
import { seedCRM, deleteDemoBooking, deleteDemoLead } from "../lib/crm/demo-store";
import { CRMError } from "../lib/crm/model";
import { GET as getBotcakeWebhook, POST as postBotcakeWebhook } from "../app/api/webhook/botcake/route";
import { POST as postTelegramAlert } from "../app/api/telegram/alert/route";
import { DELETE as deleteBookingRoute } from "../app/api/crm/bookings/[id]/route";
import { DELETE as deleteLeadRoute } from "../app/api/crm/leads/[id]/route";
import { CRM_COOKIE, issueSession } from "../lib/crm/server";

test("getSmartBookingDefault returns 09:00 formatted datetime string", () => {
  assert.equal(getSmartBookingDefault(Date.parse("2026-11-06T01:59:00Z")), "2026-11-06T09:00");
  assert.equal(getSmartBookingDefault(Date.parse("2026-11-06T02:00:00Z")), "2026-11-07T09:00");
  assert.equal(getSmartBookingDefault(Date.parse("2026-11-06T19:00:00Z")), "2026-11-07T09:00");
});

test("visit intent distinguishes an appointment from asking for venue photos", () => {
  assert.equal(visitIntent("Anh muốn đặt lịch xem sảnh"), "xem_sanh");
  assert.equal(visitIntent("chị muốn đặt lịch"), "xem_sanh");
  assert.equal(visitIntent("em muốn book lịch tư vấn"), "xem_sanh");
  assert.equal(visitIntent("mai tôi qua xem sảnh"), "xem_sanh");
  assert.equal(visitIntent("Chị muốn hẹn thử món"), "thu_mon");
  assert.equal(visitIntent("Cho tôi xem ảnh sảnh tiệc"), undefined);
  assert.equal(visitIntent("Tôi muốn hủy lịch thử món"), undefined);
  // Không nhầm lẫn với câu hỏi đặt cọc giữ sảnh
  assert.equal(visitIntent("Đặt cọc giữ sảnh bao nhiêu?"), undefined);
  assert.equal(visitIntent("Đặt cọc lần 1 là bao nhiêu"), undefined);
});

test("deleteDemoBooking removes targeted booking and raises error if not found", () => {
  const snapshot = seedCRM();
  assert.equal(snapshot.bookings.length, 1);
  const targetId = snapshot.bookings[0].id;

  const nextSnapshot = deleteDemoBooking(snapshot, targetId);
  assert.equal(nextSnapshot.bookings.length, 0);

  // Thử xóa lại id đã mất -> ném lỗi 404
  assert.throws(() => deleteDemoBooking(nextSnapshot, targetId), CRMError);
});

test("Botcake Webhook GET handles verify token subscription", async () => {
  const reqValid = new NextRequest(
    "http://localhost:3000/api/webhook/botcake?hub.mode=subscribe&hub.verify_token=omnichat_kstudy_vibecoding_2026&hub.challenge=test_challenge_123"
  );
  const resValid = await getBotcakeWebhook(reqValid);
  assert.equal(resValid.status, 200);
  const text = await resValid.text();
  assert.equal(text, "test_challenge_123");

  const reqStatus = new NextRequest("http://localhost:3000/api/webhook/botcake");
  const resStatus = await getBotcakeWebhook(reqStatus);
  assert.equal(resStatus.status, 200);
  const data = await resStatus.json();
  assert.equal(data.status, "ready");
});

test("Botcake Webhook POST reads custom and Messenger-style Facebook events", async () => {
  const sender = { id: "demo-fb-01" };
  const message = { text: "Hotline Golden Palace là gì?" };
  const events = [
    { platform: "facebook", sender, message },
    { object: "page", entry: [{ messaging: [{ sender, message }] }] },
  ];

  for (const body of events) {
    const res = await postBotcakeWebhook(new NextRequest("http://localhost:3000/api/webhook/botcake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.platform, "facebook");
    assert.equal(json.data.externalThreadId, sender.id);
    assert.equal(json.data.messageReceived, message.text);
    assert.ok(json.data.botReply.trim());
  }
});

test("Botcake Webhook POST reads a Zalo customer phone", async () => {
  const req = new NextRequest("http://localhost:3000/api/webhook/botcake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "zalo",
      customer: { name: "Nguyễn Văn Test", phone: "0987654321" },
      message: { text: "Cho tôi hỏi thực đơn tiệc cưới bao nhiêu một bàn?" },
    }),
  });
  const res = await postBotcakeWebhook(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.botReply.length > 0);
  assert.equal(json.data.customerPhone, "0987654321");
});

test("Chat API automatically syncs Facebook Messenger conversations into Cloud Store Inbox", async () => {
  const { GET: getChat } = await import("@/app/api/simulator/chat/route");
  const { loadCloudStore } = await import("@/lib/sync/store");

  const req = new NextRequest(
    "http://localhost:3000/api/simulator/chat?channel=facebook&message=Nhà%20hàng%20có%20mấy%20sảnh%20tiệc&sender_name=Trần%20Văn%20Chinh&sender_id=chinh_fb_test_123"
  );
  const res = await getChat(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.messages));
  assert.ok(json.messages[0].text.length > 0);

  // Kiểm tra đã sync vào Inbox
  const store = loadCloudStore();
  const foundConv = store.conversations.find((c) => c.id.includes("chinh_fb_test_123"));
  assert.ok(foundConv, "Phải tìm thấy conversation trong Inbox");
  assert.equal(foundConv.channel, "facebook");
  assert.equal(foundConv.name, "Trần Văn Chinh");
  assert.ok(foundConv.messages.some((m) => m.content.includes("Nhà hàng có mấy sảnh tiệc")));
});

test("Telegram Alert API validates tokens and returns structured responses", async () => {
  // Test không có token/chatId
  const reqNoAuth = new NextRequest("http://localhost:3000/api/telegram/alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "lead",
      data: { name: "Test User", phone: "0912345678" },
    }),
  });
  const resNoAuth = await postTelegramAlert(reqNoAuth);
  // Không có token trong process.env lúc test -> trả 400
  assert.equal(resNoAuth.status, 400);
  const json = await resNoAuth.json();
  assert.equal(json.success, false);
  assert.match(json.error, /Telegram/);
});

test("DELETE /api/crm/bookings/[id] enforces UUID and session in supabase mode", async () => {
  const env = { ...process.env };
  const originalFetch = global.fetch;
  const calls: { url: string; method: string }[] = [];

  try {
    process.env.CRM_MODE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.CRM_ACCESS_PASSWORD = "test-password-longer-than-24-characters";

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), method: init?.method ?? "GET" });
      return new Response(JSON.stringify([{ id: "12345678-1234-1234-1234-123456789abc" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const token = issueSession();

    const req = new NextRequest(
      "http://localhost:3000/api/crm/bookings/12345678-1234-1234-1234-123456789abc",
      {
        method: "DELETE",
        headers: {
          cookie: `${CRM_COOKIE}=${token}`,
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await deleteBookingRoute(req, {
      params: { id: "12345678-1234-1234-1234-123456789abc" },
    });
    assert.equal(response.status, 200);
    const delCall = calls.find((c) => c.method === "DELETE");
    assert.ok(delCall);
    assert.ok(delCall.url.includes("bookings"));
  } finally {
    process.env = env;
    global.fetch = originalFetch;
  }
});

test("deleteDemoLead removes lead and associated bookings, throws 404 if not found", () => {
  const snapshot = seedCRM();
  const initialLeads = snapshot.leads.length;
  const leadWithBooking = snapshot.leads.find((l) =>
    snapshot.bookings.some((b) => b.lead_id === l.id)
  );
  assert.ok(leadWithBooking);

  const nextSnapshot = deleteDemoLead(snapshot, leadWithBooking.id);
  assert.equal(nextSnapshot.leads.length, initialLeads - 1);
  assert.equal(
    nextSnapshot.bookings.some((b) => b.lead_id === leadWithBooking.id),
    false
  );

  // Thử xóa lại lead đã mất -> ném CRMError 404
  assert.throws(() => deleteDemoLead(nextSnapshot, leadWithBooking.id), CRMError);
});

test("DELETE /api/crm/leads/[id] enforces UUID and session in supabase mode", async () => {
  const env = { ...process.env };
  const originalFetch = global.fetch;
  const calls: { url: string; method: string }[] = [];

  try {
    process.env.CRM_MODE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.CRM_ACCESS_PASSWORD = "test-password-longer-than-24-characters";

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), method: init?.method ?? "GET" });
      return new Response(JSON.stringify([{ id: "12345678-1234-1234-1234-123456789abc" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const token = issueSession();

    const req = new NextRequest(
      "http://localhost:3000/api/crm/leads/12345678-1234-1234-1234-123456789abc",
      {
        method: "DELETE",
        headers: {
          cookie: `${CRM_COOKIE}=${token}`,
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await deleteLeadRoute(req, {
      params: { id: "12345678-1234-1234-1234-123456789abc" },
    });
    assert.equal(response.status, 200);
    const deleteCalls = calls.filter((c) => c.method === "DELETE");
    assert.equal(deleteCalls.length, 2); // 1 delete bookings, 1 delete leads
  } finally {
    process.env = env;
    global.fetch = originalFetch;
  }
});

test("Chat API and Webhook extract phone from natural message and create Lead CRM automatically", async () => {
  const { GET: getChat } = await import("@/app/api/simulator/chat/route");
  const { loadCloudStore } = await import("@/lib/sync/store");

  const req = new NextRequest(
    "http://localhost:3000/api/simulator/chat?channel=web&message=Tôi%20tên%20Hoàng%20Huy,%20sđt%200977889900,%20tư%20vấn%20tiệc%20cưới%2040%20bàn"
  );
  const res = await getChat(req);
  assert.equal(res.status, 200);

  const store = loadCloudStore();
  const createdLead = store.crm.leads.find((l) => l.phone === "0977889900");
  assert.ok(createdLead, "Lead phải được tự động ghi nhận vào CRM Cloud Store");
  assert.equal(createdLead.phone, "0977889900");
  assert.equal(createdLead.table_count, 40);
  assert.ok(createdLead.full_name.includes("Hoàng Huy"));
});

test("Botcake Webhook with formatted phone 0918.234.567 creates Lead in CRM", async () => {
  const res = await postBotcakeWebhook(
    new NextRequest("http://localhost:3000/api/webhook/botcake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "facebook",
        sender: { id: "fb-test-formatted-phone" },
        message: { text: "Tư vấn tiệc cưới giúp mình qua số 0918.234.567 nhé" },
      }),
    })
  );
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);

  const { loadCloudStore } = await import("@/lib/sync/store");
  const store = loadCloudStore();
  const createdLead = store.crm.leads.find((l) => l.phone === "0918234567");
  assert.ok(createdLead, "Lead với số điện thoại định dạng có dấu chấm phải được bóc tách và lưu vào CRM");
  assert.equal(createdLead.phone, "0918234567");
});



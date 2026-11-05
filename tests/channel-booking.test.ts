import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { getSmartBookingDefault } from "../lib/crm/appointment";
import { visitIntent } from "../lib/chat/follow-ups";
import { seedCRM, deleteDemoBooking } from "../lib/crm/demo-store";
import { CRMError } from "../lib/crm/model";
import { GET as getBotcakeWebhook, POST as postBotcakeWebhook } from "../app/api/webhook/botcake/route";
import { POST as postTelegramAlert } from "../app/api/telegram/alert/route";
import { DELETE as deleteBookingRoute } from "../app/api/crm/bookings/[id]/route";
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

test("Botcake Webhook POST processes Facebook and Zalo payloads gracefully", async () => {
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

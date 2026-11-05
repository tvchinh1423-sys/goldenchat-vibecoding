import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { validateLead, validateBooking, CRMError } from "../lib/crm/model";
import {
  seedCRM,
  readDemoCRM,
  saveDemoLead,
  saveDemoBooking,
  writeDemoCRM,
  parseCRM,
  CRM_STORAGE_KEY,
} from "../lib/crm/demo-store";
import { STORAGE_KEY } from "../lib/inbox/storage";
import { createDemoConversations } from "../lib/inbox/demo-data";
import { applyCRMToInbox } from "../lib/crm/inbox-adapter";
import {
  CRM_COOKIE,
  issueSession,
  validSession,
  requireSameOrigin,
} from "../lib/crm/server";
import { GET } from "../app/api/crm/route";
import { POST as createLead } from "../app/api/crm/leads/route";
import { PATCH as updateLead } from "../app/api/crm/leads/[id]/route";
import { POST as createBooking } from "../app/api/crm/bookings/route";
import { POST as login, DELETE as logout } from "../app/api/crm/session/route";

const input = {
  full_name: "Khách kiểm thử",
  phone: "+84 912 345 678",
  email: "guest@example.com",
  notes: "Tiệc cưới 35 bàn",
  stage: "N1",
  source: "facebook",
  assigned_to: "Ngọc Khánh",
  event_date: "20/12/2026",
  table_count: 35,
  inbox_reference: "test-inbox",
};
const future = () => new Date(Date.now() + 3 * 86400000).toISOString();
const booking = () => ({
  lead_id: "trang",
  appointment_time: future(),
  event_type: "xem_sanh",
  guests_count: 2,
  assigned_staff: "Ngọc Khánh",
  notes: "Xem sảnh, không phải đặt tiệc",
});
const memory = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
};
test("CRM validates phone, stage and event dates without inventing a year", () => {
  assert.equal(validateLead(input).phone, "0912345678");
  assert.equal(
    validateLead({ ...input, event_date: "20/11" }).event_date,
    "20/11",
  );
  for (const bad of [
    { phone: "123" },
    { stage: "booked" },
    { event_date: "31/11/2026" },
    { table_count: 1.5 },
    { email: "bad" },
  ])
    assert.throws(() => validateLead({ ...input, ...bad }), CRMError);
  assert.throws(
    () =>
      validateBooking({ ...booking(), appointment_time: "2027-01-01T10:00" }),
    CRMError,
  );
  assert.throws(
    () =>
      validateBooking({
        ...booking(),
        appointment_time: "2020-01-01T10:00:00+07:00",
      }),
    CRMError,
  );
});
test("Inbox leads join CRM without duplicating showcase cards; old storage stays intact", () => {
  const store = memory();
  const conversations = createDemoConversations();
  conversations[0].lead = {
    full_name: "Vũ Huyền Trang",
    phone: "0339516196",
    email: "",
    demand_notes: "Thử món",
    conversation_id: "trang",
    id: "inbox-lead",
    created_at: new Date().toISOString(),
    source: "facebook",
    status: "new",
  };
  const raw = JSON.stringify({ version: 1, conversations });
  store.setItem(STORAGE_KEY, raw);
  store.setItem(
    "omnichat.leads.golden-palace.stages.v1",
    JSON.stringify({ trang: "N4" }),
  );
  const crm = readDemoCRM(store);
  assert.equal(
    crm.leads.filter((l) => l.full_name === "Vũ Huyền Trang").length,
    1,
  );
  assert.equal(crm.leads.find((l) => l.id === "trang")?.stage, "N4");
  assert.equal(store.getItem(STORAGE_KEY), raw);
  writeDemoCRM(store, crm);
  assert.deepEqual(readDemoCRM(store), crm);
});
test("CRM rejects duplicate normalized phones and failed writes do not acknowledge persistence", () => {
  const first = saveDemoLead(seedCRM(), input);
  assert.throws(
    () =>
      saveDemoLead(first, {
        ...input,
        phone: "0912.345.678",
        inbox_reference: "other",
      }),
    /đã gắn/,
  );
  assert.throws(
    () =>
      writeDemoCRM(
        {
          getItem: () => null,
          setItem: () => {
            throw new Error("full");
          },
        },
        first,
      ),
    /Không lưu được/,
  );
  const store = memory();
  store.setItem(
    CRM_STORAGE_KEY,
    '{"version":1,"leads":[{"id":"broken"}],"bookings":[]}',
  );
  const raw = store.getItem(CRM_STORAGE_KEY);
  assert.throws(() => readDemoCRM(store));
  assert.equal(store.getItem(CRM_STORAGE_KEY), raw);
  assert.throws(() => parseCRM('{"version":9,"leads":[],"bookings":[]}'));
});
test("booking promotes N1/N2 to N3 atomically and enforces staff overlap, not hall reservations", () => {
  const before = seedCRM();
  const first = saveDemoBooking(before, booking());
  assert.equal(first.leads.find((l) => l.id === "trang")?.stage, "N3");
  assert.equal(before.leads.find((l) => l.id === "trang")?.stage, "N2");
  const time = new Date(
    Date.parse(first.bookings.at(-1)!.appointment_time) + 30 * 60000,
  ).toISOString();
  assert.throws(
    () =>
      saveDemoBooking(first, {
        ...booking(),
        lead_id: "menu",
        assigned_staff: " ngọc khánh ",
        appointment_time: time,
      }),
    /đã có lịch/,
  );
  assert.equal(
    saveDemoBooking(first, {
      ...booking(),
      lead_id: "menu",
      assigned_staff: "Chị Hiền",
      appointment_time: time,
    }).bookings.length,
    3,
  );
  assert.equal(
    saveDemoBooking(first, {
      ...booking(),
      lead_id: "menu",
      appointment_time: new Date(
        Date.parse(first.bookings.at(-1)!.appointment_time) + 3600000,
      ).toISOString(),
    }).bookings.length,
    3,
  );
  const advanced = saveDemoBooking(seedCRM(), {
    ...booking(),
    lead_id: "linh",
  });
  assert.equal(advanced.leads.find((l) => l.id === "linh")?.stage, "N4");
});
test("Inbox reflects CRM contact edits and removes cancelled visits without losing messages", () => {
  const conversations = createDemoConversations();
  const crm = saveDemoLead(seedCRM(), { ...input, inbox_reference: "trang" });
  const scheduled = saveDemoBooking(crm, booking());
  const synced = applyCRMToInbox(conversations, { ...scheduled, mode: "demo" });
  assert.equal(synced.find((c) => c.id === "trang")?.lead?.phone, "0912345678");
  assert.equal(
    synced.find((c) => c.id === "trang")?.booking?.staff,
    "Ngọc Khánh",
  );
  const cancelled = {
    ...scheduled,
    bookings: scheduled.bookings.map((b) => ({
      ...b,
      status: "cancelled" as const,
    })),
  };
  const cleared = applyCRMToInbox(synced, { ...cancelled, mode: "demo" });
  assert.equal(cleared.find((c) => c.id === "trang")?.booking, undefined);
  assert.deepEqual(
    cleared.find((c) => c.id === "trang")?.messages,
    conversations.find((c) => c.id === "trang")?.messages,
  );
});
test("CRM API uses explicit demo mode, protects database access and signs expiring workspace sessions", async () => {
  const env = { ...process.env };
  const originalFetch = global.fetch;
  const req = (path: string, method = "GET", body?: unknown, cookie?: string) =>
    new NextRequest(`http://localhost:3000/api/crm${path}`, {
      method,
      headers: {
        origin: "http://localhost:3000",
        ...(cookie ? { cookie: `${CRM_COOKIE}=${cookie}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    process.env.CRM_MODE = "demo";
    assert.deepEqual(await (await GET(req(""))).json(), { mode: "demo" });
    process.env.CRM_MODE = "supabase";
    delete process.env.CRM_ACCESS_PASSWORD;
    assert.equal((await GET(req(""))).status, 503);
    process.env.CRM_ACCESS_PASSWORD =
      "test-only-password-at-least-24-characters";
    assert.equal((await GET(req(""))).status, 401);
    const token = issueSession();
    assert.equal(validSession(token), true);
    assert.equal(validSession(token + "tampered"), false);
    assert.equal(validSession(token, Date.now() + 9 * 3600000), false);
    assert.throws(
      () =>
        requireSameOrigin(
          new NextRequest("http://localhost:3000/api/crm", {
            headers: { origin: "https://evil.example" },
          }),
        ),
      CRMError,
    );
    assert.doesNotThrow(() =>
      requireSameOrigin(
        new NextRequest("http://localhost:3000/api/crm", {
          headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
        }),
      ),
    );
    assert.equal(
      (await login(req("/session", "POST", { password: "wrong" }))).status,
      401,
    );
    const signed = await login(
      req("/session", "POST", { password: process.env.CRM_ACCESS_PASSWORD }),
    );
    assert.equal(signed.status, 200);
    assert.match(signed.headers.get("set-cookie")!, /HttpOnly/i);
    const ended = await logout(req("/session", "DELETE"));
    assert.match(ended.headers.get("set-cookie")!, /Max-Age=0/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://unit-test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-server-only-key";
    const calls: { url: string; body?: string; method?: string }[] = [];
    global.fetch = (async (url, init) => {
      calls.push({
        url: String(url),
        body: init?.body as string,
        method: init?.method,
      });
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
    assert.equal(
      (
        await createLead(
          req("/leads", "POST", { ...input, phone: "bad" }, token),
        )
      ).status,
      400,
    );
    assert.equal(calls.length, 0);
    const response = await createLead(req("/leads", "POST", input, token));
    assert.equal(response.status, 200);
    const insert = calls.find(
      (c) => c.url.includes("/leads") && c.method === "POST",
    );
    assert.equal(JSON.parse(insert!.body!).phone, "0912345678");
    const stageResponse = await updateLead(
      req(
        "/leads/12345678-1234-1234-1234-123456789abc",
        "PATCH",
        { stage: "N2" },
        token,
      ),
      { params: { id: "12345678-1234-1234-1234-123456789abc" } },
    );
    // The mock returns no row, so the route reports 404; inspect the update body.
    assert.equal(stageResponse.status, 404);
    const patch = calls.find((c) => c.method === "PATCH");
    assert.deepEqual(Object.keys(JSON.parse(patch!.body!)).sort(), [
      "last_touched_at",
      "stage",
    ]);
    assert.equal(
      (
        await createBooking(
          req(
            "/bookings",
            "POST",
            { ...booking(), lead_id: "12345678-1234-1234-1234-123456789abc" },
            token,
          ),
        )
      ).status,
      200,
    );
    assert.ok(calls.some((c) => c.url.includes("rpc/crm_save_booking")));
    global.fetch = (async () =>
      new Response(JSON.stringify({ message: "SECRET DATABASE ERROR" }), {
        status: 503,
      })) as typeof fetch;
    const failed = await GET(req("", "GET", undefined, token));
    assert.equal(failed.status, 503);
    const failure = await failed.json();
    assert.equal(failure.mode, undefined);
    assert.doesNotMatch(failure.error, /SECRET/);
  } finally {
    process.env = env;
    global.fetch = originalFetch;
  }
});

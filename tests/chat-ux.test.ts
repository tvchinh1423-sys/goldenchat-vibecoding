import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../app/api/simulator/chat/route";
import { NextRequest } from "next/server";

test("API chat provides concise answers without repeating assistant introductions in subsequent turns", async () => {
  const reqGreetings = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "chào bạn", messageCount: 2 }),
  });
  const resGreetings = await POST(reqGreetings);
  const dataGreetings = await resGreetings.json();
  assert.equal(dataGreetings.success, true);
  assert.equal(dataGreetings.reply.includes("em là trợ lý tư vấn"), false);
  assert.match(dataGreetings.reply, /Dạ chào Quý khách!/);

  const reqFallback = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "câu hỏi lạ chưa có trong kịch bản", messageCount: 3 }),
  });
  const resFallback = await POST(reqFallback);
  const dataFallback = await resFallback.json();
  assert.equal(dataFallback.success, true);
  assert.equal(dataFallback.reply.includes("em là trợ lý tư vấn"), false);
  assert.equal(dataFallback.aiEnabled, false);
  assert.equal(dataFallback.handoff, true);
  assert.equal(dataFallback.requiresHuman, true);
  assert.match(dataFallback.reply, /chuyên viên tư vấn hỗ trợ mình ngay/);
});

test("API chat returns official Golden Palace URLs for menu, maps and spaces for 1-tap navigation", async () => {
  const reqMenu = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Xem thực đơn tiệc cưới", messageCount: 2 }),
  });
  const resMenu = await POST(reqMenu);
  const dataMenu = await resMenu.json();
  assert.match(dataMenu.reply, /https:\/\/goldenpalacenamdinh\.com\/thuc-don/);

  const reqAddress = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Địa chỉ ở đâu", messageCount: 2 }),
  });
  const resAddress = await POST(reqAddress);
  const dataAddress = await resAddress.json();
  assert.match(dataAddress.reply, /https:\/\/maps\.app\.goo\.gl/);
  assert.match(dataAddress.reply, /98 Đông A/);
});

test("API chat prioritizes deposit intent (5.000.000 VNĐ) over generic hall keyword matching", async () => {
  const reqDeposit = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Đặt cọc giữ sảnh bao nhiêu?", messageCount: 2 }),
  });
  const resDeposit = await POST(reqDeposit);
  const dataDeposit = await resDeposit.json();
  assert.equal(dataDeposit.success, true);
  assert.match(dataDeposit.reply, /5\.000\.000/);
  assert.doesNotMatch(dataDeposit.reply, /tọa lạc tại 98 Đông A/);
});

test("API chat dynamically responds to guest count (e.g. 300 khách / 30 mâm) with relevant hall recommendations", async () => {
  const req300 = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "300 khách", messageCount: 3 }),
  });
  const res300 = await POST(req300);
  const data300 = await res300.json();
  assert.equal(data300.success, true);
  assert.match(data300.reply, /Hội trường Tầng 3/);
  assert.match(data300.reply, /Hội trường Tầng 4/);

  const req30Mam = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "30 mâm", messageCount: 3 }),
  });
  const res30Mam = await POST(req30Mam);
  const data30Mam = await res30Mam.json();
  assert.equal(data30Mam.success, true);
  assert.match(data30Mam.reply, /Hội trường Tầng 3/);
});

test("API chat identifies appointment intent when user says chị muốn đặt lịch", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "chị muốn đặt lịch", messageCount: 3 }),
  });
  const res = await POST(req);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.appointmentIntent, true);
  assert.equal(data.visitType, "xem_sanh");
  assert.match(data.reply, /8:00 đến 10:30 sáng/);
  assert.match(data.reply, /Tên cùng Số điện thoại/);
});

test("API chat disables AI and initiates human handoff when question is out of scope", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bên em có bán bảo hiểm xe máy không?", messageCount: 2 }),
  });
  const res = await POST(req);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.aiEnabled, false);
  assert.equal(data.handoff, true);
  assert.equal(data.requiresHuman, true);
  assert.equal(data.triggeredRule, "out_of_scope_human_handoff");
  assert.match(data.reply, /chuyên viên tư vấn hỗ trợ mình ngay/);
});

test("API chat prioritizes deposit inquiry even when customer message mentions appointment or weekend", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Em để lại số để hẹn xem sảnh và thử món cuối tuần. Cho em hỏi thêm: đặt cọc giữ sảnh bao nhiêu ạ?",
      messageCount: 4,
    }),
  });
  const res = await POST(req);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.match(data.reply, /5\.000\.000/);
});

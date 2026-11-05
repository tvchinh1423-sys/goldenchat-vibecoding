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
  assert.match(dataFallback.reply, /Quý khách cần hỗ trợ thêm thông tin cụ thể/);
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

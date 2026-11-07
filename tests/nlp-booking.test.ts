import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { POST as postChatSimulator } from "../app/api/simulator/chat/route";
import { extractBookingDetails } from "../lib/chat/booking-extractor";

test("extractBookingDetails accurately extracts Name, Date, Time, EventType from natural Vietnamese", () => {
  const text1 = "chị muốn đặt lịch tư vấn trực tiếp ngày 9/11 lúc 10h , c tên vân";
  const draft1 = extractBookingDetails(text1);

  assert.equal(draft1.fullName, "Vân");
  assert.equal(draft1.timeStr, "10:00");
  assert.equal(draft1.dateStr, "09/11/2026");
  assert.equal(draft1.dateTimeIso, "2026-11-09T10:00");
  assert.equal(draft1.eventType, "tu_van_su_kien");
  assert.equal(draft1.phone, null);
  assert.equal(draft1.isComplete, false);
  assert.deepEqual(draft1.missingFields, ["phone"]);

  // Turn 2: Khách nhắn bổ sung SĐT
  const text2 = "sđt chị là 0912345678";
  const draft2 = extractBookingDetails(text2, draft1);

  assert.equal(draft2.fullName, "Vân");
  assert.equal(draft2.phone, "0912345678");
  assert.equal(draft2.timeStr, "10:00");
  assert.equal(draft2.dateStr, "09/11/2026");
  assert.equal(draft2.dateTimeIso, "2026-11-09T10:00");
  assert.equal(draft2.isComplete, true);
  assert.deepEqual(draft2.missingFields, []);
});

test("Chat Simulator API handles multi-turn booking dialog seamlessly", async () => {
  // Turn 1: Khách nhắn câu của Chinh
  const req1 = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "chị muốn đặt lịch tư vấn trực tiếp ngày 9/11 lúc 10h , c tên vân",
      channel: "web",
    }),
  });
  const res1 = await postChatSimulator(req1);
  assert.equal(res1.status, 200);
  const data1 = await res1.json();

  assert.equal(data1.success, true);
  assert.equal(data1.appointmentIntent, true);
  assert.equal(data1.autoBooked, false);
  assert.equal(data1.bookingDraft.fullName, "Vân");
  assert.equal(data1.bookingDraft.timeStr, "10:00");
  assert.equal(data1.bookingDraft.dateStr, "09/11/2026");
  assert.match(data1.reply, /Vân/);
  assert.match(data1.reply, /Số điện thoại/);

  // Turn 2: Khách gửi SĐT bổ sung cùng context
  const req2 = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "sđt chị là 0912345678",
      channel: "web",
      bookingDraftContext: data1.bookingDraft,
    }),
  });
  const res2 = await postChatSimulator(req2);
  assert.equal(res2.status, 200);
  const data2 = await res2.json();

  assert.equal(data2.success, true);
  assert.equal(data2.appointmentIntent, true);
  assert.equal(data2.autoBooked, true);
  assert.equal(data2.bookingDraft.fullName, "Vân");
  assert.equal(data2.bookingDraft.phone, "0912345678");
  assert.equal(data2.bookingDraft.isComplete, true);
  assert.match(data2.reply, /xác nhận lịch/i);
});

test("Chat Simulator API auto-books in 1 turn if customer supplies all information", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "mai tôi qua xem sảnh lúc 9h sáng, tên Dũng, sđt 0987654321",
      channel: "web",
    }),
  });
  const res = await postChatSimulator(req);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.equal(data.appointmentIntent, true);
  assert.equal(data.autoBooked, true);
  assert.equal(data.bookingDraft.fullName, "Dũng");
  assert.equal(data.bookingDraft.phone, "0987654321");
  assert.equal(data.bookingDraft.isComplete, true);
});

test("Chat Simulator correctly books when customer provides time, name, and phone (e.g. 9h ngày 12/11, tên Chi, số điện thoại 093488978) without mistaking phone as guest capacity", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "9h ngày 12/11, tên Chi, số điện thoại 093488978",
      channel: "web",
    }),
  });
  const res = await postChatSimulator(req);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.equal(data.appointmentIntent, true);
  assert.equal(data.autoBooked, true);
  assert.equal(data.bookingDraft.fullName, "Chi");
  assert.equal(data.bookingDraft.phone, "093488978");
  assert.equal(data.bookingDraft.dateStr, "12/11/2026");
  assert.equal(data.bookingDraft.timeStr, "09:00");
  assert.match(data.reply, /xác nhận lịch/i);
  assert.match(data.reply, /Chi/);
  // Tuyệt đối không bị nhầm 8978 khách!
  assert.doesNotMatch(data.reply, /8978\s*khách/i);
  assert.doesNotMatch(data.reply, /quy mô đại lễ/i);
});

test("Chat Simulator successfully auto-books when customer sends 'Tên Chi 📞 0933847772' with phone emoji and pre-selected time", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Tên Chi 📞 0933847772",
      channel: "web",
      bookingDraftContext: {
        fullName: null,
        phone: null,
        dateTimeIso: "2026-11-08T09:00",
        dateStr: "08/11/2026",
        timeStr: "09:00",
        eventType: "xem_sanh",
        eventTypeName: "Tham quan & Xem sảnh tiệc",
        guestsCount: 2,
        notes: "09:00 ngày 08/11/2026",
        isComplete: false,
        missingFields: ["fullName", "phone"],
      },
    }),
  });

  const res = await postChatSimulator(req);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.equal(data.success, true);
  assert.equal(data.appointmentIntent, true);
  assert.equal(data.autoBooked, true);
  assert.equal(data.bookingDraft.fullName, "Chi");
  assert.equal(data.bookingDraft.phone, "0933847772");
  assert.equal(data.bookingDraft.isComplete, true);
  assert.match(data.reply, /xác nhận lịch/i);
  assert.match(data.reply, /Chi/);
  assert.match(data.reply, /0933847772/);
});

test("extractBookingDetails handles variations of name and phone with emoji and spaces", () => {
  const ctx = {
    dateTimeIso: "2026-11-08T09:00",
    dateStr: "08/11/2026",
    timeStr: "09:00",
    eventType: "xem_sanh" as const,
  };

  const case1 = extractBookingDetails("Tên Chi 📞 0933847772", ctx);
  assert.equal(case1.fullName, "Chi");
  assert.equal(case1.phone, "0933847772");
  assert.equal(case1.isComplete, true);

  const case2 = extractBookingDetails("Chi 0933847772", ctx);
  assert.equal(case2.fullName, "Chi");
  assert.equal(case2.phone, "0933847772");
  assert.equal(case2.isComplete, true);

  const case3 = extractBookingDetails("Chi 📞0933847772", ctx);
  assert.equal(case3.fullName, "Chi");
  assert.equal(case3.phone, "0933847772");
  assert.equal(case3.isComplete, true);

  const case4 = extractBookingDetails("Trần Vân Chinh - 0912345678", ctx);
  assert.equal(case4.fullName, "Trần Vân Chinh");
  assert.equal(case4.phone, "0912345678");
  assert.equal(case4.isComplete, true);
});

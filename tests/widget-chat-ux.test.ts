import test from "node:test";
import assert from "node:assert/strict";
import { formatFileSize } from "@/lib/chat/image-utils";
import { POST } from "@/app/api/simulator/chat/route";
import { NextRequest } from "next/server";

test("formatFileSize formats bytes correctly across units", () => {
  assert.equal(formatFileSize(0), "0 KB");
  assert.equal(formatFileSize(512), "1 KB");
  assert.equal(formatFileSize(204800), "200 KB");
  assert.equal(formatFileSize(1572864), "1.5 MB");
});

test("API chat simulator responds gracefully when user sends only images", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "",
      channel: "web",
      attachments: [
        {
          id: "img-test-1",
          name: "mau-rap-cuoi.jpg",
          url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
          size: 150000,
        },
      ],
      businessProfile: {
        name: "Trung tâm Tiệc cưới Golden Palace",
      },
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.match(json.reply, /nhận được hình ảnh/i);
  assert.ok(Array.isArray(json.suggestedQuestions));
  assert.ok(json.suggestedQuestions.length >= 2);
});

test("API chat simulator responds with consultation when user attaches photo with question", async () => {
  const req = new NextRequest("http://localhost:3000/api/simulator/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Tư vấn giúp em mẫu bàn tiệc cưới này với",
      channel: "web",
      attachments: [
        {
          id: "img-test-2",
          name: "ban-tiec.jpg",
          url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
          size: 210000,
        },
      ],
      businessProfile: {
        name: "Trung tâm Tiệc cưới Golden Palace",
      },
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(typeof json.reply === "string");
  assert.ok(json.reply.length > 20);
});

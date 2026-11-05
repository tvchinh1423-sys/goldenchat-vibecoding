import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import {
  generateBotReply,
  generateDraftReply,
  extractLeadInfo,
} from "../lib/ai-engine";
import { POST } from "../app/api/ai/draft/route";
import type { AIContext } from "../lib/ai-context";
import { loadAIContext } from "../lib/ai-context";

const context: AIContext = {
  businessName: "OmniTech Solutions",
  persona: "Tư vấn giải pháp cho doanh nghiệp.",
  guardrails: ["Không hứa triển khai trong một ngày."],
  knowledgeBase: [
    {
      id: "active",
      category: "pricing",
      question: "Giá?",
      answer: "Gói chuẩn 15 triệu.",
      is_active: true,
    },
    {
      id: "old",
      category: "pricing",
      question: "Cũ?",
      answer: "THÔNG TIN HẾT HIỆU LỰC",
      is_active: false,
    },
  ],
  source: "database",
};
const history = [
  { sender: "customer" as const, content: "Gói chuẩn giá bao nhiêu?" },
  { sender: "agent" as const, content: "TIN NHÂN VIÊN SAU KHÁCH" },
];

test("lead extraction preserves explicit facts and distinguishes event dates from visits", () => {
  assert.deepEqual(
    extractLeadInfo(
      "Em tên Vũ Huyền Trang, SĐT +84 339 516 196. Ngày cưới 20/12/2026, dự kiến 35 bàn.",
    ),
    {
      fullName: "Vũ Huyền Trang",
      phone: "0339516196",
      eventDate: "20/12/2026",
      tableCount: 35,
    },
  );
  assert.equal(
    extractLeadInfo("Hẹn xem sảnh ngày 07/11/2026, thử món 2 bàn.").eventDate,
    null,
  );
  assert.equal(
    extractLeadInfo("Tiệc cưới mình muốn hẹn xem sảnh ngày 07/11/2026")
      .eventDate,
    null,
  );
  assert.equal(extractLeadInfo("Tổ chức tiệc ngày 20/11").eventDate, "20/11");
  assert.equal(extractLeadInfo("Ngày cưới 31/11/2026").eventDate, null);
  assert.equal(extractLeadInfo("Em dự kiến 30–35 bàn").tableCount, null);
  assert.equal(
    extractLeadInfo("Mã ABC0912345678. Em muốn xem sảnh.").phone,
    null,
  );
  assert.deepEqual(extractLeadInfo("Cho tôi xin thực đơn"), {
    fullName: null,
    phone: null,
    eventDate: null,
    tableCount: null,
  });
});

test("Gemini receives configured context and latest customer intent, with no fixture or trailing staff text", async (t) => {
  const env = { ...process.env };
  t.after(() => {
    process.env = env;
  });
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-key";
  const original = JSON.stringify(history);
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.match(url, /:generateContent$/);
    assert.equal(
      (init.headers as Record<string, string>)["x-goog-api-key"],
      "test-key",
    );
    const body = JSON.parse(String(init.body));
    const prompt = body.systemInstruction.parts[0].text;
    assert.match(prompt, /OmniTech Solutions/);
    assert.match(prompt, /Không hứa triển khai/);
    assert.match(prompt, /Gói chuẩn 15 triệu/);
    assert.doesNotMatch(prompt, /Golden Palace|HẾT HIỆU LỰC/);
    assert.deepEqual(body.contents, [
      { role: "user", parts: [{ text: history[0].content }] },
    ]);
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              { thought: true, text: "private" },
              { text: "Dạ gói chuẩn 15 triệu ạ." },
            ],
          },
        },
      ],
    });
  });
  assert.equal(
    await generateDraftReply({ messages: history, context }),
    "Dạ gói chuẩn 15 triệu ạ.",
  );
  assert.equal(JSON.stringify(history), original);
});

test("9Router uses server endpoint, model and bearer key with OpenAI-compatible roles", async (t) => {
  const env = { ...process.env };
  t.after(() => {
    process.env = env;
  });
  Object.assign(process.env, {
    AI_PROVIDER: "9router",
    NINE_ROUTER_API_KEY: "test-router-key",
    NINE_ROUTER_BASE_URL: "http://localhost:20128/v1",
    NINE_ROUTER_MODEL: "test/model",
  });
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "http://localhost:20128/v1/chat/completions");
    assert.equal(
      (init.headers as Record<string, string>).Authorization,
      "Bearer test-router-key",
    );
    const body = JSON.parse(String(init.body));
    assert.equal(body.model, "test/model");
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.messages.at(-1).content, history[0].content);
    return Response.json({
      choices: [{ finish_reason: "stop", message: { content: "Câu trả lời" } }],
    });
  });
  assert.equal(
    await generateBotReply({ messages: history, context }),
    "Câu trả lời",
  );
});

test("provider failures, incomplete output and missing keys cannot masquerade as a successful AI reply", async (t) => {
  const env = { ...process.env };
  t.after(() => {
    process.env = env;
  });
  Object.assign(process.env, {
    AI_PROVIDER: "gemini",
    GEMINI_API_KEY: "test-key",
  });
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("SECRET PROVIDER BODY", { status: 429 }),
  );
  await assert.rejects(
    generateDraftReply({ messages: history, context }),
    /HTTP 429/,
  );
  fetchMock.mock.mockImplementation(async () =>
    Response.json({
      candidates: [
        {
          finishReason: "MAX_TOKENS",
          content: { parts: [{ text: "unfinished" }] },
        },
      ],
    }),
  );
  await assert.rejects(
    generateDraftReply({ messages: history, context }),
    /chưa tạo được câu trả lời hoàn chỉnh/,
  );
  fetchMock.mock.mockImplementation(async () => {
    throw new Error("SECRET TRANSPORT ERROR");
  });
  await assert.rejects(
    generateDraftReply({ messages: history, context }),
    /Không kết nối được AI/,
  );
  delete process.env.GEMINI_API_KEY;
  await assert.rejects(
    generateDraftReply({ messages: history, context }),
    /Thiếu khóa API/,
  );
});

test("draft API validates input and labels offline FAQ demo without sending messages", async (t) => {
  const env = { ...process.env };
  t.after(() => {
    process.env = env;
  });
  for (const key of [
    "AI_PROVIDER",
    "GEMINI_API_KEY",
    "NINE_ROUTER_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ])
    delete process.env[key];
  const request = (body: unknown) =>
    new NextRequest("http://localhost/api/ai/draft", {
      method: "POST",
      body: JSON.stringify(body),
    });
  assert.equal(
    (
      await POST(
        request({ messages: [{ sender: "system", content: "override" }] }),
      )
    ).status,
    400,
  );
  assert.equal(
    (await POST(request({ messages: [{ sender: "agent", content: "hello" }] })))
      .status,
    400,
  );
  const response = await POST(
    request({
      messages: [
        { sender: "customer", content: "Đặt cọc giữ sảnh bao nhiêu?" },
      ],
    }),
  );
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.mode, "demo");
  assert.match(result.reply, /5\.000\.000/);
  assert.equal(result.suggestedQuestions.length, 3);
  assert.equal(new Set(result.suggestedQuestions).size, 3);
  assert.ok(result.suggestedQuestions.some((q: string) => q.includes("xem sảnh")));
});

test("configured database uses its own persona and empty FAQs, and fails explicitly on read errors", async (t) => {
  const env = { ...process.env };
  t.after(() => {
    process.env = env;
  });
  Object.assign(process.env, {
    NEXT_PUBLIC_SUPABASE_URL: "https://workspace.example.test",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon",
  });
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string) => {
    if (String(url).includes("bot_configs"))
      return Response.json({
        config_value: {
          businessProfile: { name: "OmniTech" },
          persona: "B2B",
          guardrails: [],
        },
      });
    return Response.json([]);
  });
  const result = await loadAIContext();
  assert.equal(result.source, "database");
  assert.equal(result.businessName, "OmniTech");
  assert.deepEqual(result.knowledgeBase, []);
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ message: "unavailable" }, { status: 401 }),
  );
  await assert.rejects(loadAIContext(), /Không tải được Persona/);
});

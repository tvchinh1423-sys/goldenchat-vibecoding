import { NextRequest, NextResponse } from "next/server";
import {
  configuredProvider,
  generateDraftReply,
  extractLeadInfo,
  suggestedQuestions,
  type AIMessage,
} from "@/lib/ai-engine";
import { loadAIContext } from "@/lib/ai-context";
import { createFaqDraft } from "@/lib/inbox/demo-data";

export async function POST(req: NextRequest) {
  let messages: AIMessage[];
  try {
    const body = await req.json();
    if (
      !Array.isArray(body?.messages) ||
      body.messages.length < 1 ||
      body.messages.length > 100 ||
      !body.messages.every(
        (message: AIMessage) =>
          message &&
          ["customer", "agent", "bot"].includes(message.sender) &&
          typeof message.content === "string" &&
          message.content.length <= 8000,
      ) ||
      !body.messages.some(
        (message: AIMessage) =>
          message.sender === "customer" && message.content.trim(),
      )
    ) {
      return NextResponse.json(
        { error: "Lịch sử tin nhắn không hợp lệ." },
        { status: 400 },
      );
    }
    messages = body.messages;
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu JSON không hợp lệ." },
      { status: 400 },
    );
  }
  try {
    let context;
    try {
      context = await loadAIContext();
    } catch {
      // Khi database chưa được cấu hình hoặc lỗi kết nối, fallback về tri thức chuẩn Showcase Golden Palace
      context = {
        businessName: "Trung tâm Tiệc cưới & Sự kiện Golden Palace",
        persona: "",
        guardrails: [],
        knowledgeBase: [],
        source: "demo" as const,
      };
    }
    const provider = configuredProvider();
    // Offline showcase remains explicit; a live/configured database never uses demo FAQs.
    const demo = !provider || context.source === "demo";
    let reply: string;
    if (demo) {
      reply = createFaqDraft(
        messages.map((message, i) => ({
          ...message,
          id: String(i),
          createdAt: "",
        })),
      );
    } else {
      try {
        reply = await generateDraftReply({ messages, context });
      } catch {
        reply = createFaqDraft(
          messages.map((message, i) => ({
            ...message,
            id: String(i),
            createdAt: "",
          })),
        );
      }
    }
    return NextResponse.json({
      reply,
      mode: demo ? "demo" : "ai",
      contextSource: context.source,
      suggestedQuestions: suggestedQuestions(
        messages.findLast(
          (message) => message.sender === "customer" && message.content.trim(),
        )?.content ?? "",
        /golden palace/i.test(context.businessName),
      ),
      leadInfo: extractLeadInfo(
        messages
          .filter((message) => message.sender === "customer")
          .map((message) => message.content)
          .join("\n"),
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Chưa tạo được bản nháp.",
      },
      { status: 503 },
    );
  }
}

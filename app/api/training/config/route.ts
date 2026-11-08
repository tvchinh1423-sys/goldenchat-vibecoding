import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_BOT_CONFIG, DEFAULT_KNOWLEDGE_BASE } from "@/lib/mock-service";
import { loadBotTrainingData, saveBotTrainingData } from "@/lib/sync/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const storeData = loadBotTrainingData();

  try {
    const { data, error } = await supabase
      .from("bot_configs")
      .select("*")
      .eq("config_key", "main_bot_config")
      .single();

    if (!error && data && data.config_value) {
      return NextResponse.json({
        success: true,
        config: data.config_value,
        knowledgeBase: storeData.knowledgeBase,
      });
    }
  } catch (err) {
    // Supabase query error fallback
  }

  return NextResponse.json({
    success: true,
    config: storeData.config || DEFAULT_BOT_CONFIG,
    knowledgeBase: storeData.knowledgeBase || DEFAULT_KNOWLEDGE_BASE,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const configPayload = body.config || (body.businessProfile ? body : null) || body;
    const knowledgePayload = Array.isArray(body.knowledgeBase)
      ? body.knowledgeBase
      : Array.isArray(configPayload?.knowledgeBase)
      ? configPayload.knowledgeBase
      : undefined;

    // 1. Luôn lưu bền vững vào Cloud Store của hệ thống
    const saved = saveBotTrainingData(configPayload, knowledgePayload);

    // 2. Thử lưu vào Supabase (nếu có quyền)
    try {
      await supabase.from("bot_configs").upsert(
        {
          config_key: "main_bot_config",
          config_value: configPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "config_key" }
      );
    } catch (e) {
      // Bỏ qua lỗi RLS của Supabase
    }

    return NextResponse.json({
      success: true,
      message: "Đã lưu cấu hình Bot và toàn bộ Tri thức FAQ thành công!",
      config: saved.config,
      knowledgeBase: saved.knowledgeBase,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

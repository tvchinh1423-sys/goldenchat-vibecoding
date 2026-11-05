import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_BOT_CONFIG } from "@/lib/mock-service";

export async function GET() {
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
      });
    }
  } catch (err) {
    // console.warn("Supabase query error:", err);
  }

  // Fallback về default config
  return NextResponse.json({
    success: true,
    config: DEFAULT_BOT_CONFIG,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const { error } = await supabase.from("bot_configs").upsert(
        {
          config_key: "main_bot_config",
          config_value: body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "config_key" }
      );

      if (error) {
        console.warn("Lỗi lưu Supabase:", error);
      }
    } catch (e) {
      // Supabase chưa kết nối
    }

    return NextResponse.json({
      success: true,
      message: "Đã lưu cấu hình Bot thành công!",
      config: body,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

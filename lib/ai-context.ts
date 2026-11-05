import { DEFAULT_BOT_CONFIG, DEFAULT_KNOWLEDGE_BASE } from "./mock-service";
import { getSupabase } from "./supabase";
import type { KnowledgeItem } from "@/types/database";

export interface AIContext {
  businessName: string;
  persona: string;
  guardrails: string[];
  knowledgeBase: KnowledgeItem[];
  source: "database" | "demo";
}

/** No silent showcase fallback when a configured database fails or has no FAQs. */
export async function loadAIContext(): Promise<AIContext> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    !url ||
    !key ||
    url.includes("your-project.supabase.co") ||
    key === "your-anon-key-here"
  ) {
    return {
      businessName: DEFAULT_BOT_CONFIG.businessProfile.name,
      persona: DEFAULT_BOT_CONFIG.persona,
      guardrails: DEFAULT_BOT_CONFIG.guardrails,
      knowledgeBase: DEFAULT_KNOWLEDGE_BASE,
      source: "demo",
    };
  }
  const db = getSupabase();
  const [configResult, knowledgeResult] = await Promise.all([
    db
      .from("bot_configs")
      .select("config_value")
      .eq("config_key", "main_bot_config")
      .single(),
    db
      .from("knowledge_base")
      .select("id,category,question,answer,tags,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const config = configResult.data?.config_value;
  if (
    configResult.error ||
    knowledgeResult.error ||
    typeof config?.persona !== "string" ||
    typeof config?.businessProfile?.name !== "string" ||
    !Array.isArray(config?.guardrails) ||
    !config.guardrails.every((rule: unknown) => typeof rule === "string")
  ) {
    throw new Error(
      "Không tải được Persona/FAQ đã cấu hình. Vui lòng kiểm tra kết nối và dữ liệu huấn luyện.",
    );
  }
  return {
    businessName: config.businessProfile.name,
    persona: config.persona,
    guardrails: config.guardrails,
    knowledgeBase: knowledgeResult.data ?? [],
    source: "database",
  };
}

import { NextRequest } from "next/server";
import { crmHandler, databaseSnapshot } from "@/lib/crm/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return crmHandler(req, async () => ({
    mode: "supabase",
    ...(await databaseSnapshot()),
  }));
}

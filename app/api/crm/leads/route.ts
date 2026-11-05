import { NextRequest } from "next/server";
import { validateLead } from "@/lib/crm/model";
import {
  crmDatabase,
  crmHandler,
  databaseError,
  readBody,
} from "@/lib/crm/server";
export async function POST(req: NextRequest) {
  return crmHandler(req, async () => {
    const fields = validateLead(await readBody(req));
    const { error } = await crmDatabase()
      .from("leads")
      .insert({ ...fields, last_touched_at: new Date().toISOString() });
    databaseError(error);
  });
}

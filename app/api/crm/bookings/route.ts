import { NextRequest } from "next/server";
import { validateBooking } from "@/lib/crm/model";
import {
  crmDatabase,
  crmHandler,
  databaseError,
  readBody,
  requireUUID,
} from "@/lib/crm/server";
export async function POST(req: NextRequest) {
  return crmHandler(req, async () => {
    const fields = validateBooking(await readBody(req));
    requireUUID(fields.lead_id);
    const { error } = await crmDatabase().rpc("crm_save_booking", {
      p_input: fields,
      p_id: null,
    });
    databaseError(error);
  });
}

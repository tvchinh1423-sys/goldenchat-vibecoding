import { NextRequest } from "next/server";
import { CRMError, isRecord, isStage, validateLead } from "@/lib/crm/model";
import {
  crmDatabase,
  crmHandler,
  databaseError,
  readBody,
  requireUUID,
} from "@/lib/crm/server";
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return crmHandler(req, async () => {
    requireUUID(params.id);
    const body = await readBody(req);
    // Moving a card must not overwrite contact/notes edited by another advisor.
    const fields =
      isRecord(body) && Object.keys(body).length === 1 && isStage(body.stage)
        ? { stage: body.stage }
        : validateLead(body);
    const { data, error } = await crmDatabase()
      .from("leads")
      .update({ ...fields, last_touched_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("id")
      .maybeSingle();
    databaseError(error);
    if (!data) throw new CRMError("Không tìm thấy khách hàng.", 404);
  });
}

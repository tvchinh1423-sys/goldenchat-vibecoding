import { NextRequest } from "next/server";
import {
  BOOKING_STATUSES,
  CRMError,
  isRecord,
  validateBooking,
} from "@/lib/crm/model";
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
    if (
      isRecord(body) &&
      Object.keys(body).length === 1 &&
      Object.hasOwn(BOOKING_STATUSES, String(body.status))
    ) {
      const { data, error } = await crmDatabase()
        .from("bookings")
        .update({ status: body.status })
        .eq("id", params.id)
        .select("id")
        .maybeSingle();
      databaseError(error);
      if (!data) throw new CRMError("Không tìm thấy lịch hẹn.", 404);
    } else {
      const fields = validateBooking(body);
      requireUUID(fields.lead_id);
      const { error } = await crmDatabase().rpc("crm_save_booking", {
        p_input: fields,
        p_id: params.id,
      });
      databaseError(error);
    }
  });
}

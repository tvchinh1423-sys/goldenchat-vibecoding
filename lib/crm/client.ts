import {
  CRMError,
  assertBookingAvailable,
  isActiveBooking,
  type CRMBooking,
  type CRMLead,
  type CRMSnapshot,
} from "./model";
import {
  readDemoCRM,
  saveDemoBooking,
  saveDemoLead,
  writeDemoCRM,
} from "./demo-store";
export interface CRMState extends CRMSnapshot {
  mode: "demo" | "supabase";
}
async function request(path = "", method = "GET", body?: unknown) {
  let response: Response;
  let value;
  try {
    response = await fetch(`/api/crm${path}`, {
      method,
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    value = await response.json();
  } catch {
    throw new CRMError(
      method === "GET"
        ? "Không kết nối được CRM. Vui lòng tải lại."
        : "Chưa xác nhận được thay đổi đã lưu. Hãy tải lại CRM trước khi thử lại.",
      503,
    );
  }
  if (!response.ok)
    throw new CRMError(
      value.error || "Chưa kết nối được CRM.",
      response.status,
    );
  return value;
}
export async function loadCRM(): Promise<CRMState> {
  const result = await request();
  if (result.mode === "demo")
    return { mode: "demo", ...readDemoCRM(localStorage) };
  return result;
}
async function mutate(
  path: string,
  method: string,
  body: unknown,
  local: (data: CRMSnapshot) => CRMSnapshot,
): Promise<CRMState> {
  const result = await request(path, method, body);
  if (result.mode !== "demo") return result;
  const data = local(readDemoCRM(localStorage));
  writeDemoCRM(localStorage, data);
  window.dispatchEvent(new Event("omnichat-crm-change"));
  return { mode: "demo", ...data };
}
export async function saveCRMLead(input: unknown, id?: string) {
  return mutate(
    id ? `/leads/${encodeURIComponent(id)}` : "/leads",
    id ? "PATCH" : "POST",
    input,
    (data) => saveDemoLead(data, input, id),
  );
}
export async function moveCRMLead(lead: CRMLead, stage: CRMLead["stage"]) {
  return mutate(
    `/leads/${encodeURIComponent(lead.id)}`,
    "PATCH",
    { stage },
    (data) => ({
      ...data,
      leads: data.leads.map((l) =>
        l.id === lead.id
          ? { ...l, stage, last_touched_at: new Date().toISOString() }
          : l,
      ),
    }),
  );
}
export async function saveCRMBooking(input: unknown, id?: string) {
  return mutate(
    id ? `/bookings/${encodeURIComponent(id)}` : "/bookings",
    id ? "PATCH" : "POST",
    input,
    (data) => saveDemoBooking(data, input, id),
  );
}
export async function setCRMBookingStatus(
  booking: CRMBooking,
  status: CRMBooking["status"],
) {
  return mutate(
    `/bookings/${encodeURIComponent(booking.id)}`,
    "PATCH",
    { status },
    (data) => {
      const fresh = data.bookings.find((b) => b.id === booking.id);
      if (!fresh) throw new CRMError("Không tìm thấy lịch hẹn.", 404);
      if (isActiveBooking({ status })) {
        if (Date.parse(fresh.appointment_time) <= Date.now())
          throw new CRMError(
            "Lịch hẹn đã qua. Hãy đổi sang thời gian mới trước khi xác nhận.",
          );
        assertBookingAvailable(data.bookings, fresh, fresh.id);
      }
      return {
        ...data,
        bookings: data.bookings.map((b) =>
          b.id === booking.id ? { ...b, status } : b,
        ),
      };
    },
  );
}
export async function loginCRM(password: string) {
  await request("/session", "POST", { password });
}
export async function logoutCRM() {
  await request("/session", "DELETE");
}

import {
  CRMError,
  assertBookingAvailable,
  isActiveBooking,
  normalizePhone,
  validateLead,
  validateBooking,
  APPOINTMENT_DURATION_MS,
  MAX_CONCURRENT_BOOKINGS_PER_STAFF,
  type LeadInput,
  type BookingInput,
  type CRMBooking,
  type CRMLead,
  type CRMSnapshot,
} from "./model";
import {
  readDemoCRM,
  saveDemoBooking,
  saveDemoLead,
  deleteDemoBooking,
  deleteDemoLead,
  writeDemoCRM,
} from "./demo-store";
export interface CRMState extends CRMSnapshot {
  mode: "demo" | "supabase";
}

const AVAILABLE_STAFFS = ["Ngọc Khánh", "Thu Hà", "Hoàng Long"];

async function syncCRMCloudPush(
  data: CRMSnapshot,
  deletedBookingIds?: string[],
  deletedLeadIds?: string[],
  replaceCrm = false,
) {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/sync/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crm: data,
        deletedBookingIds,
        deletedLeadIds,
        replaceCrm,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {}
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
  // Thử đồng bộ từ Cloud Store để đảm bảo nhiều thiết bị (iPhone, Mac) đều nhận dữ liệu mới nhất
  if (typeof window !== "undefined") {
    try {
      const syncRes = await fetch("/api/sync/store", {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData?.crm) {
          writeDemoCRM(localStorage, syncData.crm);
          return { mode: "demo", ...syncData.crm };
        }
      }
    } catch {}
  }

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
  deletedBookingIds?: string[],
  deletedLeadIds?: string[],
): Promise<CRMState> {
  const result = await request(path, method, body);
  if (result.mode !== "demo") return result;
  const data = local(readDemoCRM(localStorage));
  writeDemoCRM(localStorage, data);
  const isDelete = method === "DELETE";
  void syncCRMCloudPush(data, deletedBookingIds, deletedLeadIds, isDelete);
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

export async function saveChatBooking(
  leadInput: LeadInput,
  visit: Omit<BookingInput, "lead_id">,
) {
  const fields = validateLead(leadInput);
  const booking = validateBooking({ ...visit, lead_id: "new-visit" });
  const crm = await loadCRM();
  const linked = crm.leads.find(
    (lead) =>
      fields.inbox_reference && lead.inbox_reference === fields.inbox_reference,
  );
  if (linked?.phone && normalizePhone(linked.phone) !== fields.phone)
    throw new CRMError("Hội thoại đã gắn với một số điện thoại khác.");
  const existing = linked?.phone
    ? linked
    : crm.leads.find((lead) => normalizePhone(lead.phone) === fields.phone);
  const contact = linked
    ? {
        ...linked,
        full_name: fields.full_name,
        phone: fields.phone,
        email: fields.email || linked.email,
      }
    : fields;
  if (crm.mode === "demo") {
    const withLead = existing ? crm : saveDemoLead(crm, contact, linked?.id);
    const lead =
      existing ?? withLead.leads.find((item) => item.phone === fields.phone);
    if (!lead) throw new CRMError("Chưa xác nhận được hồ sơ khách hàng.");

    const start = Date.parse(booking.appointment_time);
    let assignedStaff = booking.assigned_staff || "Ngọc Khánh";
    const getStaffOverlaps = (staff: string) => {
      const target = staff.toLocaleLowerCase("vi").trim();
      return withLead.bookings.filter(
        (b) =>
          isActiveBooking(b) &&
          b.assigned_staff.toLocaleLowerCase("vi").trim() === target &&
          Math.abs(Date.parse(b.appointment_time) - start) < APPOINTMENT_DURATION_MS,
      );
    };

    if (getStaffOverlaps(assignedStaff).length >= MAX_CONCURRENT_BOOKINGS_PER_STAFF) {
      const alternativeStaff = AVAILABLE_STAFFS.find(
        (s) => getStaffOverlaps(s).length < MAX_CONCURRENT_BOOKINGS_PER_STAFF,
      );
      if (alternativeStaff) {
        assignedStaff = alternativeStaff;
      }
    }

    const saved = saveDemoBooking(withLead, { ...booking, lead_id: lead.id, assigned_staff: assignedStaff });
    writeDemoCRM(localStorage, saved);
    void syncCRMCloudPush(saved);
    window.dispatchEvent(new Event("omnichat-crm-change"));
    return { mode: "demo" as const, ...saved };
  }
  const withLead = existing ? crm : await saveCRMLead(contact, linked?.id);
  const lead =
    existing ??
    withLead.leads.find((item) => normalizePhone(item.phone) === fields.phone);
  if (!lead) throw new CRMError("Chưa xác nhận được hồ sơ khách hàng.");
  return saveCRMBooking({ ...booking, lead_id: lead.id });
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
export async function deleteCRMBooking(id: string) {
  return mutate(
    `/bookings/${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    (data) => deleteDemoBooking(data, id),
    [id],
    undefined,
  );
}
export async function deleteCRMLead(id: string) {
  return mutate(
    `/leads/${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    (data) => deleteDemoLead(data, id),
    undefined,
    [id],
  );
}
export async function loginCRM(password: string) {
  await request("/session", "POST", { password });
}
export async function logoutCRM() {
  await request("/session", "DELETE");
}

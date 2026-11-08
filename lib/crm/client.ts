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
export function mergeCRMSnapshots(local: CRMSnapshot, incoming: CRMSnapshot): CRMSnapshot {
  // 1. Gộp danh sách Leads: Bảo toàn 100% Leads của cả local và cloud
  const leadsMap = new Map<string, CRMLead>();
  const phoneToId = new Map<string, string>();

  for (const l of local.leads || []) {
    if (!l || !l.id) continue;
    leadsMap.set(l.id, l);
    if (l.phone) {
      phoneToId.set(normalizePhone(l.phone), l.id);
    }
  }

  for (const inc of incoming.leads || []) {
    if (!inc || !inc.id) continue;
    const normPhone = inc.phone ? normalizePhone(inc.phone) : "";
    const matchedId = leadsMap.has(inc.id)
      ? inc.id
      : (normPhone && phoneToId.has(normPhone) ? phoneToId.get(normPhone) : null);

    if (matchedId && leadsMap.has(matchedId)) {
      const existing = leadsMap.get(matchedId)!;
      const existingTime = Date.parse(existing.last_touched_at || existing.created_at || "0");
      const incomingTime = Date.parse(inc.last_touched_at || inc.created_at || "0");
      const chosen = incomingTime >= existingTime ? { ...existing, ...inc } : { ...inc, ...existing };
      leadsMap.set(matchedId, chosen);
    } else {
      leadsMap.set(inc.id, inc);
      if (normPhone) phoneToId.set(normPhone, inc.id);
    }
  }

  // 2. Gộp danh sách Bookings: Bảo toàn 100% Lịch hẹn
  const bookingsMap = new Map<string, CRMBooking>();
  const slotToId = new Map<string, string>();

  for (const b of local.bookings || []) {
    if (!b || !b.id) continue;
    bookingsMap.set(b.id, b);
    slotToId.set(`${b.lead_id}_${b.appointment_time}`, b.id);
  }

  for (const inc of incoming.bookings || []) {
    if (!inc || !inc.id) continue;
    const slotKey = `${inc.lead_id}_${inc.appointment_time}`;
    const matchedId = bookingsMap.has(inc.id)
      ? inc.id
      : (slotToId.has(slotKey) ? slotToId.get(slotKey) : null);

    if (matchedId && bookingsMap.has(matchedId)) {
      const existing = bookingsMap.get(matchedId)!;
      const existingTime = Date.parse(existing.created_at || "0");
      const incomingTime = Date.parse(inc.created_at || "0");
      const chosen = incomingTime >= existingTime ? { ...existing, ...inc } : { ...inc, ...existing };
      bookingsMap.set(matchedId, chosen);
    } else {
      bookingsMap.set(inc.id, inc);
      slotToId.set(slotKey, inc.id);
    }
  }

  return {
    leads: Array.from(leadsMap.values()),
    bookings: Array.from(bookingsMap.values()),
  };
}

export async function loadCRM(): Promise<CRMState> {
  const localData = typeof window !== "undefined" ? readDemoCRM(localStorage) : { leads: [], bookings: [] };

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
          const merged = mergeCRMSnapshots(localData, syncData.crm);
          writeDemoCRM(localStorage, merged);

          // Nếu máy local có dữ liệu người dùng mà server chưa kịp có, tự động đẩy lên server
          if (
            (localData.leads?.length || 0) > (syncData.crm.leads?.length || 0) ||
            (localData.bookings?.length || 0) > (syncData.crm.bookings?.length || 0)
          ) {
            void syncCRMCloudPush(merged);
          }

          return { mode: "demo", ...merged };
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
    let withLead = crm;
    let lead = existing;

    if (existing) {
      const updatedLead: CRMLead = {
        ...existing,
        full_name: fields.full_name || existing.full_name,
        phone: fields.phone || existing.phone,
        stage: "N3" as const,
        notes: fields.notes || existing.notes,
        last_touched_at: new Date().toISOString(),
      };
      withLead = {
        ...crm,
        leads: crm.leads.map((l) => (l.id === existing.id ? updatedLead : l)),
      };
      lead = updatedLead;
    } else {
      withLead = {
        mode: "demo" as const,
        ...saveDemoLead(crm, { ...contact, stage: "N3" }, linked?.id),
      };
      lead = withLead.leads.find((item) => normalizePhone(item.phone) === fields.phone);
    }
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
    window.dispatchEvent(new Event("storage"));
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

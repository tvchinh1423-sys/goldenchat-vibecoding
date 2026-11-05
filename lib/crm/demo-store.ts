import { DEMO_LEADS } from "@/lib/leads/demo-data";
import { parseSnapshot, STORAGE_KEY as INBOX_KEY } from "@/lib/inbox/storage";
import {
  CRMError,
  assertBookingAvailable,
  isRecord,
  isStage,
  validateBooking,
  validateLead,
  type CRMSnapshot,
  type CRMLead,
  type CRMBooking,
} from "./model";

export const CRM_STORAGE_KEY = "omnichat.crm.golden-palace.v1";
const OLD_STAGE_KEY = "omnichat.leads.golden-palace.stages.v1";
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function seedCRM(): CRMSnapshot {
  const created_at = "2026-11-05T02:00:00.000Z";
  return {
    leads: DEMO_LEADS.map((l) => ({
      id: l.id,
      inbox_reference: ["trang", "anh", "linh"].includes(l.id) ? l.id : null,
      full_name: l.name,
      phone: "",
      email: "",
      notes: l.summary,
      source: ({ Facebook: "facebook", Zalo: "zalo", Web: "web" } as const)[
        l.source
      ],
      stage: l.stage,
      assigned_to: "Ngọc Khánh",
      event_date: l.eventDate ?? "",
      table_count: l.tableCount ?? null,
      last_touched_at: created_at,
      created_at,
    })),
    bookings: [
      {
        id: "demo-visit",
        lead_id: "anh",
        appointment_time: "2026-11-07T03:00:00.000Z",
        event_type: "xem_sanh",
        guests_count: 2,
        assigned_staff: "Ngọc Khánh",
        notes: "Lịch xem sảnh minh họa.",
        status: "pending",
        created_at,
      },
    ],
  };
}
export function parseCRM(raw: string): CRMSnapshot {
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.leads) ||
    !Array.isArray(value.bookings)
  )
    throw new CRMError(
      "Không đọc được dữ liệu CRM đã lưu. Dữ liệu được giữ nguyên; hãy kiểm tra bản lưu trước khi tiếp tục.",
    );
  const ids = new Set<string>();
  for (const l of value.leads) {
    if (
      !isRecord(l) ||
      typeof l.id !== "string" ||
      ids.has(l.id) ||
      !isStage(l.stage) ||
      ![
        "full_name",
        "phone",
        "email",
        "notes",
        "assigned_to",
        "event_date",
        "created_at",
        "last_touched_at",
      ].every((k) => typeof l[k] === "string") ||
      !["facebook", "zalo", "web", "manual"].includes(String(l.source)) ||
      !(l.inbox_reference === null || typeof l.inbox_reference === "string") ||
      !(l.table_count === null || Number.isInteger(l.table_count)) ||
      !Number.isFinite(Date.parse(String(l.created_at))) ||
      !Number.isFinite(Date.parse(String(l.last_touched_at)))
    )
      throw new CRMError(
        "Bản lưu CRM không hợp lệ. Không ghi đè dữ liệu đang có.",
      );
    ids.add(l.id);
  }
  const bookingIds = new Set<string>();
  for (const b of value.bookings) {
    if (
      !isRecord(b) ||
      typeof b.id !== "string" ||
      bookingIds.has(b.id) ||
      !ids.has(String(b.lead_id)) ||
      !["xem_sanh", "thu_mon", "tu_van_su_kien"].includes(
        String(b.event_type),
      ) ||
      !["pending", "confirmed", "completed", "cancelled"].includes(
        String(b.status),
      ) ||
      !Number.isInteger(b.guests_count) ||
      !["assigned_staff", "notes", "created_at", "appointment_time"].every(
        (k) => typeof b[k] === "string",
      ) ||
      !Number.isFinite(Date.parse(String(b.appointment_time))) ||
      !Number.isFinite(Date.parse(String(b.created_at)))
    )
      throw new CRMError(
        "Bản lưu lịch hẹn không hợp lệ. Không ghi đè dữ liệu đang có.",
      );
    bookingIds.add(b.id);
  }
  return {
    leads: value.leads as CRMLead[],
    bookings: value.bookings as CRMBooking[],
  };
}
export function readDemoCRM(storage: StorageLike): CRMSnapshot {
  const raw = storage.getItem(CRM_STORAGE_KEY);
  if (raw) return parseCRM(raw);
  const snapshot = seedCRM();
  const old = storage.getItem(OLD_STAGE_KEY);
  if (old) {
    const stages: unknown = JSON.parse(old);
    if (isRecord(stages))
      snapshot.leads = snapshot.leads.map((l) => {
        const stage = stages[l.id];
        return { ...l, stage: isStage(stage) ? stage : l.stage };
      });
  }
  // Import already-created Inbox leads once; retain the old snapshots untouched.
  const inbox = storage.getItem(INBOX_KEY);
  if (inbox) {
    for (const c of parseSnapshot(inbox)) {
      if (!c.lead) continue;
      const l = c.lead;
      const seed = snapshot.leads.find((s) => s.inbox_reference === c.id);
      if (snapshot.leads.some((s) => s.phone && s.phone === l.phone)) continue;
      const lead: CRMLead = {
        ...seed,
        id: seed?.id ?? l.id,
        inbox_reference: c.id,
        full_name: l.full_name,
        phone: l.phone,
        email: l.email,
        notes: l.demand_notes,
        source: c.channel,
        stage: seed?.stage ?? "N1",
        assigned_to: seed?.assigned_to ?? "",
        event_date: seed?.event_date ?? "",
        table_count: seed?.table_count ?? null,
        created_at: l.created_at,
        last_touched_at: l.created_at,
      };
      if (seed) Object.assign(seed, lead);
      else snapshot.leads.push(lead);
    }
  }
  return snapshot;
}
export function writeDemoCRM(storage: StorageLike, data: CRMSnapshot) {
  // Persist before acknowledging success. Failed writes leave the UI unchanged.
  try {
    storage.setItem(CRM_STORAGE_KEY, JSON.stringify({ version: 1, ...data }));
  } catch {
    throw new CRMError(
      "Không lưu được CRM vào trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ.",
    );
  }
}
export function saveDemoLead(
  snapshot: CRMSnapshot,
  input: unknown,
  id?: string,
): CRMSnapshot {
  const fields = validateLead(input);
  const existing = id
    ? snapshot.leads.find((l) => l.id === id)
    : snapshot.leads.find(
        (l) =>
          fields.inbox_reference &&
          l.inbox_reference === fields.inbox_reference,
      );
  if (id && !existing) throw new CRMError("Không tìm thấy khách hàng.", 404);
  if (
    snapshot.leads.some(
      (l) => l.id !== existing?.id && l.phone === fields.phone,
    )
  )
    throw new CRMError(
      "Số điện thoại đã gắn với một khách hàng trong CRM.",
      409,
    );
  if (!id && existing?.phone && existing.phone !== fields.phone)
    throw new CRMError(
      "Hội thoại đã có khách hàng. Hãy mở hồ sơ để cập nhật.",
      409,
    );
  const now = new Date().toISOString();
  const lead: CRMLead = {
    ...fields,
    stage: !id && existing ? existing.stage : fields.stage,
    id: existing?.id ?? crypto.randomUUID(),
    created_at: existing?.created_at ?? now,
    last_touched_at: now,
  };
  return {
    ...snapshot,
    leads: existing
      ? snapshot.leads.map((l) => (l.id === lead.id ? lead : l))
      : [...snapshot.leads, lead],
  };
}
export function saveDemoBooking(
  snapshot: CRMSnapshot,
  input: unknown,
  id?: string,
): CRMSnapshot {
  const fields = validateBooking(input);
  const existing = id ? snapshot.bookings.find((b) => b.id === id) : undefined;
  if (id && !existing) throw new CRMError("Không tìm thấy lịch hẹn.", 404);
  const lead = snapshot.leads.find((l) => l.id === fields.lead_id);
  if (!lead) throw new CRMError("Không tìm thấy khách hàng.", 404);
  if (existing && existing.lead_id !== fields.lead_id)
    throw new CRMError("Không thể đổi khách hàng của lịch hẹn.");
  assertBookingAvailable(snapshot.bookings, fields, id);
  const now = new Date().toISOString();
  const booking: CRMBooking = {
    ...fields,
    id: existing?.id ?? crypto.randomUUID(),
    status: "pending",
    created_at: existing?.created_at ?? now,
  };
  return {
    leads: snapshot.leads.map((l) =>
      l.id === lead.id
        ? {
            ...l,
            stage: ["N1", "N2"].includes(l.stage) ? "N3" : l.stage,
            last_touched_at: now,
          }
        : l,
    ),
    bookings: existing
      ? snapshot.bookings.map((b) => (b.id === id ? booking : b))
      : [...snapshot.bookings, booking],
  };
}
export function deleteDemoBooking(
  snapshot: CRMSnapshot,
  id: string,
): CRMSnapshot {
  const existing = snapshot.bookings.find((b) => b.id === id);
  if (!existing) throw new CRMError("Không tìm thấy lịch hẹn để xóa.", 404);
  return {
    ...snapshot,
    bookings: snapshot.bookings.filter((b) => b.id !== id),
  };
}

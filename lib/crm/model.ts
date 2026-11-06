import type { LeadStage, PlatformType } from "@/types/database";

export const STAGES: LeadStage[] = ["N1", "N2", "N3", "N4", "N5", "N0"];
export const BOOKING_TYPES = {
  xem_sanh: "Xem sảnh",
  thu_mon: "Thử món",
  tu_van_su_kien: "Tư vấn sự kiện",
} as const;
export const BOOKING_STATUSES = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Đã hoàn tất",
  cancelled: "Đã hủy",
} as const;
export interface CRMLead {
  id: string;
  inbox_reference: string | null;
  full_name: string;
  phone: string;
  email: string;
  notes: string;
  source: PlatformType | "manual";
  stage: LeadStage;
  assigned_to: string;
  event_date: string;
  table_count: number | null;
  last_touched_at: string;
  created_at: string;
}
export interface CRMBooking {
  id: string;
  lead_id: string;
  appointment_time: string;
  event_type: keyof typeof BOOKING_TYPES;
  guests_count: number;
  assigned_staff: string;
  notes: string;
  status: keyof typeof BOOKING_STATUSES;
  created_at: string;
}
export interface CRMSnapshot {
  leads: CRMLead[];
  bookings: CRMBooking[];
}
export type LeadInput = Omit<CRMLead, "id" | "created_at" | "last_touched_at">;
export type BookingInput = Omit<CRMBooking, "id" | "created_at" | "status">;

export class CRMError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export const isStage = (v: unknown): v is LeadStage =>
  STAGES.includes(v as LeadStage);
export function textField(v: unknown, max: number, required = false): string {
  if (typeof v !== "string" || v.trim().length > max || (required && !v.trim()))
    throw new CRMError(
      "Thông tin bị thiếu hoặc quá dài. Vui lòng kiểm tra lại.",
    );
  return v.trim();
}
export function normalizePhone(v: string) {
  return v.replace(/[\s.-]/g, "").replace(/^\+?84/, "0");
}
export function validateLead(value: unknown): LeadInput {
  if (!isRecord(value))
    throw new CRMError("Thông tin khách hàng không hợp lệ.");
  const phone = normalizePhone(textField(value.phone, 30, true));
  if (!/^0[1-9]\d{7,10}$/.test(phone))
    throw new CRMError("Vui lòng nhập số điện thoại hợp lệ (9 đến 11 chữ số).");
  const email = textField(value.email ?? "", 100);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new CRMError("Email chưa hợp lệ.");
  if (!isStage(value.stage))
    throw new CRMError("Giai đoạn khách hàng không hợp lệ.");
  if (!["facebook", "zalo", "web", "manual"].includes(String(value.source)))
    throw new CRMError("Nguồn khách hàng không hợp lệ.");
  const count = value.table_count;
  if (
    count !== null &&
    count !== undefined &&
    (!Number.isInteger(count) || Number(count) < 1 || Number(count) > 2000)
  )
    throw new CRMError("Số bàn cần là số nguyên từ 1 đến 2.000.");
  const eventDate = textField(value.event_date ?? "", 10);
  if (eventDate) {
    const match = /^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/.exec(eventDate);
    const year = Number(match?.[3] ?? 2000);
    const date = new Date(
      Date.UTC(year, Number(match?.[2]) - 1, Number(match?.[1])),
    );
    if (
      !match ||
      year < 1900 ||
      date.getUTCMonth() !== Number(match[2]) - 1 ||
      date.getUTCDate() !== Number(match[1])
    )
      throw new CRMError(
        "Ngày tổ chức cần đúng DD/MM hoặc DD/MM/YYYY; không tự đoán năm.",
      );
  }
  return {
    full_name: textField(value.full_name, 100, true),
    phone,
    email,
    notes: textField(value.notes ?? "", 2000),
    stage: value.stage,
    source: value.source as LeadInput["source"],
    inbox_reference:
      value.inbox_reference == null
        ? null
        : textField(value.inbox_reference, 100, true),
    assigned_to: textField(value.assigned_to ?? "", 100),
    event_date: eventDate,
    table_count: count == null ? null : Number(count),
  };
}
export function validateBooking(
  value: unknown,
  now = Date.now(),
): BookingInput {
  if (!isRecord(value)) throw new CRMError("Thông tin lịch hẹn không hợp lệ.");
  const time = textField(value.appointment_time, 40, true);
  const datePart = /^(\d{4})-(\d{2})-(\d{2})/.exec(time);
  const calendar = new Date(`${time.slice(0, 10)}T00:00:00Z`);
  if (
    !datePart ||
    calendar.getUTCMonth() !== Number(datePart[2]) - 1 ||
    calendar.getUTCDate() !== Number(datePart[3])
  )
    throw new CRMError("Ngày hẹn không hợp lệ.");
  // An explicit timezone is mandatory. Date-only/browser-local values are ambiguous.
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/.test(
      time,
    ) ||
    !Number.isFinite(Date.parse(time)) ||
    Date.parse(time) <= now
  )
    throw new CRMError("Chọn thời gian hẹn trong tương lai (giờ Việt Nam).");
  if (!Object.hasOwn(BOOKING_TYPES, String(value.event_type)))
    throw new CRMError("Loại lịch hẹn không hợp lệ.");
  if (
    !Number.isInteger(value.guests_count) ||
    Number(value.guests_count) < 1 ||
    Number(value.guests_count) > 50
  )
    throw new CRMError("Số người tham gia cần từ 1 đến 50.");
  return {
    lead_id: textField(value.lead_id, 100, true),
    appointment_time: new Date(time).toISOString(),
    event_type: value.event_type as BookingInput["event_type"],
    guests_count: Number(value.guests_count),
    assigned_staff: textField(value.assigned_staff, 100, true),
    notes: textField(value.notes ?? "", 2000),
  };
}
export function isActiveBooking(b: Pick<CRMBooking, "status">) {
  return b.status === "pending" || b.status === "confirmed";
}
export function assertBookingAvailable(
  bookings: CRMBooking[],
  next: BookingInput,
  exceptId?: string,
) {
  const start = Date.parse(next.appointment_time);
  if (
    bookings.some(
      (b) =>
        b.id !== exceptId &&
        isActiveBooking(b) &&
        b.assigned_staff.toLocaleLowerCase("vi") ===
          next.assigned_staff.toLocaleLowerCase("vi") &&
        Math.abs(Date.parse(b.appointment_time) - start) < 60 * 60 * 1000,
    )
  )
    throw new CRMError(
      "Nhân viên đã có lịch trong khung 60 phút này. Hãy chọn giờ hoặc người phụ trách khác.",
      409,
    );
}
export function formatAppointment(time: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(time));
}

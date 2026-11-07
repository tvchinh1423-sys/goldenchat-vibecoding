"use client";
import { useState } from "react";
import { getSmartBookingDefault } from "@/lib/crm/appointment";
import {
  BOOKING_TYPES,
  validateBooking,
  type CRMBooking,
  type BookingInput,
  type CRMLead,
} from "@/lib/crm/model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
function vietnamInput(time: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(time));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function BookingEditor({
  lead,
  booking,
  onClose,
  onSave,
  initialType,
  collectContact,
}: {
  lead: Pick<CRMLead, "id" | "full_name" | "assigned_to">;
  booking?: CRMBooking;
  onClose: () => void;
  onSave: (
    input: BookingInput,
    id?: string,
    contact?: { name: string; phone: string },
  ) => Promise<void>;
  initialType?: BookingInput["event_type"];
  collectContact?: string;
}) {
  const [form, setForm] = useState({
    time: booking
      ? vietnamInput(booking.appointment_time)
      : getSmartBookingDefault(),
    event_type: booking?.event_type ?? initialType ?? "xem_sanh",
    guests_count: booking?.guests_count ?? 2,
    assigned_staff: booking?.assigned_staff || lead.assigned_to || "Ngọc Khánh",
    notes: booking?.notes ?? "",
  });
  const [contact, setContact] = useState({
    name: lead.full_name,
    phone: collectContact ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle className="text-lg font-semibold">
          {booking ? "Đổi lịch hẹn" : "Tạo lịch hẹn"}
        </DialogTitle>
        <DialogDescription className="mt-2 text-xs leading-5 text-muted-foreground">
          {lead.full_name} · Giờ Việt Nam (UTC+7). Mỗi lượt tư vấn 30 phút
          (tối đa 2 lịch 1 lúc). Lịch này chưa giữ chỗ sảnh tiệc.
        </DialogDescription>
        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              const input = validateBooking({
                ...form,
                lead_id: lead.id,
                appointment_time: `${form.time}:00+07:00`,
              });
              await onSave(
                input,
                booking?.id,
                collectContact !== undefined ? contact : undefined,
              );
              onClose();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Chưa lưu được lịch hẹn.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {collectContact !== undefined && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">
                Họ và tên
                <Input
                  required
                  maxLength={100}
                  value={contact.name}
                  onChange={(e) =>
                    setContact({ ...contact, name: e.target.value })
                  }
                />
              </label>
              <label className="block text-xs font-medium">
                Số điện thoại
                <Input
                  required
                  type="tel"
                  maxLength={30}
                  value={contact.phone}
                  onChange={(e) =>
                    setContact({ ...contact, phone: e.target.value })
                  }
                />
              </label>
            </div>
          )}
          <label className="block text-xs font-medium">
            Loại lịch hẹn
            <select
              className="mt-2 w-full rounded-lg border bg-white p-2 text-sm"
              value={form.event_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  event_type: e.target.value as typeof form.event_type,
                })
              }
            >
              {Object.entries(BOOKING_TYPES).map(([key, title]) => (
                <option key={key} value={key}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <div>
            <label className="block text-xs font-medium">
              Thời gian hẹn (giờ Việt Nam)
              <Input
                className="mt-2"
                type="datetime-local"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, time: getSmartBookingDefault() })
                }
                className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
              >
                ⚡ Khung giờ gợi ý: 09:00 sáng
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium">
              Số người tham gia
              <Input
                className="mt-2"
                type="number"
                min={1}
                max={50}
                required
                value={form.guests_count}
                onChange={(e) =>
                  setForm({ ...form, guests_count: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-xs font-medium">
              Người tiếp đón
              <Input
                className="mt-2"
                maxLength={100}
                required
                value={form.assigned_staff}
                onChange={(e) =>
                  setForm({ ...form, assigned_staff: e.target.value })
                }
              />
            </label>
          </div>
          <label className="block text-xs font-medium">
            Ghi chú lịch hẹn
            <Textarea
              className="mt-2"
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-rose-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang lưu..." : "Lưu lịch hẹn"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

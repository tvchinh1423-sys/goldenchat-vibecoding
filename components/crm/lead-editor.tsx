"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LEAD_STAGES } from "@/lib/leads/demo-data";
import {
  BOOKING_STATUSES,
  BOOKING_TYPES,
  formatAppointment,
  validateLead,
  type CRMLead,
  type CRMBooking,
  type LeadInput,
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
export function LeadEditor({
  lead,
  bookings,
  busy,
  onClose,
  onSave,
  onBooking,
  onStatus,
}: {
  lead?: CRMLead;
  bookings: CRMBooking[];
  busy: boolean;
  onClose: () => void;
  onSave: (input: LeadInput, id?: string) => Promise<void>;
  onBooking: (lead: CRMLead, booking?: CRMBooking) => void;
  onStatus: (
    booking: CRMBooking,
    status: CRMBooking["status"],
  ) => Promise<void>;
}) {
  const [form, setForm] = useState<LeadInput>(
    lead ?? {
      full_name: "",
      phone: "",
      email: "",
      notes: "",
      source: "manual",
      stage: "N1",
      inbox_reference: null,
      assigned_to: "Ngọc Khánh",
      event_date: "",
      table_count: null,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savedStage = lead?.stage;
  useEffect(() => {
    if (savedStage) setForm((current) => ({ ...current, stage: savedStage }));
  }, [savedStage]);
  const disabled = busy || saving;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !disabled) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogTitle className="text-lg font-semibold">
          {lead ? "Hồ sơ khách hàng" : "Thêm khách hàng"}
        </DialogTitle>
        <DialogDescription className="mt-2 text-xs leading-5 text-muted-foreground">
          Thông tin tư vấn tiệc cưới & sự kiện Golden Palace. Ngày tổ chức khác
          với lịch hẹn xem sảnh.
        </DialogDescription>
        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setSaving(true);
            try {
              await onSave(validateLead(form), lead?.id);
              onClose();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Chưa lưu được khách hàng.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <fieldset disabled={disabled} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["full_name", "Họ và tên", "text"],
                  ["phone", "Số điện thoại", "tel"],
                  ["email", "Email", "email"],
                  ["assigned_to", "Phụ trách", "text"],
                ] as const
              ).map(([key, title, type]) => (
                <label key={key} className="block text-xs font-medium">
                  {title}
                  <Input
                    className="mt-2"
                    type={type}
                    maxLength={100}
                    required={key === "full_name" || key === "phone"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">
                Ngày tổ chức dự kiến
                <Input
                  className="mt-2"
                  placeholder="DD/MM hoặc DD/MM/YYYY"
                  maxLength={10}
                  value={form.event_date}
                  onChange={(e) =>
                    setForm({ ...form, event_date: e.target.value })
                  }
                />
              </label>
              <label className="block text-xs font-medium">
                Số bàn dự kiến
                <Input
                  className="mt-2"
                  type="number"
                  min={1}
                  max={2000}
                  value={form.table_count ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      table_count: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">
                Giai đoạn
                <select
                  aria-label="Giai đoạn"
                  className="mt-2 w-full rounded-lg border bg-white p-2 text-sm"
                  value={form.stage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stage: e.target.value as LeadInput["stage"],
                    })
                  }
                >
                  {LEAD_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} · {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium">
                Nguồn khách
                <select
                  className="mt-2 w-full rounded-lg border bg-white p-2 text-sm"
                  value={form.source}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source: e.target.value as LeadInput["source"],
                    })
                  }
                >
                  {[
                    ["facebook", "Facebook"],
                    ["zalo", "Zalo"],
                    ["web", "Web"],
                    ["manual", "Nhập tay"],
                  ].map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-xs font-medium">
              Nhu cầu & ghi chú
              <Textarea
                className="mt-2 min-h-24"
                maxLength={2000}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="text-xs text-rose-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={disabled} onClick={onClose}>
              Đóng
            </Button>
            <Button type="submit" disabled={disabled}>
              {saving ? "Đang lưu..." : "Lưu hồ sơ"}
            </Button>
          </div>
        </form>
        {lead && (
          <section
            className="mt-5 space-y-3 border-t pt-4"
            aria-label="Lịch hẹn của khách"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Lịch xem sảnh & tư vấn</h3>
              <Button
                size="sm"
                disabled={disabled}
                onClick={() => onBooking(lead)}
              >
                Tạo lịch hẹn
              </Button>
            </div>
            {bookings.map((b) => (
              <div
                key={b.id}
                className="space-y-2 rounded-xl border bg-slate-50 p-3 text-xs"
              >
                <p className="font-semibold">
                  {BOOKING_TYPES[b.event_type] ?? b.event_type} ·{" "}
                  {formatAppointment(b.appointment_time)}
                </p>
                <p>
                  {b.assigned_staff} · {b.guests_count} người ·{" "}
                  {BOOKING_STATUSES[b.status]}
                </p>
                {b.notes && (
                  <p className="whitespace-pre-wrap text-slate-500">
                    {b.notes}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => onBooking(lead, b)}
                  >
                    Đổi lịch
                  </Button>
                  <label className="flex items-center gap-2">
                    Trạng thái
                    <select
                      aria-label={`Trạng thái lịch ${b.id}`}
                      className="rounded-lg border bg-white p-2"
                      value={b.status}
                      disabled={disabled}
                      onChange={async (e) => {
                        setError("");
                        try {
                          await onStatus(
                            b,
                            e.target.value as CRMBooking["status"],
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Chưa cập nhật được lịch.",
                          );
                        }
                      }}
                    >
                      {Object.entries(BOOKING_STATUSES).map(([key, title]) => (
                        <option key={key} value={key}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
            {!bookings.length && (
              <p className="text-xs text-slate-500">Chưa có lịch hẹn.</p>
            )}
            {lead.inbox_reference && (
              <Link
                className="inline-block text-xs font-medium text-blue-600 hover:underline"
                href={`/inbox?conversation=${encodeURIComponent(lead.inbox_reference)}`}
              >
                Mở hội thoại gốc
              </Link>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}

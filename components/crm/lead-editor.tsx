"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
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
  onDeleteBooking,
  onDeleteLead,
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
  onDeleteBooking?: (booking: CRMBooking) => Promise<void>;
  onDeleteLead?: (lead: CRMLead) => Promise<void>;
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
      <DialogContent className="sm:max-w-xl">
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
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {lead?.id && onDeleteLead && (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs h-9 px-3"
                onClick={async () => {
                  if (
                    window.confirm(
                      `Bạn có chắc chắn muốn XÓA VĨNH VIỄN khách hàng ${lead.full_name} khỏi hệ thống không? (Toàn bộ lịch hẹn liên quan cũng sẽ bị xóa)`,
                    )
                  ) {
                    setError("");
                    try {
                      await onDeleteLead(lead);
                      onClose();
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "Chưa xóa được khách hàng.",
                      );
                    }
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                Xóa khách hàng này
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" disabled={disabled} onClick={onClose}>
                Đóng
              </Button>
              <Button type="submit" disabled={disabled}>
                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
              </Button>
            </div>
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
                  {(b.status === "pending" || b.status === "confirmed") && (
                    <button
                      type="button"
                      disabled={disabled}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      onClick={async () => {
                        if (!window.confirm("Bạn có chắc muốn hủy lịch hẹn này?")) return;
                        setError("");
                        try {
                          await onStatus(b, "cancelled");
                        } catch (error) {
                          setError(error instanceof Error ? error.message : "Chưa hủy được lịch.");
                        }
                      }}
                    >
                      Hủy lịch
                    </button>
                  )}
                  {onDeleteBooking && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={async () => {
                        if (window.confirm("Bạn có chắc chắn muốn xóa lịch hẹn này không?")) {
                          setError("");
                          try {
                            await onDeleteBooking(b);
                          } catch (e) {
                            setError(
                              e instanceof Error
                                ? e.message
                                : "Chưa xóa được lịch.",
                            );
                          }
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg font-medium transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      Xóa lịch
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!bookings.length && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-center text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-600">Khách hàng này hiện chưa có lịch hẹn nào.</p>
                <p className="text-[11px] text-slate-400">
                  Bấm nút <strong>Tạo lịch hẹn</strong> ở trên để xếp lịch mới, hoặc bấm tab <strong>Lịch hẹn</strong> ở ngoài trang quản trị để xem và xóa các lịch hẹn của khách khác.
                </p>
              </div>
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

"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CRMAccessPanel } from "./access-panel";
import { BookingEditor } from "./booking-editor";
import { LeadEditor } from "./lead-editor";
import { CRMBoard } from "./crm-board";
import { LEAD_STAGES } from "@/lib/leads/demo-data";
import { normalizeSearch, CHANNEL_LABELS } from "@/lib/inbox/helpers";
import {
  loadCRM,
  logoutCRM,
  moveCRMLead,
  saveCRMLead,
  saveCRMBooking,
  setCRMBookingStatus,
  deleteCRMBooking,
  type CRMState,
} from "@/lib/crm/client";
import { CRM_STORAGE_KEY } from "@/lib/crm/demo-store";
import {
  CRMError,
  BOOKING_TYPES,
  BOOKING_STATUSES,
  isActiveBooking,
  formatAppointment,
  type CRMLead,
  type CRMBooking,
} from "@/lib/crm/model";

export function CRMDashboard() {
  const [data, setData] = useState<CRMState | null>(null);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState<"kanban" | "list" | "bookings">("kanban");
  const [filters, setFilters] = useState({
    stage: "",
    source: "",
    owner: "",
    stale: false,
    booked: false,
  });
  const [editor, setEditor] = useState<string | null>(null);
  const [bookingEditor, setBookingEditor] = useState<{
    leadId: string;
    booking?: CRMBooking;
  } | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loadCRM());
      setAuth(false);
    } catch (e) {
      setData(null);
      setAuth(e instanceof CRMError && e.status === 401);
      setError(e instanceof Error ? e.message : "Không tải được CRM.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const storage = (e: StorageEvent) => {
      if (e.key === CRM_STORAGE_KEY || e.key === null) void refresh();
    };
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, [refresh]);
  async function mutate(operation: () => Promise<CRMState>, message: string) {
    if (busy) throw new CRMError("Đang lưu thay đổi trước. Vui lòng chờ.");
    setBusy(true);
    setError("");
    try {
      setData(await operation());
      setNotice(message);
    } catch (e) {
      if (e instanceof CRMError && e.status === 401) {
        setData(null);
        setAuth(true);
      }
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const leads = data?.leads ?? [];
  const bookings = data?.bookings ?? [];
  const filtered = leads.filter(
    (l) =>
      normalizeSearch(
        `${l.full_name} ${l.phone} ${l.email} ${l.notes}`,
      ).includes(normalizeSearch(query.trim())) &&
      (!filters.stage || l.stage === filters.stage) &&
      (!filters.source || l.source === filters.source) &&
      (!filters.owner || l.assigned_to === filters.owner) &&
      (!filters.stale ||
        Date.now() - Date.parse(l.last_touched_at) > 7 * 86400000) &&
      (!filters.booked ||
        bookings.some((b) => b.lead_id === l.id && isActiveBooking(b))),
  );
  const sourceName = (s: CRMLead["source"]) =>
    s === "manual" ? "Nhập tay" : CHANNEL_LABELS[s];
  const appointments = bookings
    .filter((b) => filtered.some((l) => l.id === b.lead_id))
    .sort(
      (a, b) => Date.parse(a.appointment_time) - Date.parse(b.appointment_time),
    );
  const selected = leads.find((l) => l.id === editor);
  const bookingLead = leads.find((l) => l.id === bookingEditor?.leadId);
  const control =
    "min-w-0 max-w-full rounded-lg border bg-white px-3 py-2 text-xs";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-blue-600">
            Trung tâm Tiệc cưới & Sự kiện Golden Palace
          </p>
          <h1 className="text-xl font-bold md:text-2xl">
            Phễu khách hàng / Phễu tư vấn
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Theo dõi từ lần hỏi thực đơn đầu tiên đến đặt cọc và chăm sóc sau
            tiệc.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/inbox">Mở hộp thư</Link>
          </Button>
          {data && (
            <Button disabled={busy} onClick={() => setEditor("new")}>
              <Plus />
              Thêm khách
            </Button>
          )}
        </div>
      </div>
      {loading && (
        <p role="status" className="text-sm text-slate-500">
          Đang tải khách hàng...
        </p>
      )}
      {auth ? (
        <CRMAccessPanel onLogin={() => void refresh()} />
      ) : (
        error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"
          >
            {error}
            <Button
              className="ml-3"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={busy || loading}
            >
              Tải lại CRM
            </Button>
          </div>
        )
      )}
      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">
            <p>
              {data.mode === "demo"
                ? "Dữ liệu minh họa · Khách hàng và lịch hẹn được lưu trên trình duyệt này, chưa gửi qua kênh thật."
                : "CRM dùng chung · Khách hàng và lịch hẹn lưu trên Supabase."}{" "}
              Chuyển giai đoạn không xác nhận cọc hay giữ sảnh.
            </p>
            {data.mode === "supabase" && (
              <button
                className="font-semibold underline"
                disabled={busy}
                onClick={async () => {
                  try {
                    await logoutCRM();
                    setData(null);
                    setAuth(true);
                  } catch {
                    setError("Chưa đăng xuất được. Vui lòng thử lại.");
                  }
                }}
              >
                Đăng xuất CRM
              </button>
            )}
          </div>
          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
            aria-label="Thống kê giai đoạn"
          >
            {LEAD_STAGES.map((s) => {
              const count = leads.filter((l) => l.stage === s.id).length;
              return (
                <div key={s.id} className="rounded-xl border bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {s.id} · {s.title}
                  </p>
                  <p className="mt-3">
                    <strong className="text-2xl">{count}</strong>
                    <span className="ml-2 text-xs text-slate-500">
                      {leads.length
                        ? Math.round((count / leads.length) * 100)
                        : 0}
                      % khách
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex gap-1 rounded-xl border bg-white p-1"
              aria-label="Chế độ xem"
            >
              {(
                [
                  ["kanban", "Bảng Kanban"],
                  ["list", "Danh sách & Phễu"],
                  ["bookings", "Lịch hẹn"],
                ] as const
              ).map(([key, title]) => (
                <button
                  key={key}
                  aria-pressed={view === key}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${view === key ? "bg-blue-600 text-white" : "text-slate-600"}`}
                  onClick={() => setView(key)}
                >
                  {title}
                </button>
              ))}
            </div>
            <label className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 text-slate-500">
              <Search className="h-4 w-4" />
              <span className="sr-only">Tìm khách hàng</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tên, SĐT hoặc nhu cầu tiệc..."
                className="w-52 min-w-0 bg-transparent text-xs outline-none"
              />
            </label>
          </div>
          <div
            className="flex flex-wrap items-center gap-3"
            aria-label="Bộ lọc khách hàng"
          >
            <select
              aria-label="Lọc giai đoạn"
              className={control}
              value={filters.stage}
              onChange={(e) =>
                setFilters({ ...filters, stage: e.target.value })
              }
            >
              <option value="">Tất cả giai đoạn</option>
              {LEAD_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.title}
                </option>
              ))}
            </select>
            <select
              aria-label="Lọc nguồn khách"
              className={control}
              value={filters.source}
              onChange={(e) =>
                setFilters({ ...filters, source: e.target.value })
              }
            >
              <option value="">Tất cả nguồn</option>
              {["facebook", "zalo", "web", "manual"].map((s) => (
                <option key={s} value={s}>
                  {sourceName(s as CRMLead["source"])}
                </option>
              ))}
            </select>
            <select
              aria-label="Lọc phụ trách"
              className={control}
              value={filters.owner}
              onChange={(e) =>
                setFilters({ ...filters, owner: e.target.value })
              }
            >
              <option value="">Tất cả phụ trách</option>
              {Array.from(
                new Set(leads.map((l) => l.assigned_to).filter(Boolean)),
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={filters.booked}
                onChange={(e) =>
                  setFilters({ ...filters, booked: e.target.checked })
                }
              />
              Có lịch hẹn đang mở
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={filters.stale}
                onChange={(e) =>
                  setFilters({ ...filters, stale: e.target.checked })
                }
              />
              Chưa ai chạm quá 7 ngày
            </label>
          </div>
          <p role="status" className="min-h-4 text-xs text-slate-500">
            {busy ? "Đang lưu..." : notice}
          </p>
          <h2 className="text-sm font-semibold">
            {view === "bookings"
              ? `${appointments.length} lịch hẹn`
              : `${filtered.length} khách hàng`}
          </h2>
          {view === "kanban" && (
            <CRMBoard
              leads={filtered}
              bookings={bookings}
              busy={busy}
              onOpen={setEditor}
              onMove={async (lead, stage) => {
                try {
                  await mutate(
                    () => moveCRMLead(lead, stage),
                    "Đã lưu giai đoạn khách hàng.",
                  );
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Chưa chuyển được giai đoạn.",
                  );
                }
              }}
            />
          )}
          {view === "list" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      {[
                        "Khách hàng",
                        "Giai đoạn",
                        "Nhu cầu tiệc",
                        "Phụ trách",
                        "Hồ sơ",
                      ].map((s) => (
                        <th key={s} className="p-4">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="p-4">
                          <strong>{l.full_name}</strong>
                          <p className="mt-1 text-blue-600">
                            {l.phone || "Chưa có SĐT"}
                          </p>
                          <p className="mt-1 text-slate-400">
                            {sourceName(l.source)}
                          </p>
                        </td>
                        <td className="p-4">{l.stage}</td>
                        <td className="max-w-xs p-4 leading-5">{l.notes}</td>
                        <td className="p-4">
                          {l.assigned_to || "Chưa phân công"}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditor(l.id)}
                          >
                            Mở hồ sơ
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filtered.length && (
                  <p className="p-5 text-sm text-slate-500">
                    Không có khách khớp bộ lọc.
                  </p>
                )}
              </div>
              <aside
                className="space-y-3 rounded-xl border bg-white p-5"
                aria-label="Phân bố phễu"
              >
                <h3 className="text-sm font-semibold">Phễu tư vấn hiện tại</h3>
                <p className="text-xs leading-5 text-slate-500">
                  Tỷ trọng theo bộ lọc hiện tại; chưa phải tỷ lệ chuyển đổi theo
                  thời gian.
                </p>
                {LEAD_STAGES.map((s) => {
                  const count = filtered.filter((l) => l.stage === s.id).length;
                  const pct = filtered.length
                    ? Math.round((count / filtered.length) * 100)
                    : 0;
                  return (
                    <div key={s.id}>
                      <p className="mb-2 flex justify-between text-[11px]">
                        <span>
                          {s.id} · {s.title}
                        </span>
                        <span>
                          {count} · {pct}%
                        </span>
                      </p>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </aside>
            </div>
          )}
          {view === "bookings" && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {appointments.map((b) => {
                const l = leads.find((l) => l.id === b.lead_id)!;
                const statusBadgeClasses = {
                  pending: "bg-amber-50 text-amber-700 border-amber-200",
                  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  completed: "bg-blue-50 text-blue-700 border-blue-200",
                  cancelled: "bg-slate-100 text-slate-500 border-slate-200 line-through",
                }[b.status] || "bg-slate-50 text-slate-700 border-slate-200";

                return (
                  <article
                    key={b.id}
                    className="space-y-3 rounded-xl border bg-white p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{l.full_name}</p>
                          <p className="text-xs text-blue-600 font-medium">
                            {l.phone || "Chưa có SĐT"}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClasses}`}
                        >
                          {BOOKING_STATUSES[b.status]}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                        <p className="text-xs font-semibold text-violet-700">
                          {BOOKING_TYPES[b.event_type] ?? b.event_type} ·{" "}
                          {formatAppointment(b.appointment_time)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tiếp đón: <span className="font-medium text-slate-700">{b.assigned_staff}</span> · {b.guests_count} khách
                        </p>
                        {b.notes && (
                          <p className="text-[11px] text-slate-600 italic border-t border-slate-200/60 pt-1 mt-1">
                            &quot;{b.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Edit, Confirm, Cancel, Delete */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        onClick={() => setEditor(l.id)}
                      >
                        Mở hồ sơ & đổi lịch
                      </Button>

                      <div className="flex items-center gap-1">
                        {b.status === "pending" && (
                          <button
                            type="button"
                            title="Xác nhận lịch hẹn"
                            disabled={busy}
                            onClick={() =>
                              mutate(
                                () => setCRMBookingStatus(b, "confirmed"),
                                "Đã xác nhận lịch hẹn.",
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md font-medium transition"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Xác nhận
                          </button>
                        )}

                        {b.status !== "cancelled" && (
                          <button
                            type="button"
                            title="Hủy lịch hẹn"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc muốn hủy lịch hẹn của khách ${l.full_name}?`)) {
                                mutate(
                                  () => setCRMBookingStatus(b, "cancelled"),
                                  "Đã hủy lịch hẹn.",
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md font-medium transition"
                          >
                            <XCircle className="w-3 h-3 text-amber-600" />
                            Hủy
                          </button>
                        )}

                        <button
                          type="button"
                          title="Xóa hẳn lịch hẹn"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn XÓA HẲN lịch hẹn của khách ${l.full_name}?`)) {
                              mutate(
                                () => deleteCRMBooking(b.id),
                                "Đã xóa vĩnh viễn lịch hẹn khỏi hệ thống.",
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-md font-medium transition"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {!appointments.length && (
                <p className="text-sm text-slate-500">
                  Chưa có lịch hẹn khớp bộ lọc.
                </p>
              )}
            </div>
          )}
        </>
      )}
      {data && editor && (editor === "new" || selected) && (
        <LeadEditor
          key={editor}
          lead={selected}
          bookings={bookings.filter((b) => b.lead_id === editor)}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={(input, id) =>
            mutate(() => saveCRMLead(input, id), "Đã lưu hồ sơ khách hàng.")
          }
          onBooking={(lead, booking) =>
            setBookingEditor({ leadId: lead.id, booking })
          }
          onStatus={(b, status) =>
            mutate(
              () => setCRMBookingStatus(b, status),
              "Đã cập nhật trạng thái lịch hẹn.",
            )
          }
          onDeleteBooking={(b) =>
            mutate(
              () => deleteCRMBooking(b.id),
              "Đã xóa vĩnh viễn lịch hẹn khỏi hệ thống.",
            )
          }
        />
      )}
      {data && bookingEditor && bookingLead && (
        <BookingEditor
          key={bookingEditor.booking?.id ?? "new-booking"}
          lead={bookingLead}
          booking={bookingEditor.booking}
          onClose={() => setBookingEditor(null)}
          onSave={(input, id) =>
            mutate(
              () => saveCRMBooking(input, id),
              "Đã lưu lịch hẹn tư vấn; chưa giữ chỗ sảnh tiệc.",
            )
          }
        />
      )}
    </div>
  );
}

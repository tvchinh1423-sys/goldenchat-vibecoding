"use client";
import { useState } from "react";
import { CalendarDays, GripVertical } from "lucide-react";
import { CHANNEL_LABELS } from "@/lib/inbox/helpers";
import { LEAD_STAGES } from "@/lib/leads/demo-data";
import {
  BOOKING_TYPES,
  isActiveBooking,
  isStage,
  formatAppointment,
  type CRMLead,
  type CRMBooking,
} from "@/lib/crm/model";
export function CRMBoard({
  leads,
  bookings,
  busy,
  onMove,
  onOpen,
}: {
  leads: CRMLead[];
  bookings: CRMBooking[];
  busy: boolean;
  onMove: (lead: CRMLead, stage: CRMLead["stage"]) => Promise<void>;
  onOpen: (id: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  function moveLead(id: string, stage: CRMLead["stage"]) {
    const lead = leads.find((l) => l.id === id);
    if (lead && !busy) void onMove(lead, stage);
    setDraggedId(null);
  }
  return (
    <div
      className="overflow-x-auto pb-4"
      role="region"
      aria-label="Phễu tư vấn Kanban"
      tabIndex={0}
    >
      <div className="grid min-w-[1620px] grid-cols-6 gap-3">
        {LEAD_STAGES.map((stage) => {
          const members = leads.filter((lead) => lead.stage === stage.id);
          return (
            <section
              key={stage.id}
              aria-label={stage.id + " · " + stage.title}
              className="min-h-[420px] rounded-2xl border border-slate-200 bg-slate-100/60 p-3"
              onDragOver={(event) => {
                if (draggedId) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedId) moveLead(draggedId, stage.id);
              }}
            >
              <div className="mb-4 min-h-20 px-1">
                <h3 className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                  <span>
                    {stage.id} · {stage.title}
                  </span>
                  <span className={"rounded-full px-2 py-1 " + stage.color}>
                    {members.length}
                  </span>
                </h3>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  {stage.description}
                </p>
              </div>
              <div className="space-y-3">
                {members.map((lead) => (
                  <article
                    key={lead.id}
                    draggable={!busy}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", lead.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedId(lead.id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {lead.full_name}
                      </h4>
                      <GripVertical
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 cursor-grab text-slate-400"
                      />
                    </div>
                    <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                      {lead.source === "manual"
                        ? "Nhập tay"
                        : CHANNEL_LABELS[lead.source]}
                    </span>
                    <p className="my-3 whitespace-pre-wrap text-xs leading-6 text-slate-600">
                      {lead.notes}
                    </p>
                    {(lead.event_date || lead.table_count) && (
                      <p className="mb-3 text-[11px] font-medium text-slate-700">
                        {[
                          lead.event_date && "Tiệc: " + lead.event_date,
                          lead.table_count && lead.table_count + " bàn",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {bookings
                      .filter(
                        (b) => b.lead_id === lead.id && isActiveBooking(b),
                      )
                      .slice(0, 1)
                      .map((b) => (
                        <p
                          key={b.id}
                          className="mb-3 flex items-center gap-1.5 text-[11px] text-violet-700"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {BOOKING_TYPES[b.event_type] ?? b.event_type}:{" "}
                          {formatAppointment(b.appointment_time)}
                        </p>
                      ))}
                    {lead.phone && (
                      <p className="mb-3 text-xs text-blue-600">{lead.phone}</p>
                    )}
                    <label className="block border-t pt-3 text-[10px] text-slate-500">
                      Giai đoạn của {lead.full_name}
                      <select
                        aria-label={`Giai đoạn của ${lead.full_name}`}
                        className="mt-1.5 w-full rounded-lg border bg-white p-2 text-xs text-slate-700"
                        value={lead.stage}
                        disabled={busy}
                        onChange={(event) => {
                          if (isStage(event.target.value))
                            moveLead(lead.id, event.target.value);
                        }}
                      >
                        {LEAD_STAGES.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.id} · {option.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="mt-3 w-full rounded-lg border border-blue-100 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      onClick={() => onOpen(lead.id)}
                    >
                      Mở hồ sơ {lead.full_name}
                    </button>
                  </article>
                ))}
                {!members.length && (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs leading-5 text-slate-400">
                    Chưa có khách khớp bộ lọc ở giai đoạn này
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  GripVertical,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import { DEMO_LEADS, LEAD_STAGES } from "@/lib/leads/demo-data";
import { normalizeSearch } from "@/lib/inbox/helpers";
import type { LeadStage } from "@/types/database";

const STORAGE_KEY = "omnichat.leads.golden-palace.stages.v1";
const isStage = (value: unknown): value is LeadStage =>
  LEAD_STAGES.some((stage) => stage.id === value);

export default function LeadsPage() {
  const [stages, setStages] = useState<Record<string, LeadStage>>({});
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
          throw new Error("Invalid stages");
        const entries = Object.entries(parsed);
        if (
          !entries.every(
            ([id, stage]) =>
              DEMO_LEADS.some((lead) => lead.id === id) && isStage(stage),
          )
        )
          throw new Error("Invalid stage");
        setStages(Object.fromEntries(entries));
      }
    } catch {
      setNotice("Không đọc được giai đoạn đã lưu. Đang hiển thị dữ liệu mẫu.");
    }
    setReady(true);
  }, []);

  const leads = DEMO_LEADS.map((lead) => ({
    ...lead,
    stage: stages[lead.id] ?? lead.stage,
  }));
  const filtered = leads.filter((lead) =>
    normalizeSearch(lead.name + " " + lead.summary).includes(
      normalizeSearch(query.trim()),
    ),
  );
  function moveLead(id: string, stage: LeadStage) {
    if (!ready || !DEMO_LEADS.some((lead) => lead.id === id)) return;
    const next = { ...stages, [id]: stage };
    setStages(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setNotice("Đã lưu giai đoạn trên trình duyệt này.");
    } catch {
      setNotice(
        "Đã chuyển trên màn hình nhưng chưa lưu được. Hãy kiểm tra dung lượng trình duyệt.",
      );
    }
    setDraggedId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-blue-600">
            Golden Palace · Tư vấn tiệc cưới & sự kiện
          </p>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
            Phễu khách hàng / Phễu tư vấn
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Theo dõi từ lần hỏi thực đơn đầu tiên đến đặt cọc và chăm sóc sau
            tiệc.
          </p>
        </div>
        <Link
          href="/inbox"
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50"
        >
          <MessageSquare className="h-4 w-4" />
          Mở hộp thư
        </Link>
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">
        Dữ liệu minh họa · Chuyển giai đoạn bằng kéo thả hoặc menu trên thẻ.
        Thay đổi được lưu trên trình duyệt; chưa ghi CRM, xác nhận cọc hay tạo
        lịch thật.
      </div>
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
        aria-label="Thống kê giai đoạn"
      >
        {LEAD_STAGES.map((stage) => {
          const count = leads.filter((lead) => lead.stage === stage.id).length;
          return (
            <div key={stage.id} className="rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">
                {stage.id} · {stage.title}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className="text-2xl text-slate-900">{count}</strong>
                <span className="text-xs text-slate-500">
                  {Math.round((count / leads.length) * 100)}% khách
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Users className="h-4 w-4" />
          Bảng Kanban · {filtered.length} khách
        </h2>
        <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-slate-500">
          <Search className="h-4 w-4" />
          <span className="sr-only">Tìm khách hàng</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tên hoặc nhu cầu tiệc..."
            className="w-52 bg-transparent text-xs text-slate-800 outline-none"
          />
        </label>
      </div>
      <p role="status" className="min-h-4 text-xs text-slate-500">
        {notice}
      </p>
      <div
        className="overflow-x-auto pb-4"
        role="region"
        aria-label="Phễu tư vấn Kanban"
        tabIndex={0}
      >
        <div className="grid min-w-[1620px] grid-cols-6 gap-3">
          {LEAD_STAGES.map((stage) => {
            const members = filtered.filter((lead) => lead.stage === stage.id);
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
                      draggable={ready}
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
                          {lead.name}
                        </h4>
                        <GripVertical
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 cursor-grab text-slate-400"
                        />
                      </div>
                      <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                        {lead.source}
                      </span>
                      <p className="my-3 text-xs leading-6 text-slate-600">
                        {lead.summary}
                      </p>
                      {(lead.eventDate || lead.tableCount) && (
                        <p className="mb-3 text-[11px] font-medium text-slate-700">
                          {[
                            lead.eventDate && "Tiệc: " + lead.eventDate,
                            lead.tableCount && lead.tableCount + " bàn",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {lead.appointment && (
                        <p className="mb-3 flex items-center gap-1.5 text-[11px] text-violet-700">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Xem sảnh: {lead.appointment}
                        </p>
                      )}
                      <label className="block border-t pt-3 text-[10px] text-slate-500">
                        Giai đoạn của {lead.name}
                        <select
                          aria-label={`Giai đoạn của ${lead.name}`}
                          className="mt-1.5 w-full rounded-lg border bg-white p-2 text-xs text-slate-700"
                          value={lead.stage}
                          disabled={!ready}
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
                    </article>
                  ))}
                  {!members.length && (
                    <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs leading-5 text-slate-400">
                      {query
                        ? "Không có khách khớp tìm kiếm"
                        : "Chưa có khách ở giai đoạn này"}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

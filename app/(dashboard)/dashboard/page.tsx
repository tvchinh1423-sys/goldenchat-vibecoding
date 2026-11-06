"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { CRMAccessPanel } from "@/components/crm/access-panel";
import { Button } from "@/components/ui/button";
import { loadCRM } from "@/lib/crm/client";
import { CRMError } from "@/lib/crm/model";
import { createDemoConversations } from "@/lib/inbox/demo-data";
import { parseSnapshot, STORAGE_KEY } from "@/lib/inbox/storage";

const channels = [
  { id: "facebook", label: "Facebook Messenger", color: "bg-blue-600" },
  { id: "zalo", label: "Zalo cá nhân", color: "bg-sky-500" },
  { id: "web", label: "Web Widget", color: "bg-violet-500" },
] as const;

// A sample cohort until lead-stage history is available.
const funnel = [
  { stage: "N1", label: "Lead thô", count: 50, color: "bg-blue-600" },
  {
    stage: "N3",
    label: "Khảo sát / Xem sảnh",
    count: 20,
    color: "bg-indigo-500",
  },
  { stage: "N4", label: "Chính thức", count: 8, color: "bg-violet-500" },
];
const formatNumber = new Intl.NumberFormat("vi-VN");
const formatPercent = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  maximumFractionDigits: 1,
});

type CRMReport =
  | { state: "loading" | "auth" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      leads: number;
      visits: number;
      mode: "demo" | "supabase";
    };

export default function DashboardPage() {
  const [inbox, setInbox] = useState<
    | { total: number; counts: Record<(typeof channels)[number]["id"], number> }
    | "unavailable"
    | null
  >(null);
  const [crm, setCRM] = useState<CRMReport>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const conversations = saved
        ? parseSnapshot(saved)
        : createDemoConversations();
      const counts = { facebook: 0, zalo: 0, web: 0 };
      for (const conversation of conversations) counts[conversation.channel]++;
      setInbox({ total: conversations.length, counts });
    } catch {
      setInbox("unavailable");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCRM()
      .then(({ leads, bookings, mode }) => {
        if (cancelled) return;
        setCRM({
          state: "ready",
          leads: leads.filter((lead) => lead.stage !== "N0").length,
          visits: bookings.filter(
            (booking) =>
              booking.event_type === "xem_sanh" &&
              booking.status !== "cancelled",
          ).length,
          mode,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCRM(
          error instanceof CRMError && error.status === 401
            ? { state: "auth" }
            : {
                state: "error",
                message:
                  error instanceof CRMError
                    ? error.message
                    : "Không đọc được dữ liệu CRM.",
              },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function reloadCRM() {
    setCRM({ state: "loading" });
    setAttempt((previous) => previous + 1);
  }

  const inboxData = inbox === "unavailable" ? null : inbox;
  const crmSource =
    crm.state === "ready" && crm.mode === "demo" ? "CRM demo" : "CRM";
  const metrics = [
    {
      label: "Tổng hội thoại tiếp nhận",
      value: inboxData ? formatNumber.format(inboxData.total) : "—",
      note: "Inbox demo · Gồm hội thoại đã lưu trữ",
      icon: MessageSquare,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Tỷ lệ AI tự động giải quyết",
      value: formatPercent.format(0.82),
      note: "Số liệu minh họa",
      icon: Sparkles,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Lead N1–N5 thu thập được",
      value: crm.state === "ready" ? formatNumber.format(crm.leads) : "—",
      note: crmSource + " · Theo giai đoạn hiện tại",
      icon: Users,
      color: "bg-sky-50 text-sky-700",
    },
    {
      label: "Lịch hẹn xem sảnh đã xếp",
      value: crm.state === "ready" ? formatNumber.format(crm.visits) : "—",
      note: crmSource + " · Trừ lịch đã hủy",
      icon: CalendarDays,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 sm:p-7">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Golden Palace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Báo cáo thống kê
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Tổng quan hội thoại, khách hàng và lịch hẹn xem sảnh.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/leads">
            Mở CRM <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </header>

      <dl
        aria-label="Chỉ số tổng quan"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {metrics.map(({ label, value, note, icon: Icon, color }) => (
          <div
            key={label}
            className="panel flex flex-col items-start p-3.5 sm:p-5"
          >
            <span className={`mb-3 rounded-xl p-2.5 ${color}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <dt className="text-sm font-medium leading-5 text-slate-700">
              {label}
            </dt>
            <dd className="mt-auto pt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
              {value}
            </dd>
            <dd className="mt-1 text-xs leading-5 text-slate-600">{note}</dd>
          </div>
        ))}
      </dl>

      {crm.state === "loading" && (
        <p role="status" className="text-sm text-slate-600">
          Đang tải chỉ số CRM…
        </p>
      )}
      {crm.state === "auth" && <CRMAccessPanel onLogin={reloadCRM} />}
      {crm.state === "error" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p role="alert" className="text-sm text-amber-900">
            {crm.message}
          </p>
          <Button variant="outline" size="sm" onClick={reloadCRM}>
            Tải lại chỉ số CRM
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5 sm:p-6" aria-labelledby="channel-title">
          <h2
            id="channel-title"
            className="text-lg font-semibold text-slate-900"
          >
            Hội thoại theo kênh
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Phân bổ theo nguồn tiếp nhận trong Inbox demo.
          </p>
          {inbox === "unavailable" && (
            <p role="alert" className="mt-5 text-sm text-amber-800">
              Không đọc được dữ liệu Inbox demo trong trình duyệt.
            </p>
          )}
          {inboxData && (
            <ul className="mt-6 space-y-4">
              {channels.map(({ id, label, color }) => {
                const count = inboxData.counts[id];
                const share = count / inboxData.total;
                return (
                  <li key={id}>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                      <span className="font-medium text-slate-700">
                        {label}
                      </span>
                      <span className="tabular-nums text-slate-600">
                        {formatNumber.format(count)} ·{" "}
                        {formatPercent.format(share)}
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel p-5 sm:p-6" aria-labelledby="funnel-title">
          <h2
            id="funnel-title"
            className="text-lg font-semibold text-slate-900"
          >
            Phễu chuyển đổi khách hàng
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Minh họa tỷ lệ đạt từng mốc trên cùng một nhóm 50 lead ban đầu.
          </p>
          <ol className="mt-6 space-y-4">
            {funnel.map(({ stage, label, count, color }) => {
              const share = count / funnel[0].count;
              return (
                <li key={stage}>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                    <span className="font-medium text-slate-700">
                      {stage} · {label}
                    </span>
                    <span className="tabular-nums text-slate-600">
                      {formatNumber.format(count)} ·{" "}
                      {formatPercent.format(share)}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="flex h-4 justify-center overflow-hidden rounded-md bg-slate-100"
                  >
                    <div
                      className={`rounded-md ${color}`}
                      style={{ width: `${share * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

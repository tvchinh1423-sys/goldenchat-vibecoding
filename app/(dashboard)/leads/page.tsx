"use client";

import React from "react";
import Link from "next/link";
import { Users, ArrowRight, Bot } from "lucide-react";

export default function LeadsPlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
        <Users className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Quản lý Lead & Phễu Tuyển Sinh (N1 - N5) — Đang được phát triển
      </h2>
      <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
        Phần việc do <strong className="text-slate-800">Chị Hiền</strong> phụ trách theo phân công (Biểu đồ Phễu Funnel tỷ lệ chuyển đổi và Bảng Kanban 6 cột N1-N5).
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/training"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
        >
          <Bot className="w-4 h-4" />
          Xem màn hình Huấn luyện Bot (/training)
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

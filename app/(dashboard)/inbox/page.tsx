"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight, Sparkles } from "lucide-react";

export default function InboxPlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
        <MessageSquare className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Hộp thư (Inbox 3 Cột) — Đang được phát triển
      </h2>
      <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
        Phần việc do <strong className="text-slate-800">Chị Hiền</strong> phụ trách theo phân công (Danh sách hội thoại đa kênh, khung chat 2 chiều có nút Soạn nháp AI, Panel tóm tắt & bóc tách SĐT/Email).
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/training"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
        >
          <Sparkles className="w-4 h-4" />
          Xem màn hình Huấn luyện Bot (/training)
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Bot, Users, Search, Sparkles, Settings, Smartphone } from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Inbox owns its viewport and header; retain the shared shell for other modules.
  if (pathname === "/inbox" || pathname.startsWith("/inbox/"))
    return <>{children}</>;

  const navItems = [
    {
      name: "Kênh chat",
      href: "/inbox",
      icon: MessageSquare,
      badge: "18",
    },
    {
      name: "Bot tư vấn khách",
      href: "/training",
      icon: Bot,
    },
    {
      name: "Quản lý Lead & Phễu",
      href: "/leads",
      icon: Users,
    },
    {
      name: "Cài đặt kênh",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Tải App",
      href: "/download",
      icon: Smartphone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Navigation Bar theo chuẩn UI Mẫu */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight text-base">
              OmniChat AI
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex max-w-full items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`}
                  />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[11px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Global Search Cmd+K */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhanh... (Cmd + K)"
              className="w-56 lg:w-64 pl-9 pr-8 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center border border-blue-200">
              C
            </div>
            <span className="text-xs font-medium text-slate-700 hidden lg:inline">
              Trần Vân Chinh
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-[1700px] w-full mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Chuẩn Zalo App) */}
      <MobileBottomNav />
    </div>
  );
}

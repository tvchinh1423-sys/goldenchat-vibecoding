"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Bot, Users, Settings, Download } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Tin nhắn",
      href: "/inbox",
      icon: MessageSquare,
      badge: "18",
    },
    {
      name: "Trợ lý Bot",
      href: "/training",
      icon: Bot,
    },
    {
      name: "Khách hàng",
      href: "/leads",
      icon: Users,
    },
    {
      name: "Cài đặt",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Tải App",
      href: "/download",
      icon: Download,
    },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 flex items-center justify-around py-1.5 px-2 pb-[max(env(safe-area-inset-bottom),6px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden transition-all"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/inbox"
            ? pathname === "/inbox" || pathname.startsWith("/inbox/")
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
              isActive
                ? "text-blue-600 scale-105 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "stroke-[2.5px] -translate-y-0.5" : "stroke-2"
                }`}
              />
              {item.badge && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-extrabold shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] tracking-tight mt-1 ${
                isActive ? "text-blue-600 font-semibold" : "text-slate-500"
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

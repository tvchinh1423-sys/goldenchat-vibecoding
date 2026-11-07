"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  MessageSquare,
  Bot,
  Users,
  Settings,
  Download,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/mobile/haptics";
import { useAuth } from "@/lib/auth/auth-context";
import { useInboxUnreadCount } from "@/lib/inbox/use-unread-count";

export function MobileBottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { role, canAccessSettings, canManageUsers } = useAuth();
  const unreadCount = useInboxUnreadCount();

  const settingsOrUsersItem = canAccessSettings
    ? {
        name: "Cài đặt",
        href: "/settings",
        icon: Settings,
      }
    : canManageUsers
    ? {
        name: "Nhân sự",
        href: "/users",
        icon: UserCheck,
      }
    : {
        name: "Cài đặt",
        href: "/settings",
        icon: Settings,
      };

  interface NavItem {
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      name: "Tin nhắn",
      href: "/inbox",
      icon: MessageSquare,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : undefined,
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
      name: "Báo cáo",
      href: "/dashboard",
      icon: BarChart3,
    },
    settingsOrUsersItem,
    {
      name: "Tải App",
      href: "/download",
      icon: Download,
    },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 grid h-[var(--mobile-nav-height)] grid-cols-6 items-start pt-1 border-t border-slate-200/90 bg-white/95 pl-[max(0.15rem,var(--safe-left))] pr-[max(0.15rem,var(--safe-right))] pb-[var(--safe-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden",
        className
      )}
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
            aria-current={isActive ? "page" : undefined}
            onClick={() => triggerHaptic("light")}
            className={`relative flex h-11 min-w-0 flex-col items-center justify-center whitespace-nowrap rounded-xl px-0.5 transition-all active:scale-95 ${
              isActive
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "stroke-[2.5px] -translate-y-0.5 text-blue-600" : "stroke-2 text-slate-500"
                }`}
              />
              {item.badge && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-extrabold shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[9.5px] tracking-tight mt-1 truncate max-w-full ${
                isActive ? "text-blue-600 font-bold" : "text-slate-500"
              }`}
            >
              {item.name}
            </span>
            {isActive && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  MessageSquare,
  Bot,
  Users,
  Search,
  Sparkles,
  Settings,
  Smartphone,
  UserCheck,
  Lock,
} from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAuth } from "@/lib/auth/auth-context";
import { UserProfileMenu } from "@/components/auth/user-profile-menu";
import { UserManagementModal } from "@/components/users/user-management-modal";
import { LoginDialog } from "@/components/auth/login-dialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, canManageUsers, canAccessSettings } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Inbox owns its viewport and header; retain the shared shell for other modules.
  if (pathname === "/inbox" || pathname.startsWith("/inbox/"))
    return <>{children}</>;

  const baseNavItems = [
    {
      name: "Kênh chat",
      href: "/inbox",
      icon: MessageSquare,
      badge: "18",
      visible: true,
    },
    {
      name: "Bot tư vấn khách",
      href: "/training",
      icon: Bot,
      visible: true,
      badge: role === "staff" ? "Thử bot" : undefined,
    },
    {
      name: "Quản lý Lead & Phễu",
      href: "/leads",
      icon: Users,
      visible: true,
    },
    {
      name: "Báo cáo",
      href: "/dashboard",
      icon: BarChart3,
      visible: true,
    },
    {
      name: "Quản lý nhân sự",
      href: "/users",
      icon: UserCheck,
      visible: canManageUsers,
      badge: "Phân quyền",
    },
    {
      name: "Cài đặt kênh",
      href: "/settings",
      icon: Settings,
      visible: canAccessSettings,
      locked: !canAccessSettings,
    },
    {
      name: "Tải App",
      href: "/download",
      icon: Smartphone,
      visible: true,
    },
  ];

  const navItems = baseNavItems.filter((i) => i.visible);

  return (
    <div className="app-safe-x min-h-dvh bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Navigation Bar theo chuẩn UI Mẫu */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 pb-2.5 pt-[calc(0.625rem+var(--safe-top))] md:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3 md:gap-6">
          <Link href="/inbox" className="flex items-center gap-2 group py-0.5" title="OmniChat AI — Trang chủ Hộp thư">
            <Image
              src="/logo-ngang.png"
              alt="OmniChat AI"
              width={160}
              height={44}
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              priority
            />
            <span className="sr-only">OmniChat AI</span>
          </Link>

          {/* Navigation Tabs */}
          <nav aria-label="Điều hướng quản trị" className="hidden max-w-full items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60 md:flex">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-500"}`}
                  />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Global Search Cmd+K & User Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhanh... (Cmd + K)"
              className="w-48 xl:w-56 pl-9 pr-8 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
              ⌘K
            </kbd>
          </div>

          {/* User Profile Menu with Role Switcher & Management */}
          <UserProfileMenu
            onOpenUserManagement={() => setShowUserModal(true)}
            onOpenLoginModal={() => setShowLoginModal(true)}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 pb-[calc(var(--mobile-nav-height)+1rem)] sm:px-4 sm:pt-4 md:p-6 max-w-[1700px] w-full mx-auto">
        {children}
      </main>

      {/* User Management Modal */}
      <UserManagementModal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
      />

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Mobile Bottom Navigation Bar (Chuẩn Zalo App) */}
      <MobileBottomNav />
    </div>
  );
}

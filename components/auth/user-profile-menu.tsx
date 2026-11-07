"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_CONFIGS, UserRole } from "@/lib/auth/types";
import {
  ShieldCheck,
  ShieldAlert,
  Headphones,
  LogOut,
  Users,
  ChevronDown,
  Sparkles,
  Check,
  UserCheck,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { triggerHaptic } from "@/lib/mobile/haptics";

interface Props {
  onOpenUserManagement?: () => void;
  onOpenLoginModal?: () => void;
}

export function UserProfileMenu({
  onOpenUserManagement,
  onOpenLoginModal,
}: Props) {
  const {
    currentUser,
    role,
    isAuthenticated,
    users,
    quickSwitch,
    logout,
    canManageUsers,
  } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!isAuthenticated || !currentUser || !role) {
    return (
      <button
        onClick={() => {
          triggerHaptic("light");
          if (onOpenLoginModal) onOpenLoginModal();
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span>Đăng nhập</span>
      </button>
    );
  }

  const roleConfig = ROLE_CONFIGS[role];

  const handleSwitch = async (userId: string) => {
    triggerHaptic("medium");
    setSwitching(userId);
    try {
      await quickSwitch(userId);
    } finally {
      setSwitching(null);
      setOpen(false);
    }
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case "admin":
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />;
      case "manager":
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;
      case "staff":
        return <Headphones className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic("light");
          setOpen(!open);
        }}
        className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border transition-all active:scale-98 ${
          role === "admin"
            ? "bg-purple-50/80 border-purple-200/80 hover:bg-purple-100/60"
            : role === "manager"
            ? "bg-blue-50/80 border-blue-200/80 hover:bg-blue-100/60"
            : "bg-emerald-50/80 border-emerald-200/80 hover:bg-emerald-100/60"
        }`}
        title={`Đang đăng nhập: ${currentUser.name} (${roleConfig.label})`}
        aria-label="Menu tài khoản & phân quyền"
      >
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center text-white shadow-xs ${
            role === "admin"
              ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
              : role === "manager"
              ? "bg-gradient-to-tr from-blue-600 to-cyan-600"
              : "bg-gradient-to-tr from-emerald-600 to-teal-600"
          }`}
        >
          {currentUser.name.charAt(0)}
        </div>

        {/* User Info */}
        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
              {currentUser.name}
            </span>
          </div>
          <span
            className={`inline-block text-[10px] font-bold mt-0.5 ${roleConfig.color}`}
          >
            {roleConfig.badgeLabel}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-slate-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center text-white shadow-xs ${
                  role === "admin"
                    ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                    : role === "manager"
                    ? "bg-gradient-to-tr from-blue-600 to-cyan-600"
                    : "bg-gradient-to-tr from-emerald-600 to-teal-600"
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  @{currentUser.username} · {currentUser.title || roleConfig.label}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConfig.badgeColor}`}
                  >
                    {getRoleIcon(role)}
                    <span>{roleConfig.label}</span>
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 leading-tight">
              {roleConfig.description}
            </p>
          </div>

          {/* Quick Switch Demo Roles (Test 1-chạm) */}
          <div className="mb-2">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Chuyển vai trò test nhanh:</span>
              </span>
              <span className="text-[10px] text-slate-400">1-chạm</span>
            </div>
            <div className="space-y-1">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const isBusy = switching === u.id;
                const uRoleConfig = ROLE_CONFIGS[u.role];
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isCurrent || isBusy}
                    onClick={() => handleSwitch(u.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? "bg-blue-50/70 border border-blue-200/80 font-semibold text-blue-900 cursor-default"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs">{getRoleIcon(u.role)}</span>
                      <div className="text-left truncate">
                        <span className="font-medium text-[11px]">{u.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({uRoleConfig.badgeLabel})
                        </span>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-bold shrink-0">
                        <Check className="w-3 h-3" />
                        <span>Đang dùng</span>
                      </span>
                    ) : isBusy ? (
                      <span className="text-[10px] text-slate-400">Đang đổi...</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1">
            {/* User Management Action (Admin & Manager only) */}
            {canManageUsers && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (onOpenUserManagement) onOpenUserManagement();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Quản lý người dùng & phân quyền</span>
              </button>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={async () => {
                triggerHaptic("medium");
                setOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

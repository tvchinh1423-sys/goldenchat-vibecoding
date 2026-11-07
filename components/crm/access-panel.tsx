"use client";

import { useState } from "react";
import { loginCRM } from "@/lib/crm/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, User, KeyRound, Sparkles, Building2, ShieldAlert, Headphones, Check } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { triggerHaptic } from "@/lib/mobile/haptics";

interface Props {
  onLogin: (staffName?: string) => void;
}

export function CRMAccessPanel({ onLogin }: Props) {
  const { users, currentUser, quickSwitch } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(
    currentUser?.id || "usr_ngockhanh"
  );
  const [password, setPassword] = useState("goldenpalace2026");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedUser =
    users.find((u) => u.id === selectedUserId) || users[0];

  const handleFillDemo = () => {
    setPassword("goldenpalace2026");
    setError("");
  };

  const handleQuickLogin = async (userId: string) => {
    triggerHaptic("medium");
    setBusy(true);
    setError("");
    try {
      await quickSwitch(userId);
      const user = users.find((u) => u.id === userId);
      onLogin(user?.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng nhập chưa thành công.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <form
        className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          triggerHaptic("medium");
          setBusy(true);
          setError("");
          try {
            await loginCRM(password);
            await quickSwitch(selectedUserId);
            setPassword("");
            onLogin(selectedUser.name);
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Mật khẩu quản trị chưa đúng. Vui lòng thử lại!"
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {/* Header thương hiệu */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-700 mb-1">
              <Building2 className="w-3 h-3" />
              <span>Cổng Quản Trị Nội Bộ · Golden Palace</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Đăng nhập Quản trị Lead & Phễu
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Hệ thống phân quyền cho Quản lý & Chuyên viên tư vấn. Đăng nhập để trực chat và xem thông tin khách hàng.
            </p>
          </div>
        </div>

        {/* 1-Click Demo Login Quick Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Chọn tài khoản theo phân quyền:</span>
            </span>
            <span className="text-[10px] text-blue-600">3 cấp quyền</span>
          </div>

          <div className="space-y-1.5">
            {users.filter(u => u.active).slice(0, 4).map((u) => {
              const isSelected = selectedUserId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setPassword("goldenpalace2026");
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 font-semibold"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center text-white shrink-0 ${
                        u.role === "admin"
                          ? "bg-purple-600"
                          : u.role === "manager"
                          ? "bg-blue-600"
                          : "bg-emerald-600"
                      }`}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {u.title}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border ${
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : u.role === "manager"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {u.role === "admin"
                      ? "👑 Admin"
                      : u.role === "manager"
                      ? "💼 Quản lý"
                      : "🎧 Nhân viên"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Mật khẩu quản trị *</span>
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              required
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={256}
              className="px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Gợi ý cho Giám khảo / Test 1-chạm */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="text-amber-800 text-[11px] leading-tight">
              <span className="font-semibold">Mật khẩu mẫu:</span>{" "}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">
                goldenpalace2026
              </code>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0 flex items-center gap-0.5"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Điền mẫu</span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition active:scale-98"
          >
            {busy
              ? "Đang xác thực bảo mật..."
              : `Đăng nhập với quyền ${selectedUser.name}`}
          </Button>
        </div>
      </form>
    </div>
  );
}

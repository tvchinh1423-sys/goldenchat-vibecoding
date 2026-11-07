"use client";

import { useState } from "react";
import { loginCRM } from "@/lib/crm/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, User, KeyRound, Building2 } from "lucide-react";
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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedUser =
    users.find((u) => u.id === selectedUserId) || users[0];

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

        {/* Chọn tài khoản */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Tài khoản xác thực</span>
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-10"
          >
            {users.filter(u => u.active).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === "admin" ? "Admin" : u.role === "manager" ? "Quản lý" : "Nhân viên"})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 pt-1">
          {/* Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Mật khẩu *</span>
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              required
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={256}
              className="px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 focus:bg-white h-10"
            />
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
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition active:scale-98 h-10"
          >
            {busy
              ? "Đang xác thực bảo mật..."
              : `Xác nhận Đăng nhập (${selectedUser.name})`}
          </Button>
        </div>
      </form>
    </div>
  );
}

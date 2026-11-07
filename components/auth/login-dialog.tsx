"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import {
  KeyRound,
  User,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerHaptic } from "@/lib/mobile/haptics";

interface Props {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export function LoginDialog({
  open = true,
  onClose,
  onSuccess,
  title = "Đăng nhập Hệ Thống OmniChat",
  subtitle = "Hệ thống Chatbot FAQ & Đặt Lịch Tư Vấn Đa Kênh — Golden Palace",
}: Props) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("medium");
    setError("");

    if (!username.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setBusy(true);

    try {
      await login(username.trim(), password);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập không thành công.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {onClose && (
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header với Logo Dọc */}
        <div className="text-center space-y-3">
          <Image
            src="/logo-doc.png"
            alt="OmniChat AI Logo"
            width={180}
            height={108}
            className="h-20 sm:h-24 w-auto mx-auto object-contain drop-shadow-xs transition-transform hover:scale-105"
            priority
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-700 mb-1">
              <Lock className="w-3 h-3 text-blue-600" />
              <span>Hệ Thống Phân Quyền Bảo Mật · Golden Palace</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Tên đăng nhập</span>
            </label>
            <Input
              type="text"
              autoComplete="username"
              required
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-xs rounded-xl bg-slate-50 focus:bg-white h-10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Mật khẩu</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs rounded-xl bg-slate-50 focus:bg-white pr-9 h-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-98 h-10"
          >
            {busy ? "Đang xác thực..." : "Xác nhận Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  );
}

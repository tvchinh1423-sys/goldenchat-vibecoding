"use client";

import React from "react";
import { Download } from "lucide-react";
import { usePWA } from "./pwa-provider";
import { cn } from "@/lib/utils";

interface InstallAppButtonProps {
  className?: string;
  variant?: "header" | "compact";
}

/**
 * Nút mời tải và cài đặt ứng dụng OmniChat AI.
 * - Chỉ hiển thị đối với các thiết bị CHƯA tải ứng dụng về máy (!isStandalone).
 * - Tự động ẩn hoàn toàn khi người dùng đã cài đặt ứng dụng PWA độc lập (Standalone mode).
 * - Hỗ trợ một chạm: Kích hoạt prompt PWA gốc trên Android/Windows/Chrome hoặc mở hướng dẫn 3 bước cho Safari iOS/iPad.
 */
export function InstallAppButton({ className, variant = "header" }: InstallAppButtonProps) {
  const { isStandalone, handleInstallClick, isAppleDevice } = usePWA();

  // Nếu đã cài đặt ứng dụng về máy (PWA Standalone), ẩn hoàn toàn nút mời tải
  if (isStandalone) {
    return null;
  }

  const tooltipText = isAppleDevice
    ? "Cài đặt ứng dụng OmniChat lên màn hình chính (iPhone / iPad)"
    : "Cài đặt ứng dụng OmniChat về máy (PWA)";

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        title={tooltipText}
        aria-label="Cài đặt ứng dụng về máy"
        className={cn(
          "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-emerald-300/80 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 transition active:scale-95 shadow-2xs cursor-pointer",
          className
        )}
      >
        <Download className="w-4 h-4 text-emerald-600" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      title={tooltipText}
      aria-label="Cài đặt ứng dụng về máy"
      className={cn(
        "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition active:scale-95 shadow-2xs cursor-pointer animate-in fade-in",
        className
      )}
    >
      <Download className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:-translate-y-0.5" />
      <span className="inline">Cài App</span>
    </button>
  );
}

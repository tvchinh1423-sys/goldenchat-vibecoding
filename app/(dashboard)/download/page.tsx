"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Smartphone,
  Laptop,
  Apple,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "windows" | "mac">("android");

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error navigator.standalone is iOS Safari specific
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        "Trình duyệt của bạn có thể cài đặt trực tiếp bằng cách bấm biểu tượng Cài đặt trên thanh địa chỉ hoặc menu 'Thêm vào màn hình chính'."
      );
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đa nền tảng · Chuẩn PWA Native 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tải & Cài Đặt OmniChat AI
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
            Dùng mượt mà như app Zalo trên điện thoại (iPhone, Android) và phần mềm độc lập trên máy tính (Windows, Mac) mà không cần chờ xét duyệt từ cửa hàng ứng dụng.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isInstalled ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-md">
                <CheckCircle2 className="w-5 h-5" />
                <span>Ứng dụng đã được cài đặt trên thiết bị này</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-50 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Cài Đặt Ngay (1 Chạm)</span>
              </button>
            )}

            <Link
              href="/inbox"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-medium text-sm transition"
            >
              <span>Vào Hộp thư Chat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Chọn Hệ Điều Hành */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Chọn Hệ Điều Hành Của Bạn
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hướng dẫn cài đặt nhanh trong 10 giây cho từng dòng máy
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab("android")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
              activeTab === "android"
                ? "bg-blue-50/80 border-blue-500 text-blue-700 font-semibold shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Smartphone className="w-5 h-5 mb-1 text-emerald-600" />
            <span className="text-sm">Android</span>
            <span className="text-[11px] text-slate-400 font-normal">Samsung, Xiaomi...</span>
          </button>

          <button
            onClick={() => setActiveTab("ios")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
              activeTab === "ios"
                ? "bg-blue-50/80 border-blue-500 text-blue-700 font-semibold shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Apple className="w-5 h-5 mb-1 text-slate-800" />
            <span className="text-sm">iPhone / iPad</span>
            <span className="text-[11px] text-slate-400 font-normal">iOS Safari</span>
          </button>

          <button
            onClick={() => setActiveTab("windows")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
              activeTab === "windows"
                ? "bg-blue-50/80 border-blue-500 text-blue-700 font-semibold shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Laptop className="w-5 h-5 mb-1 text-blue-600" />
            <span className="text-sm">Windows (PC)</span>
            <span className="text-[11px] text-slate-400 font-normal">Win 10, Win 11</span>
          </button>

          <button
            onClick={() => setActiveTab("mac")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
              activeTab === "mac"
                ? "bg-blue-50/80 border-blue-500 text-blue-700 font-semibold shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Apple className="w-5 h-5 mb-1 text-indigo-600" />
            <span className="text-sm">macOS (Mac)</span>
            <span className="text-[11px] text-slate-400 font-normal">MacBook, iMac</span>
          </button>
        </div>

        {/* Tab Content: Android */}
        {activeTab === "android" && (
          <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Cách cài đặt trên điện thoại Android (Samsung, Oppo, Xiaomi, Vivo...)
            </h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-slate-900">Mở link bằng Google Chrome</p>
                  <p className="text-slate-500 text-xs mt-0.5">Truy cập vào địa chỉ: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">https://goldenchat-vibecoding.vercel.app</code></p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-slate-900">Bấm Cài Đặt Ứng Dụng</p>
                  <p className="text-slate-500 text-xs mt-0.5">Bấm dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải màn hình ➔ Chọn <strong>&quot;Cài đặt ứng dụng&quot;</strong> hoặc <strong>&quot;Thêm vào Màn hình chính&quot;</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-slate-900">Mở App & Sử Dụng Chuẩn Zalo</p>
                  <p className="text-slate-500 text-xs mt-0.5">Icon <strong>OmniChat AI</strong> sẽ xuất hiện trên màn hình điện thoại. Chạm vào mở là toàn màn hình không có thanh web, nhận thông báo và quản lý chat siêu nhanh.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Không tốn dung lượng bộ nhớ</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Tự động cập nhật bản mới nhất</span>
            </div>
          </div>
        )}

        {/* Tab Content: iOS */}
        {activeTab === "ios" && (
          <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Apple className="w-4 h-4 text-slate-800" />
              Cách cài đặt trên iPhone & iPad (iOS Safari)
            </h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-slate-900">Mở bằng trình duyệt Safari</p>
                  <p className="text-slate-500 text-xs mt-0.5">Mở link <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">https://goldenchat-vibecoding.vercel.app</code> trên Safari (không mở bằng tab ẩn của Zalo/Facebook).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-slate-900">Bấm nút Chia Sẻ (Share)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Ở thanh công cụ đáy Safari, bấm vào biểu tượng <strong>hình vuông có mũi tên hướng lên [↑]</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-slate-900">Chọn &quot;Thêm vào MH chính&quot; (Add to Home Screen)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Cuộn danh sách xuống và chọn <strong>&quot;Thêm vào MH chính&quot;</strong> ➔ Bấm nút <strong>Thêm (Add)</strong> ở góc trên bên phải.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Tương thích hoàn hảo tai thỏ & Dynamic Island</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Giao diện điều hướng đáy chuẩn Apple</span>
            </div>
          </div>
        )}

        {/* Tab Content: Windows */}
        {activeTab === "windows" && (
          <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              Cách cài đặt trên máy tính Windows (Chạy như phần mềm riêng biệt)
            </h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-slate-900">Mở trên Google Chrome hoặc Microsoft Edge</p>
                  <p className="text-slate-500 text-xs mt-0.5">Mở trình duyệt trên máy tính và truy cập trang web.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-slate-900">Bấm biểu tượng Cài đặt trên thanh địa chỉ</p>
                  <p className="text-slate-500 text-xs mt-0.5">Ở góc phải cuối thanh địa chỉ URL, sẽ có biểu tượng <strong>Cài đặt ứng dụng</strong> (hình máy tính hoặc dấu mũi tên tải xuống). Bấm vào đó và chọn <strong>&quot;Cài đặt&quot; (Install)</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-slate-900">Ghim vào thanh Taskbar</p>
                  <p className="text-slate-500 text-xs mt-0.5">OmniChat AI sẽ mở ra trong một cửa sổ riêng không viền trình duyệt. Chuột phải vào icon ở thanh Taskbar và chọn <strong>&quot;Pin to taskbar&quot; (Ghim vào thanh tác vụ)</strong>.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Tương thích Windows 10 & 11</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Khởi động cực nhẹ, không tốn RAM</span>
            </div>
          </div>
        )}

        {/* Tab Content: macOS */}
        {activeTab === "mac" && (
          <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Apple className="w-4 h-4 text-indigo-600" />
              Cách cài đặt trên máy Mac (macOS Sonoma / Ventura / Monterey)
            </h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-slate-900">Trên Safari (macOS Sonoma trở lên)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Bấm menu <strong>Tệp (File)</strong> trên thanh menu ➔ Chọn <strong>&quot;Thêm vào thanh Dock...&quot; (Add to Dock...)</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-slate-900">Trên Chrome cho Mac</p>
                  <p className="text-slate-500 text-xs mt-0.5">Bấm vào biểu tượng cài đặt ở cuối thanh địa chỉ hoặc menu 3 chấm ➔ Chọn <strong>&quot;Cài đặt OmniChat AI&quot;</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Đóng Gói Thành File APK / EXE Thực Thụ */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Xuất File Cài Đặt (.APK cho Android & .EXE cho Windows)
              </h3>
              <p className="text-xs text-slate-400">
                Dành cho nhu cầu gửi file cài đặt độc lập qua Zalo, Drive hoặc nộp bài thi
              </p>
            </div>
          </div>

          <a
            href="https://www.pwabuilder.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
          >
            <span>Mở PWABuilder (Microsoft)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Chúng tôi đã tích hợp sẵn tệp cấu hình <code>manifest.json</code> và <code>icon vector</code> tiêu chuẩn quốc tế. Bạn chỉ cần nhập URL web vào công cụ <strong>PWABuilder của Microsoft</strong> là có thể tự động tải về file <strong>.APK</strong> để cài lên máy Android hoặc file đóng gói cho <strong>Windows</strong> trong vòng 1 phút!
        </p>
      </div>
    </div>
  );
}

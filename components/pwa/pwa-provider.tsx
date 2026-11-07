"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Bell,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  subscribeInAppNotifications,
  type InAppNotification,
  requestNotificationPermission,
} from "@/lib/notifications";
import { triggerHaptic } from "@/lib/mobile/haptics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Install prompt states
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // In-app notifications
  const [activeNotification, setActiveNotification] = useState<InAppNotification | null>(null);

  // Notification permission banner
  const [showPermPrompt, setShowPermPrompt] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for updates
            reg.onupdatefound = () => {
              const installing = reg.installing;
              if (installing) {
                installing.onstatechange = () => {
                  if (installing.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[PWA] Đã có phiên bản cập nhật mới");
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari specific
      window.navigator.standalone === true;

    setIsStandalone(isStandaloneMode);

    // 3. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    // 4. Handle Android/Chrome beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Only show banner if dismissed not recently
      const dismissed = sessionStorage.getItem("omnichat_pwa_dismissed");
      if (!dismissed && !isStandaloneMode) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If iOS and not standalone, show prompt after 4s
    if (isAppleDevice && !isStandaloneMode) {
      const dismissed = sessionStorage.getItem("omnichat_pwa_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowInstallBanner(true), 4000);
        return () => clearTimeout(timer);
      }
    }

    // 5. Check Notification Permission
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      const notifDismissed = sessionStorage.getItem("omnichat_notif_dismissed");
      if (!notifDismissed) {
        const timer = setTimeout(() => setShowPermPrompt(true), 6000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Listen to in-app notification triggers
  useEffect(() => {
    const unsubscribe = subscribeInAppNotifications((notif) => {
      setActiveNotification(notif);
      const timer = setTimeout(() => {
        setActiveNotification((curr) => (curr?.id === notif.id ? null : curr));
      }, 5500);
      return () => clearTimeout(timer);
    });
    return unsubscribe;
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic("medium");
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Navigate to download page as fallback
      router.push("/download");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsStandalone(true);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } catch {
      router.push("/download");
    }
  };

  const dismissInstallBanner = () => {
    triggerHaptic("light");
    setShowInstallBanner(false);
    sessionStorage.setItem("omnichat_pwa_dismissed", "true");
  };

  const handleRequestPermission = async () => {
    triggerHaptic("medium");
    setShowPermPrompt(false);
    sessionStorage.setItem("omnichat_notif_dismissed", "true");
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      triggerHaptic("success");
    }
  };

  return (
    <>
      {children}

      {/* 1. In-App Notification Banner (iOS Dynamic Island Style) */}
      {activeNotification && (
        <aside
          aria-label="Thông báo tin nhắn mới"
          className="fixed top-2.5 inset-x-3 sm:left-auto sm:right-4 sm:w-96 z-[9999] pointer-events-auto animate-in slide-in-from-top-4 duration-300"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-md">
              {activeNotification.type === "booking" ? (
                <Calendar className="w-5 h-5 text-amber-300" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => {
                triggerHaptic("light");
                if (activeNotification.url) {
                  router.push(activeNotification.url);
                }
                setActiveNotification(null);
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-blue-300 tracking-tight truncate">
                  {activeNotification.title}
                </p>
                <span className="text-[10px] text-slate-400">Vừa xong</span>
              </div>
              <p className="text-xs text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                {activeNotification.body}
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveNotification(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Notification Permission Floating Pill */}
      {showPermPrompt && !activeNotification && (
        <aside
          aria-label="Bật thông báo khách hàng"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[9990] w-[calc(100%-1.5rem)] max-w-sm pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-blue-200 flex items-center justify-between gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">Bật thông báo khách nhắn?</p>
              <p className="text-[11px] text-slate-500 leading-tight truncate">Nhận báo tin nhắn & lịch hẹn ngay</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={handleRequestPermission}
                className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Bật
              </Button>
              <button
                onClick={() => {
                  setShowPermPrompt(false);
                  sessionStorage.setItem("omnichat_notif_dismissed", "true");
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
                aria-label="Để sau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 3. Floating PWA Install Prompt Banner (Mobile Native) */}
      {showInstallBanner && !isStandalone && pathname !== "/download" && (
        <aside
          aria-label="Cài đặt ứng dụng OmniChat"
          className="fixed bottom-[calc(var(--mobile-nav-height)+0.5rem)] inset-x-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 z-[9980] pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 md:hidden"
        >
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Image
                src="/icon-192.png"
                alt="OmniChat AI Icon"
                width={40}
                height={40}
                className="w-10 h-10 rounded-xl shadow-md object-cover shrink-0 ring-1 ring-white/20"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">OmniChat AI</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-500 text-white rounded-full font-bold">App</span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">Cài đặt về máy để dùng mượt hơn</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Cài ngay
              </Button>
              <button
                onClick={dismissInstallBanner}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
                aria-label="Đóng banner cài đặt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 4. iOS Safari Add to Home Screen Modal Guide */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-end justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm text-slate-900 space-y-4 shadow-2xl border border-slate-100 mb-2 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/apple-touch-icon.png"
                  alt="OmniChat AI Icon"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl shadow-md object-cover ring-1 ring-slate-100"
                />
                <div>
                  <h3 id="ios-install-title" className="text-sm font-bold">Cài đặt trên iPhone/iPad</h3>
                  <p className="text-xs text-slate-500">Chỉ mất 5 giây với Safari</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                aria-label="Đóng hướng dẫn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-700 leading-snug">
                  Bấm biểu tượng <strong>Chia sẻ</strong> (
                  <Share className="inline w-3.5 h-3.5 text-blue-600" />
                  ) ở thanh công cụ dưới cùng của trình duyệt Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-700 leading-snug">
                  Cuộn xuống và chọn <strong>&quot;Thêm vào MH chính&quot;</strong> (
                  <PlusSquare className="inline w-3.5 h-3.5 text-blue-600" />
                  ).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-700 leading-snug">
                  Bấm <strong>&quot;Thêm&quot;</strong> ở góc trên bên phải để hoàn tất. OmniChat sẽ mở toàn màn hình như ứng dụng gốc!
                </p>
              </div>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold py-2.5"
              onClick={() => setShowIOSGuide(false)}
            >
              Tôi đã hiểu
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

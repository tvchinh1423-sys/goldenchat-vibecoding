"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  updateAppBadge,
  type InAppNotification,
} from "@/lib/notifications";
import { isSoundMuted, setSoundMuted, playNotificationChime } from "@/lib/chat/sound";
import { triggerHaptic } from "@/lib/mobile/haptics";

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [muted, setMuted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Khởi tạo và lắng nghe thay đổi thông báo
  useEffect(() => {
    const list = getStoredNotifications();
    setNotifications(list);
    setMuted(isSoundMuted());

    const unread = list.filter((n) => !n.read).length;
    updateAppBadge(unread);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ notifications: InAppNotification[]; unreadCount: number }>;
      if (customEvent.detail?.notifications) {
        setNotifications(customEvent.detail.notifications);
      } else {
        const fresh = getStoredNotifications();
        setNotifications(fresh);
      }
    };

    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (typeof customEvent.detail?.muted === "boolean") {
        setMuted(customEvent.detail.muted);
      }
    };

    window.addEventListener("omnichat-notifications-updated", handleUpdate);
    window.addEventListener("omnichat-sound-mute-change", handleMuteChange);

    return () => {
      window.removeEventListener("omnichat-notifications-updated", handleUpdate);
      window.removeEventListener("omnichat-sound-mute-change", handleMuteChange);
    };
  }, []);

  // Đóng khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleMute = () => {
    triggerHaptic("light");
    const nextState = !muted;
    setMuted(nextState);
    setSoundMuted(nextState);
    if (!nextState) {
      playNotificationChime(true);
    }
  };

  const handleTestSound = () => {
    triggerHaptic("medium");
    playNotificationChime(true);
  };

  const handleItemClick = (notif: InAppNotification) => {
    triggerHaptic("light");
    markNotificationAsRead(notif.id);
    setOpen(false);
    if (notif.url) {
      router.push(notif.url);
    }
  };

  const handleMarkAllRead = () => {
    triggerHaptic("light");
    markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    triggerHaptic("medium");
    clearAllNotifications();
  };

  const renderIcon = (type?: string) => {
    switch (type) {
      case "booking":
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        );
      case "lead":
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case "system":
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icon Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic("light");
          setOpen(!open);
        }}
        aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ""}`}
        title={unreadCount > 0 ? `Có ${unreadCount} thông báo chưa đọc` : "Chuông thông báo"}
        className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors active:scale-95"
      >
        <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? "text-slate-800" : ""}`} />

        {/* Badge số lượng thông báo đỏ */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-white font-black text-[10px] shadow-sm animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40" />
          </span>
        )}
      </button>

      {/* Dropdown Trung tâm Thông báo (Notification Center Popover) */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Nút Nghe thử âm báo */}
              <button
                type="button"
                onClick={handleTestSound}
                title="Nghe thử âm chuông thông báo"
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>

              {/* Nút Bật/Tắt Âm thanh */}
              <button
                type="button"
                onClick={handleToggleMute}
                title={muted ? "Bật âm thanh chuông" : "Tắt âm thanh chuông"}
                className={`p-1.5 rounded-lg transition ${
                  muted ? "text-rose-500 hover:bg-rose-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Nút Đánh dấu đã đọc tất cả */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Đánh dấu tất cả là đã đọc"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-1" />
                <p className="text-xs text-slate-500 font-medium">Bạn không có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Các tin nhắn và lịch hẹn mới sẽ xuất hiện tại đây</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleItemClick(notif)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors ${
                    !notif.read ? "bg-blue-50/40" : ""
                  }`}
                >
                  {renderIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !notif.read ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-2xs" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50 rounded-b-2xl">
            <Link
              href="/inbox"
              onClick={() => setOpen(false)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] inline-flex items-center gap-1"
            >
              <span>Vào Hộp thư</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-600 text-[11px] transition inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa lịch sử</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

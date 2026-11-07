"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Settings,
  Radio,
  Globe,
  Bell,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  HelpCircle,
  Save,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Code2,
  ShieldAlert,
  Smartphone,
  Volume2,
  Vibrate,
  Download,
} from "lucide-react";
import { triggerHaptic } from "@/lib/mobile/haptics";
import { sendOmniNotification, requestNotificationPermission } from "@/lib/notifications";
import { useAuth } from "@/lib/auth/auth-context";

export default function SettingsPage() {
  const { role, canAccessSettings, quickSwitch } = useAuth();
  const [activeTab, setActiveTab] = useState<"botcake" | "widget" | "telegram" | "sla" | "pwa">("botcake");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Mobile App & PWA state
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error navigator standalone
        window.navigator.standalone === true;
      setIsPwaInstalled(standalone);
    }
  }, []);

  // Botcake Config state
  const [webhookUrl, setWebhookUrl] = useState("https://goldenchat-vibecoding.vercel.app/api/webhook/botcake");
  const [verifyToken, setVerifyToken] = useState("omnichat_kstudy_vibecoding_2026");
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhook/botcake`);
    }
  }, []);

  // Widget Config state
  const [widgetTitle, setWidgetTitle] = useState("Golden Palace - Hỗ trợ tiệc cưới & sự kiện");
  const [widgetGreeting, setWidgetGreeting] = useState("Dạ Golden Palace xin chào Quý khách! Em có thể hỗ trợ tư vấn thực đơn hay đặt lịch xem sảnh tiệc ạ?");
  const [widgetColor, setWidgetColor] = useState("#2563eb");
  const [widgetPosition, setWidgetPosition] = useState<"right" | "left">("right");

  // Telegram Config state
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [alertOnLead, setAlertOnLead] = useState(true);
  const [alertOnGuardrail, setAlertOnGuardrail] = useState(true);
  const [testTelegramStatus, setTestTelegramStatus] = useState<string | null>(null);
  const [testTelegramLoading, setTestTelegramLoading] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTg = localStorage.getItem("omnichat.settings.telegram");
        if (savedTg) {
          const parsed = JSON.parse(savedTg);
          if (parsed.token) setTelegramToken(parsed.token);
          if (parsed.chatId) setTelegramChatId(parsed.chatId);
          if (parsed.alertOnLead !== undefined) setAlertOnLead(parsed.alertOnLead);
          if (parsed.alertOnGuardrail !== undefined) setAlertOnGuardrail(parsed.alertOnGuardrail);
        }
        const savedWidget = localStorage.getItem("omnichat.settings.widget");
        if (savedWidget) {
          const parsed = JSON.parse(savedWidget);
          if (parsed.title) setWidgetTitle(parsed.title);
          if (parsed.greeting) setWidgetGreeting(parsed.greeting);
          if (parsed.color) setWidgetColor(parsed.color);
          if (parsed.position) setWidgetPosition(parsed.position);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // SLA state
  const [slaWarningMinutes, setSlaWarningMinutes] = useState(15);
  const [slaCriticalHours, setSlaCriticalHours] = useState(8);
  const [defaultStaff, setDefaultStaff] = useState("Trần Diệu Thúy");
  const [saveNotice, setSaveNotice] = useState(false);

  // Copy to clipboard
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Test Ping Botcake Webhook
  const handleTestWebhookPing = async () => {
    setPingLoading(true);
    setPingStatus(null);
    try {
      const res = await fetch("/api/webhook/botcake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "facebook",
          conversation_id: "ping_test_session",
          customer: { name: "Khách test Webhook", phone: "0912345678" },
          message: { text: "Ping kiểm tra kết nối Webhook Botcake" },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPingStatus("Kết nối thành công! Webhook phản hồi tốt: " + (data.botReply || "OK"));
      } else {
        setPingStatus("Lỗi phản hồi: " + (data.error || "Không xác định"));
      }
    } catch (e: any) {
      setPingStatus("Lỗi kết nối tới webhook endpoint: " + e.message);
    } finally {
      setPingLoading(false);
    }
  };

  // Test Telegram Alert
  const handleTestTelegram = async () => {
    setTestTelegramLoading(true);
    setTestTelegramStatus("Đang kiểm tra và gửi tin nhắn thử nghiệm...");
    try {
      const res = await fetch("/api/telegram/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramToken.trim() || undefined,
          chatId: telegramChatId.trim() || undefined,
          type: "test",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestTelegramStatus("✅ Thành công! Đã gửi thông báo test tới Telegram.");
      } else {
        setTestTelegramStatus(`❌ Lỗi Telegram: ${data.error || "Không gửi được tin nhắn"}`);
      }
    } catch (e: any) {
      setTestTelegramStatus(`❌ Lỗi kết nối: ${e.message}`);
    } finally {
      setTestTelegramLoading(false);
      setTimeout(() => setTestTelegramStatus(null), 8000);
    }
  };

  const handleSaveAll = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "omnichat.settings.telegram",
          JSON.stringify({
            token: telegramToken.trim(),
            chatId: telegramChatId.trim(),
            alertOnLead,
            alertOnGuardrail,
          })
        );
        localStorage.setItem(
          "omnichat.settings.widget",
          JSON.stringify({
            title: widgetTitle,
            greeting: widgetGreeting,
            color: widgetColor,
            position: widgetPosition,
          })
        );
      } catch {
        // ignore
      }
    }
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  // Embed script snippet
  const embedCodeSnippet = `<!-- Mã nhúng OmniChat AI Widget -->
<script
  src="${typeof window !== "undefined" ? window.location.origin : "https://goldenchat-vibecoding.vercel.app"}/embed.js"
  data-theme-color="${widgetColor}"
  data-position="${widgetPosition}"
  data-title="${widgetTitle}"
  async>
</script>`;

  if (!canAccessSettings) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
              👑 Giới Hạn Quyền Quản Trị Hệ Thống
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Chỉ Quản Trị Viên (Admin) Mới Có Quyền Cấu Hình Hệ Thống
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
              Theo quy định phân quyền: <strong>Quản lý</strong> và <strong>Nhân viên</strong> không được can thiệp vào các thông số hệ thống chung (Webhook Botcake, Telegram Alert, Mã nhúng Web Widget, SLA phản hồi).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Chuyển đổi vai trò để thử nghiệm:</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Bạn đang đăng nhập với quyền: <span className="font-bold uppercase">{role === "manager" ? "Quản lý" : "Nhân viên"}</span>. Hãy bấm nút dưới đây để chuyển sang tài khoản Admin và kiểm tra toàn bộ cấu hình.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={async () => {
                triggerHaptic("medium");
                await quickSwitch("usr_admin");
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-98"
            >
              ⚡ Chuyển sang tài khoản Admin (Toàn quyền)
            </button>
            <Link
              href="/inbox"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold text-center transition"
            >
              Quay lại Hộp thư đa kênh
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cấu hình hệ thống & Kênh kết nối
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tích hợp Webhook Botcake (Facebook & Zalo cá nhân), Web Widget, Cảnh báo Telegram và SLA
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          Lưu tất cả cấu hình
        </button>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công toàn bộ cài đặt hệ thống!</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("botcake")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "botcake"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Radio className="w-4 h-4" />
          Kênh Botcake (FB & Zalo)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("widget")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "widget"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Globe className="w-4 h-4" />
          Web Chat Widget
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("telegram")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "telegram"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          Cảnh báo Telegram
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sla")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "sla"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          SLA & Phân công
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("pwa");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "pwa"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Smartphone className="w-4 h-4 text-blue-600" />
          Ứng dụng & PWA Mobile
        </button>
      </div>

      {/* ===================== TAB 1: KÊNH BOTCAKE (FB + ZALO) ===================== */}
      {activeTab === "botcake" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Thông số kết nối Webhook Botcake
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dán các thông số này vào mục Cài đặt Webhook trên trang quản trị Botcake / Pancake
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Endpoint Sẵn sàng
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Webhook URL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Webhook URL (Callback URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrl, "url")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition shadow-xs"
                  >
                    {copiedField === "url" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Khi triển khai production, thay <code>localhost:3000</code> bằng domain ngrok hoặc domain thật của hệ thống.
                </p>
              </div>

              {/* Verify Token */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mã xác thực Webhook (Verify Token)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={verifyToken}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(verifyToken, "token")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition shadow-xs"
                  >
                    {copiedField === "token" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Nút kiểm tra kết nối */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={pingLoading}
                  onClick={handleTestWebhookPing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  {pingLoading ? "Đang gửi gói tin test..." : "Bắn tin nhắn test Webhook"}
                </button>

                {pingStatus && (
                  <span className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-lg">
                    {pingStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Hướng dẫn kết nối từng kênh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hướng dẫn Facebook */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  FB
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Kết nối Facebook Fanpage qua Botcake
                  </h4>
                  <span className="text-[11px] text-slate-400">Tự động trả lời Messenger</span>
                </div>
              </div>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5">
                <li>Đăng nhập <a href="https://botcake.io" target="_blank" className="text-blue-600 underline">botcake.io</a> và chọn Fanpage của đơn vị.</li>
                <li>Vào mục <strong>Cài đặt</strong> ➔ <strong>Tích hợp Webhook</strong>.</li>
                <li>Dán <strong>Webhook URL</strong> và <strong>Verify Token</strong> ở trên vào.</li>
                <li>Tick chọn các quyền sự kiện: <code>messages</code>, <code>messaging_postbacks</code>.</li>
              </ol>
            </div>

            {/* Hướng dẫn Zalo cá nhân */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                  Zalo
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Kết nối Zalo cá nhân qua Botcake
                  </h4>
                  <span className="text-[11px] text-slate-400">Quét mã QR kết nối nhanh chóng</span>
                </div>
              </div>
              <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5">
                <li>Trong giao diện Pancake/Botcake, chọn mục <strong>Zalo Cá Nhân</strong>.</li>
                <li>Dùng ứng dụng Zalo trên điện thoại quét mã QR để cấp quyền đồng bộ.</li>
                <li>Bật toggle <strong>Tự động đẩy tin nhắn sang Webhook OmniChat</strong>.</li>
                <li>Mọi tin nhắn từ khách gửi đến Zalo cá nhân sẽ tự động chuyển về hệ thống.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: WEB CHAT WIDGET ===================== */}
      {activeTab === "widget" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Cột trái: Tùy biến */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Tùy biến giao diện Web Widget
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Tiêu đề thanh header chat</label>
                <input
                  type="text"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Câu chào mừng tự động</label>
                <textarea
                  rows={2}
                  value={widgetGreeting}
                  onChange={(e) => setWidgetGreeting(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Màu sắc chủ đạo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={widgetColor}
                      onChange={(e) => setWidgetColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={widgetColor}
                      onChange={(e) => setWidgetColor(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Vị trí hiển thị</label>
                  <select
                    value={widgetPosition}
                    onChange={(e) => setWidgetPosition(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="right">Góc dưới bên phải</option>
                    <option value="left">Góc dưới bên trái</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mã nhúng HTML */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  Mã nhúng vào Website của đơn vị:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(embedCodeSnippet, "embed")}
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {copiedField === "embed" ? "Đã sao chép!" : "Sao chép mã"}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto">
                {embedCodeSnippet}
              </pre>
              <div className="flex justify-end pt-1">
                <Link
                  href="/widget"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  Mở trang thử nghiệm Widget riêng biệt
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Cột phải: Xem trước (Live Preview) */}
          <div className="lg:col-span-5 bg-slate-100/70 border border-slate-200 rounded-2xl p-5 flex flex-col justify-end items-end min-h-[420px] relative overflow-hidden">
            <span className="absolute top-4 left-4 text-xs font-semibold text-slate-500">
              Live Preview (Xem trước giao diện):
            </span>

            {/* Khung widget giả lập */}
            <div className="w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs">
              <div
                style={{ backgroundColor: widgetColor }}
                className="p-3 text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
                    AI
                  </div>
                  <span className="font-semibold text-[11px] truncate max-w-[170px]">
                    {widgetTitle}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <div className="p-3 space-y-2 h-44 overflow-y-auto bg-slate-50">
                <div className="bg-white p-2 rounded-xl text-[11px] text-slate-700 shadow-2xs border border-slate-200/60 leading-relaxed">
                  {widgetGreeting}
                </div>
              </div>

              <div className="p-2 border-t border-slate-100 bg-white flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Gõ câu hỏi..."
                  className="flex-1 px-2.5 py-1 text-[11px] bg-slate-100 border border-slate-200 rounded-lg"
                />
                <button
                  style={{ backgroundColor: widgetColor }}
                  className="p-1 rounded-lg text-white"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: CẢNH BÁO TELEGRAM ===================== */}
      {activeTab === "telegram" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cảnh báo thông minh qua Telegram
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhận thông báo tức thì lên điện thoại ngay khi khách để lại SĐT hoặc vi phạm chính sách giá
            </p>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Telegram Bot Token
              </label>
              <input
                type="text"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400">
                Tạo bot miễn phí từ <code>@BotFather</code> trên Telegram
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Telegram Chat ID (hoặc Group ID)
              </label>
              <input
                type="text"
                placeholder="-100123456789 hoặc 987654321"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs"
              />
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOnLead}
                  onChange={(e) => setAlertOnLead(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800 font-medium">
                  Bắn thông báo ngay khi có Lead N1 mới để lại Số điện thoại
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOnGuardrail}
                  onChange={(e) => setAlertOnGuardrail(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800 font-medium">
                  Cảnh báo khi khách đòi giảm giá vượt hạn mức hoặc phàn nàn
                </span>
              </label>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                disabled={testTelegramLoading}
                onClick={handleTestTelegram}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 rounded-xl text-xs font-semibold transition"
              >
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                {testTelegramLoading ? "Đang gửi..." : "Gửi tin nhắn thử nghiệm lên Telegram"}
              </button>

              {testTelegramStatus && (
                <span className="text-xs text-blue-700 font-medium">
                  {testTelegramStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: SLA & PHÂN CÔNG CHĂM SÓC ===================== */}
      {activeTab === "sla" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Quy chuẩn SLA & Phân quyền xử lý tin nhắn
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cài đặt các mốc cảnh báo thời gian chờ để hiển thị badge trên màn hình Hộp thư (Inbox 3 cột)
            </p>
          </div>

          <div className="space-y-3.5 text-xs pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cảnh báo vàng (Khách chờ phản hồi)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={slaWarningMinutes}
                    onChange={(e) => setSlaWarningMinutes(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                  <span className="text-slate-500">phút</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cảnh báo đỏ (Quá hạn SLA nghiêm trọng)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={slaCriticalHours}
                    onChange={(e) => setSlaCriticalHours(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                  <span className="text-slate-500">giờ (ví dụ: chờ 9h, chờ 35h)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nhân viên phụ trách mặc định (Assigned to)
              </label>
              <input
                type="text"
                value={defaultStaff}
                onChange={(e) => setDefaultStaff(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
              />
              <span className="text-[11px] text-slate-400">
                Hiển thị trong cột 1 danh sách hội thoại và phân bổ Lead
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: ỨNG DỤNG & PWA MOBILE ===================== */}
      {activeTab === "pwa" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Card trạng thái cài đặt */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Image
                  src="/icon-192.png"
                  alt="App Icon"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl shadow-md object-cover ring-1 ring-slate-200"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Trạng thái Ứng dụng PWA Mobile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chạy độc lập trên màn hình chính như Native App
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
                  isPwaInstalled
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isPwaInstalled ? "Đang chạy độc lập (PWA Standalone)" : "Trình duyệt Web (Sẵn sàng cài đặt)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span>Âm thanh thông báo (&quot;Ting&quot;)</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Phát âm thanh chuông khi có tin nhắn khách hàng mới hoặc lịch hẹn xem sảnh.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 font-medium">Bật âm báo</span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => {
                      triggerHaptic("light");
                      setSoundEnabled(e.target.checked);
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Vibrate className="w-4 h-4 text-blue-600" />
                  <span>Rung phản hồi (Haptic Feedback)</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Rung nhẹ khi thao tác chuyển tab, bấm gửi tin nhắn, xác nhận lịch hoặc lưu khách.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 font-medium">Bật rung</span>
                  <input
                    type="checkbox"
                    checked={hapticEnabled}
                    onChange={(e) => {
                      triggerHaptic("medium");
                      setHapticEnabled(e.target.checked);
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Test thông báo */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Thử nghiệm Thông báo & Rung</p>
                <p className="text-[11px] text-slate-500">Kiểm tra banner Dynamic Island, âm thanh và rung</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await requestNotificationPermission();
                    sendOmniNotification({
                      title: "💬 Khách hỏi thực đơn tiệc cưới",
                      body: "Nguyễn Thu Trang: 'Em ơi cho chị xin bảng giá thực đơn 30 bàn ngày 20/11 với ạ!'",
                      url: "/inbox",
                      type: "message",
                      playSound: soundEnabled,
                      haptic: hapticEnabled,
                    });
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm inline-flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Bắn thử thông báo
                </button>
                <Link
                  href="/download"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Hướng dẫn cài đặt
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

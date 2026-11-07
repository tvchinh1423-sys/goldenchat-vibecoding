"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  Sparkles,
  Calendar,
  CalendarCheck,
  ExternalLink,
  Volume2,
  VolumeX,
  User,
  Phone,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  RotateCcw,
  Headset,
} from "lucide-react";
import { FormattedMessage } from "@/components/chat/formatted-message";
import { getSmartBookingDefault, googleCalendarUrl } from "@/lib/crm/appointment";
import { saveChatBooking } from "@/lib/crm/client";
import { BOOKING_TYPES, formatAppointment } from "@/lib/crm/model";
import { visitIntent } from "@/lib/chat/follow-ups";
import { playChatTone } from "@/lib/chat/sound";
import { useVisualViewport } from "@/lib/chat/use-visual-viewport";
import { type BookingDraftInfo } from "@/lib/chat/booking-extractor";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  suggestedQuestions?: string[];
  visitType?: ReturnType<typeof visitIntent>;
  customCalendarUrl?: string;
  bookingDraft?: BookingDraftInfo | null;
  handoff?: boolean;
}

function WebWidgetContent() {
  const viewportRef = useVisualViewport<HTMLDivElement>();
  const searchParams = useSearchParams();
  const customColor = searchParams.get("color") || "#2563eb";
  const customTitle = searchParams.get("title") || "Golden Palace Assistant";
  const customGreeting = searchParams.get("greeting");
  const isEmbedded = searchParams.get("embedded") === "true";

  const [isOpen, setIsOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Form Đặt lịch state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingType, setBookingType] = useState<"xem_sanh" | "thu_mon" | "tu_van_su_kien">("xem_sanh");
  const [bookingTime, setBookingTime] = useState(getSmartBookingDefault);
  const [bookingGuests, setBookingGuests] = useState(2);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  // State lưu thông tin bóc tách đặt lịch thông minh (NLP Smart Booking)
  const [activeBookingDraft, setActiveBookingDraft] = useState<BookingDraftInfo | null>(null);
  // Trạng thái AI tự động (sẽ tự tắt khi gặp câu hỏi ngoài phạm vi để chuyển giao nhân viên thật)
  const [isAiActive, setIsAiActive] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "w-1",
      sender: "bot",
      text:
        customGreeting ||
        "Dạ em là trợ lý tư vấn tại Trung tâm Tiệc cưới & Sự kiện Golden Palace (98 Đông A, Nam Định). Em có thể hỗ trợ anh/chị thông tin về thực đơn, hình ảnh không gian sảnh hay xếp lịch ghé xem sảnh (8:00 - 10:30) ạ?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedQuestions: [
        "Thực đơn tiệc cưới bao nhiêu một bàn?",
        "Cho tôi xem ảnh không gian sảnh tiệc",
        "Tôi muốn đặt lịch xem sảnh sáng mai",
      ],
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCloseWidget = () => {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "omnichat-close" }, "*");
    }
    setIsOpen(false);
  };

  const handleResetChat = () => {
    setActiveBookingDraft(null);
    setMessages([
      {
        id: "w-" + Date.now(),
        sender: "bot",
        text:
          customGreeting ||
          "Dạ em là trợ lý tư vấn tại Trung tâm Tiệc cưới & Sự kiện Golden Palace (98 Đông A, Nam Định). Em có thể hỗ trợ anh/chị thông tin về thực đơn, hình ảnh không gian sảnh hay xếp lịch ghé xem sảnh (8:00 - 10:30) ạ?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Cho tôi xem ảnh không gian sảnh tiệc",
          "Tôi muốn đặt lịch xem sảnh sáng mai",
        ],
      },
    ]);
  };

  // Tự động chốt lịch hẹn trực tiếp khi đã đủ thông tin (không cần khách mở form)
  const saveDirectBooking = async (draft: BookingDraftInfo) => {
    const cleanPhone = (draft.phone || "").replace(/[\s.-]/g, "").replace(/^\+?84/, "0");
    if (!cleanPhone || !draft.fullName) return;

    try {
      const visit = {
        appointment_time: (draft.dateTimeIso || getSmartBookingDefault()) + ":00+07:00",
        event_type: draft.eventType,
        guests_count: draft.guestsCount || 2,
        assigned_staff: "Ngọc Khánh",
        notes: draft.notes || "Khách đặt lịch tự động trong luồng chat",
      };

      const saved = await saveChatBooking({
        full_name: draft.fullName,
        phone: cleanPhone,
        email: "",
        notes: "Khách đặt lịch tự động trong luồng chat (NLP Smart Booking)",
        source: "web",
        stage: "N1",
        assigned_to: visit.assigned_staff,
        event_date: "",
        table_count: null,
        inbox_reference: null,
      }, visit);

      if (saved.mode === "supabase") {
        void fetch("/api/telegram/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "appointment",
            data: {
              name: draft.fullName,
              phone: cleanPhone,
              interest: BOOKING_TYPES[draft.eventType],
              appointmentTime: formatAppointment(visit.appointment_time),
              platform: "Web Widget (NLP Auto-Book)",
            },
          }),
        }).catch(() => {});
      }

      const calUrl = googleCalendarUrl(visit);
      const confirmation = saved.mode === "demo"
        ? "Lịch hẹn đã tự động lưu thành công trên CRM."
        : "Lịch hẹn đã được hệ thống ghi nhận thành công và chuyển tới tư vấn viên.";

      if (soundEnabled) playChatTone();

      setMessages((prev) => [
        ...prev,
        {
          id: `b-auto-${Date.now()}`,
          sender: "bot",
          text: `🎉 **ĐẶT LỊCH THÀNH CÔNG!**\n\n${confirmation}\n\n👤 **Khách hàng:** ${draft.fullName} (${cleanPhone})\n⏰ **Thời gian:** ${formatAppointment(visit.appointment_time)}\n🤝 **Nội dung:** ${BOOKING_TYPES[draft.eventType]} (${draft.guestsCount || 2} người)\n📍 **Địa điểm:** 98 Đông A, KĐT Hòa Vượng, TP. Nam Định.\n\n*Bộ phận lễ tân sẽ gọi điện đón tiếp chu đáo trước giờ hẹn ạ!*`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          customCalendarUrl: calUrl,
          suggestedQuestions: [
            "Xem menu thực đơn tiệc cưới",
            "Mở chỉ đường Google Maps",
            "Hotline tư vấn: 0228 6595 959",
          ],
        },
      ]);
      window.dispatchEvent(new Event("storage"));
      setShowBookingModal(false);
      setActiveBookingDraft(null);
    } catch (e: any) {
      console.error("Auto booking error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Lưu ý: ${e?.message || "Chưa lưu được thông tin"}. Quý khách có thể bấm nút "Đặt lịch" ở góc trên hoặc liên hệ Hotline 0228 6595 959 để được hỗ trợ nhé ạ!`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const sendMessageWithText = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (soundEnabled) playChatTone();

    try {
      const res = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          channel: "web",
          isWorkingHours: true,
          messageCount: messages.length,
          bookingDraftContext: activeBookingDraft,
          businessProfile: {
            name: "Trung tâm Tiệc cưới & Sự kiện Golden Palace",
            serviceTypeName: "Gói tiệc & Sảnh cưới",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || typeof data.reply !== "string") throw new Error("Chat unavailable");

      if (soundEnabled) playChatTone();

      const resolvedVisitType = data.appointmentIntent
        ? (data.visitType || visitIntent(userText) || "xem_sanh")
        : undefined;

      // Tự động điền trước (Pre-fill) vào modal form từ NLP bóc tách
      if (data.bookingDraft) {
        setActiveBookingDraft(data.bookingDraft);
        if (data.bookingDraft.fullName) setBookingName(data.bookingDraft.fullName);
        if (data.bookingDraft.phone) setBookingPhone(data.bookingDraft.phone);
        if (data.bookingDraft.dateTimeIso) setBookingTime(data.bookingDraft.dateTimeIso);
        if (data.bookingDraft.eventType) setBookingType(data.bookingDraft.eventType);
        if (data.bookingDraft.notes) setBookingNotes(data.bookingDraft.notes);
        if (data.bookingDraft.guestsCount) setBookingGuests(data.bookingDraft.guestsCount);
      }

      const isHandoff = data.handoff || data.aiEnabled === false;
      if (isHandoff) {
        setIsAiActive(false);
        void fetch("/api/telegram/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "handover",
            data: {
              name: "Khách Web Widget",
              message: userText,
              platform: "Web Widget",
            },
          }),
        }).catch(() => {});
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: data.autoBooked && data.bookingDraft
            ? "Dạ em đang lưu lịch hẹn cho anh/chị ạ."
            : data.reply || "Dạ em đã ghi nhận thông tin của anh/chị ạ!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedQuestions: data.suggestedQuestions,
          visitType: resolvedVisitType,
          bookingDraft: data.bookingDraft,
          handoff: isHandoff,
        },
      ]);

      if (data.autoBooked && data.bookingDraft) {
        await saveDirectBooking(data.bookingDraft);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: "Dạ kết nối đang chập chờn, anh/chị liên hệ Hotline 0228 6595 959 để được hỗ trợ tức thì nhé!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  function openBooking(type: "xem_sanh" | "thu_mon" | "tu_van_su_kien" = "xem_sanh") {
    setBookingType(type);
    if (!activeBookingDraft?.dateTimeIso) {
      setBookingTime(getSmartBookingDefault());
    }
    setBookingError("");
    setShowBookingModal(true);
  }

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessageWithText(input);
  };

  // Submit Form Đặt lịch trực tiếp trong chat
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingSubmitting) return;
    if (soundEnabled) playChatTone();
    setBookingError("");

    const cleanPhone = bookingPhone.replace(/[\s.-]/g, "").replace(/^\+?84/, "0");
    if (!/^0[1-9]\d{7,10}$/.test(cleanPhone)) {
      setBookingError("Vui lòng nhập số điện thoại hợp lệ (9 đến 11 chữ số).");
      return;
    }
    if (!bookingName.trim()) {
      setBookingError("Vui lòng nhập họ và tên của Quý khách.");
      return;
    }

    setBookingSubmitting(true);
    try {
      const visit = {
        appointment_time: bookingTime + ":00+07:00",
        event_type: bookingType,
        guests_count: bookingGuests,
        assigned_staff: "Ngọc Khánh",
        notes: bookingNotes.trim(),
      };
      const saved = await saveChatBooking({
        full_name: bookingName.trim(),
        phone: cleanPhone,
        email: "",
        notes: "Đặt lịch từ Web Widget",
        source: "web",
        stage: "N1",
        assigned_to: visit.assigned_staff,
        event_date: "",
        table_count: null,
        inbox_reference: null,
      }, visit);
      if (saved.mode === "supabase") {
        void fetch("/api/telegram/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "appointment",
            data: {
              name: bookingName.trim(),
              phone: cleanPhone,
              interest: BOOKING_TYPES[bookingType],
              appointmentTime: formatAppointment(visit.appointment_time),
              platform: "Web Widget",
            },
          }),
        }).catch(() => {});
      }
      const calUrl = googleCalendarUrl(visit);
      const confirmation = saved.mode === "demo"
        ? "Lịch demo đã lưu trên trình duyệt."
        : "Lịch đã được ghi nhận và đang chờ tư vấn viên xác nhận.";

      if (soundEnabled) playChatTone();

      setMessages((prev) => [
        ...prev,
        {
          id: `b-confirm-${Date.now()}`,
          sender: "bot",
          text: `✅ **XÁC NHẬN ĐÃ NHẬN LỊCH HẸN**\n\n${confirmation}\n\n⏰ **Thời gian:** ${formatAppointment(visit.appointment_time)}\n🤝 **Nội dung:** ${BOOKING_TYPES[bookingType]} (${bookingGuests} người)\n📍 **Địa điểm:** Trung tâm Tiệc cưới & Sự kiện Golden Palace, 98 Đông A, Nam Định.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          customCalendarUrl: calUrl,
          suggestedQuestions: [
            "Địa chỉ nhà hàng ở đâu?",
            "Thực đơn tiệc cưới bao nhiêu một bàn?",
            "Hotline liên hệ trực tiếp",
          ],
        },
      ]);

      setShowBookingModal(false);
      setBookingNotes("");
    } catch (e: any) {
      setBookingError(e?.message || "Không thể lưu lịch hẹn. Vui lòng thử lại!");
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className={`widget-shell min-h-dvh ${isEmbedded ? "bg-transparent" : "bg-slate-900/10"}`}>
      {/* Background mô phỏng khi xem trực tiếp trên tab riêng (chỉ hiện trên desktop) */}
      {!isEmbedded && (
        <div className="hidden sm:block fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]" />
      )}

      {/* Floating Chat Widget Container - Tự động full màn hình trên mobile */}
      <div
        ref={viewportRef}
        className={`group/chat fixed inset-x-0 top-[var(--chat-top,0px)] z-50 flex h-[var(--chat-height,100dvh)] flex-col items-end ${
          isEmbedded ? "" : "widget-viewport sm:inset-auto sm:bottom-6 sm:right-6 sm:h-auto"
        } ${isOpen ? "" : "pointer-events-none"}`}
      >
        {isOpen ? (
          <div
            className={`${
              isEmbedded
                ? "w-full h-full rounded-none border-0"
                : "widget-panel w-full h-full sm:w-[410px] sm:h-[min(600px,calc(100dvh-3rem))] rounded-none sm:rounded-3xl border-0 sm:border"
            } bg-white shadow-2xl border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in sm:slide-in-from-bottom-5 duration-200 relative`}
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${customColor}, #4338ca)`,
              }}
              className="widget-header flex shrink-0 flex-wrap items-center justify-between gap-x-2 bg-blue-600 pb-2 pl-[max(0.75rem,var(--safe-left))] pr-[max(0.75rem,var(--safe-right))] pt-[calc(0.75rem+var(--safe-top))] text-white shadow-xs select-none sm:p-3.5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 max-sm:basis-full sm:gap-3">
                <div className="w-10 h-10 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-sm shadow-xs border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight max-w-[180px] truncate">
                      {customTitle}
                    </h3>
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-100 mt-0.5">
                    <span
                      className={`w-2 h-2 shrink-0 rounded-full ${
                        isAiActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    <span className="truncate">
                      {isAiActive
                        ? "98 Đông A · Đón tiếp 8:00 - 10:30"
                        : "⚡ Đã ngắt AI · Tư vấn viên tiếp quản"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1 max-sm:ml-auto group-data-[keyboard-open]/chat:hidden">
                {/* Nút Đặt lịch nhanh trên header */}
                <button
                  type="button"
                  title="Đặt lịch tư vấn & xem sảnh"
                  onClick={() => openBooking()}
                  className="flex min-h-11 items-center gap-1 rounded-xl border border-white/20 bg-white/15 px-2.5 text-xs font-semibold text-white hover:bg-white/25 sm:min-h-8"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đặt lịch</span>
                </button>

                <button
                  type="button"
                  title="Làm mới cuộc trò chuyện"
                  onClick={handleResetChat}
                  className="grid h-11 w-11 place-items-center rounded-xl text-white/80 hover:bg-white/20 hover:text-white sm:h-8 sm:w-8"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                  onClick={() => { if (!soundEnabled) playChatTone(); setSoundEnabled(!soundEnabled); }}
                  className="grid h-11 w-11 place-items-center rounded-xl text-white/80 hover:bg-white/20 hover:text-white sm:h-8 sm:w-8"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/60" />
                  )}
                </button>

                {/* Phím tắt nhanh sang Quản trị khi test trên điện thoại */}
                {!isEmbedded && (
                  <a
                    href="/leads"
                    title="Mở Quản lý Khách hàng & Lịch hẹn"
                    className="grid h-11 w-11 place-items-center rounded-xl text-white/80 hover:bg-white/20 hover:text-white sm:h-8 sm:w-8"
                  >
                    <Users className="w-4 h-4 text-amber-300" />
                  </a>
                )}

                <button
                  type="button"
                  title="Đóng khung chat"
                  onClick={handleCloseWidget}
                  className="grid h-11 w-11 place-items-center rounded-xl text-white/80 hover:bg-white/20 hover:text-white sm:h-8 sm:w-8"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#f8fafc] py-3.5 pl-[max(0.875rem,var(--safe-left))] pr-[max(0.875rem,var(--safe-right))]"
            >
              <div className="text-center my-1">
                <span className="text-[10px] text-slate-400 font-medium bg-slate-200/60 px-2.5 py-0.5 rounded-full">
                  Hôm nay · Hotline tư vấn: 0228 6595 959
                </span>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-2xs sm:max-w-[86%] sm:text-xs ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs"
                    }`}
                  >
                    <FormattedMessage
                      text={m.text}
                      isUser={m.sender === "user"}
                    />

                    {/* Thẻ tóm tắt phiếu hẹn nhỏ gọn - CHỈ HIỆN KHI KHÁCH ĐÃ CUNG CẤP TÊN HOẶC THỜI GIAN THẬT */}
                    {m.bookingDraft && (m.bookingDraft.fullName || m.bookingDraft.timeStr) && !m.bookingDraft.isComplete && (
                      <div className="mt-2 p-2.5 bg-blue-50/90 border border-blue-200/80 rounded-xl text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-semibold text-blue-900">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {m.bookingDraft.fullName ? `Khách: ${m.bookingDraft.fullName}` : ""}{" "}
                              {m.bookingDraft.timeStr ? `· ${m.bookingDraft.timeStr} (${m.bookingDraft.dateStr})` : ""}
                            </span>
                          </span>
                          <span className="text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            Chờ SĐT
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          👉 Chị nhắn số điện thoại vào chat để em chốt lịch ngay nhé!
                        </p>
                      </div>
                    )}

                    {/* Nút Thêm vào Google Calendar 1-chạm khi đã chốt lịch thành công */}
                    {m.customCalendarUrl && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <a
                          href={m.customCalendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition border border-blue-200 shadow-2xs cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Thêm vào Google Calendar</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>
                      </div>
                    )}

                    {/* Nút liên hệ trực tiếp khi chuyển giao chuyên viên tư vấn */}
                    {m.handoff && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <a
                          href="tel:02286595959"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition border border-red-200/70 shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi Hotline 0228 659 5959</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {m.time}
                  </span>

                  {/* AI gợi ý 3 câu liên quan (Tiêu chí Must-be của BTC) */}
                  {m.sender === "bot" && m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                    <div className="mt-1.5 mb-1 max-w-[90%] flex flex-wrap gap-1.5">
                      {m.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => sendMessageWithText(q)}
                          className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 rounded-full transition shadow-2xs text-left active:scale-95"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs px-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 ml-1">Golden Palace Bot đang gõ...</span>
                </div>
              )}
            </div>

            {/* Quick Chips Gợi ý nhanh */}
            <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-slate-200/70 bg-slate-100/90 py-1.5 pl-[max(0.75rem,var(--safe-left))] pr-[max(0.75rem,var(--safe-right))] text-[11px] group-data-[keyboard-open]/chat:hidden max-sm:[@media(max-height:420px)]:hidden">
              <button
                type="button"
                onClick={() => openBooking()}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full whitespace-nowrap shadow-xs transition shrink-0 flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                <span>Đặt lịch xem sảnh</span>
              </button>
              <button
                type="button"
                onClick={() => sendMessageWithText("Thực đơn tiệc cưới bao nhiêu một bàn?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0"
              >
                🍽️ Thực đơn bàn tiệc
              </button>
              <button
                type="button"
                onClick={() => sendMessageWithText("Cho tôi xem ảnh không gian sảnh tiệc")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0"
              >
                🖼️ Ảnh sảnh tiệc
              </button>
              <button
                type="button"
                onClick={() => sendMessageWithText("Địa chỉ nhà hàng ở đâu?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0"
              >
                📍 98 Đông A Maps
              </button>
              <button
                type="button"
                onClick={() => sendMessageWithText("Nhà hàng đón khách lúc mấy giờ?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0"
              >
                ⏰ Đón khách 8:00-10:30
              </button>
              <button
                type="button"
                onClick={() => sendMessageWithText("Hotline liên hệ trực tiếp")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0"
              >
                📞 Hotline: 0228 6595 959
              </button>
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSend}
              className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white pl-[max(0.625rem,var(--safe-left))] pr-[max(0.625rem,var(--safe-right))] pt-2.5 pb-[calc(0.625rem+var(--safe-bottom))] group-data-[keyboard-open]/chat:pb-2.5"
            >
              <input
                type="text"
                aria-label="Nội dung tin nhắn"
                placeholder="Nhập tin nhắn…"
                enterKeyHint="send"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-w-0 flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                aria-label="Gửi tin nhắn"
                disabled={!input.trim() || loading}
                style={{ backgroundColor: customColor }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-xs transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* ================= MODAL ĐẶT LỊCH NHANH TRỰC TIẾP (POPUP FORM) ================= */}
            {showBookingModal && (
              <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/60 pl-[max(0.75rem,var(--safe-left))] pr-[max(0.75rem,var(--safe-right))] pt-[max(0.75rem,var(--safe-top))] pb-[max(0.75rem,var(--safe-bottom))] backdrop-blur-xs sm:items-center">
                <div className="max-h-full w-full space-y-3.5 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider">
                        <CalendarCheck className="w-4 h-4" />
                        <span>Đặt lịch tư vấn & xem sảnh</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        Trung tâm Tiệc cưới Golden Palace
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Khung giờ đón khách chuẩn: <strong>8:00 - 10:30 sáng</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(false)}
                      aria-label="Đóng form đặt lịch"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
                    {/* Họ tên */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Họ và tên Quý khách *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Trần Vân Chinh"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Số điện thoại di động *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ví dụ: 0912 345 678"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Loại lịch hẹn */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Nội dung cần hỗ trợ
                      </label>
                      <select
                        value={bookingType}
                        onChange={(e) => setBookingType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="xem_sanh">🏛️ Tham quan sảnh tiệc cưới & hội nghị</option>
                        <option value="thu_mon">🍽️ Thử món & tư vấn thực đơn chi tiết</option>
                        <option value="tu_van_su_kien">💼 Tư vấn sự kiện / Tiệc doanh nghiệp</option>
                      </select>
                    </div>

                    {/* Thời gian hẹn với Smart Default */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Thời gian hẹn (Smart Default) *
                        </label>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Khung giờ vàng 09:00
                        </span>
                      </div>
                      <input
                        type="datetime-local"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setBookingTime(getSmartBookingDefault())}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                        >
                          ⚡ Gợi ý: 09:00 sáng
                        </button>
                      </div>
                    </div>

                    {/* Số khách & Ghi chú */}
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Số khách
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={bookingGuests}
                          onChange={(e) => setBookingGuests(parseInt(e.target.value) || 2)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Ghi chú thêm
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: sảnh 300 khách..."
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {bookingError && (
                      <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[11px]">
                        {bookingError}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={bookingSubmitting}
                        onClick={() => setShowBookingModal(false)}
                        className="min-h-11 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={bookingSubmitting}
                        style={{ backgroundColor: customColor }}
                        className="flex min-h-11 items-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {bookingSubmitting ? "Đang xếp lịch..." : "Xác nhận đặt lịch"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            aria-label="Mở khung chat"
            onClick={() => setIsOpen(true)}
            style={{ backgroundColor: customColor }}
            className="widget-launcher pointer-events-auto group mt-auto mr-[max(1rem,var(--safe-right))] mb-[max(1rem,var(--safe-bottom))] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 sm:m-0"
          >
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function WebWidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Đang tải OmniChat Widget...
        </div>
      }
    >
      <WebWidgetContent />
    </Suspense>
  );
}

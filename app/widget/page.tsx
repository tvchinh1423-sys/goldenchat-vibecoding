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
} from "lucide-react";
import { FormattedMessage } from "@/components/chat/formatted-message";
import { getSmartBookingDefault, googleCalendarUrl } from "@/lib/crm/appointment";
import { saveChatBooking } from "@/lib/crm/client";
import { BOOKING_TYPES, formatAppointment } from "@/lib/crm/model";
import { visitIntent } from "@/lib/chat/follow-ups";
import { playChatTone } from "@/lib/chat/sound";
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
}

function WebWidgetContent() {
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
      setShowBookingModal(false);
      setActiveBookingDraft(null);
    } catch (e: any) {
      console.error("Auto booking error:", e);
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

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: data.reply || "Dạ em đã ghi nhận thông tin của anh/chị ạ!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedQuestions: data.suggestedQuestions,
          visitType: resolvedVisitType,
          bookingDraft: data.bookingDraft,
        },
      ]);

      // NẾU ĐÃ ĐỦ THÔNG TIN -> TỰ ĐỘNG CHỐT LỊCH HẸN NGAY LẬP TỨC (KHÔNG BẮT KHÁCH MỞ FORM)!
      if (data.autoBooked && data.bookingDraft) {
        setTimeout(() => {
          void saveDirectBooking(data.bookingDraft);
        }, 500);
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
    if (!/^0[35789]\d{8}$/.test(cleanPhone)) {
      setBookingError("Vui lòng nhập số di động Việt Nam hợp lệ (10 chữ số).");
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
    <div className={`min-h-screen ${isEmbedded ? "bg-transparent p-0" : "bg-slate-900/10 sm:p-4"} flex items-center justify-center`}>
      {/* Background mô phỏng khi xem trực tiếp trên tab riêng (chỉ hiện trên desktop) */}
      {!isEmbedded && (
        <div className="hidden sm:block fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]" />
      )}

      {/* Floating Chat Widget Container - Tự động full màn hình trên mobile */}
      <div className={`fixed ${isEmbedded ? "inset-0" : "inset-0 sm:inset-auto sm:bottom-6 sm:right-6"} z-50 flex flex-col items-end`}>
        {isOpen ? (
          <div
            className={`${
              isEmbedded
                ? "w-full h-full rounded-none border-0"
                : "w-full h-full sm:w-[410px] sm:h-[600px] rounded-none sm:rounded-3xl border-0 sm:border"
            } bg-white shadow-2xl border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in sm:slide-in-from-bottom-5 duration-200 relative`}
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${customColor}, #4338ca)`,
              }}
              className="p-3.5 sm:p-4 text-white flex items-center justify-between shadow-xs select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-sm shadow-xs border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight max-w-[180px] truncate">
                      {customTitle}
                    </h3>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-100 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>98 Đông A · Đón tiếp 8:00 - 10:30</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Nút Đặt lịch nhanh trên header */}
                <button
                  type="button"
                  title="Đặt lịch tư vấn & xem sảnh"
                  onClick={() => openBooking()}
                  className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 transition text-white text-[11px] font-semibold flex items-center gap-1 border border-white/20 shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đặt lịch</span>
                </button>

                <button
                  type="button"
                  title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                  onClick={() => { if (!soundEnabled) playChatTone(); setSoundEnabled(!soundEnabled); }}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition text-white/80 hover:text-white"
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
                    className="p-1.5 rounded-xl hover:bg-white/20 transition text-white/80 hover:text-white flex items-center gap-1"
                  >
                    <Users className="w-4 h-4 text-amber-300" />
                  </a>
                )}

                <button
                  type="button"
                  title="Đóng khung chat"
                  onClick={handleCloseWidget}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div
              ref={scrollRef}
              className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-[#f8fafc]"
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
                    className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs"
                    }`}
                  >
                    <FormattedMessage
                      text={m.text}
                      isUser={m.sender === "user"}
                    />

                    {/* Thẻ Phiếu hẹn thông minh tự động điền (Smart Booking Preview Card) */}
                    {m.bookingDraft && !m.bookingDraft.isComplete && (
                      <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                            Phiếu hẹn thông minh (Đã điền tự động)
                          </span>
                          <span className="bg-amber-200/70 text-amber-900 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                            Chờ số điện thoại
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-slate-700 text-[11px]">
                          <div>👤 Khách: <strong className="text-slate-900">{m.bookingDraft.fullName || "(Chưa có tên)"}</strong></div>
                          <div>⏰ Thời gian: <strong className="text-slate-900">{m.bookingDraft.timeStr} · {m.bookingDraft.dateStr}</strong></div>
                          <div className="col-span-2">🏛️ Nội dung: <strong className="text-slate-900">{m.bookingDraft.eventTypeName}</strong></div>
                        </div>
                        <div className="pt-2 border-t border-amber-200/70 flex items-center justify-between text-[11px]">
                          <span className="text-amber-800 font-medium">
                            👉 Chị chỉ cần nhắn SĐT vào chat để chốt lịch ngay
                          </span>
                          <button
                            type="button"
                            onClick={() => openBooking(m.bookingDraft?.eventType || "xem_sanh")}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Xem / sửa phiếu
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Khối Thao tác Đặt Lịch & Google Calendar (Điểm WOW chuẩn BTC) */}
                    {(m.visitType || m.customCalendarUrl) && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                        {/* Nút mở Form Đặt lịch nhanh */}
                        {m.visitType && !m.customCalendarUrl && (
                          <button
                            type="button"
                            onClick={() => openBooking(m.visitType)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-sm active:scale-95 cursor-pointer mt-1"
                          >
                            <CalendarCheck className="w-4 h-4 text-white" />
                            <span>Điền thông tin đặt lịch ngay (8:00 - 10:30)</span>
                          </button>
                        )}

                        {/* Nút Thêm vào Google Calendar */}
                        {m.customCalendarUrl && (
                          <a
                            href={m.customCalendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition border border-blue-200 shadow-2xs cursor-pointer mt-1"
                          >
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Thêm lịch hẹn vào Google Calendar</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-60" />
                          </a>
                        )}
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
            <div className="px-3 py-1.5 bg-slate-100/90 border-t border-slate-200/70 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
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
              className="p-2.5 sm:p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn (thực đơn, sảnh cưới, hẹn xem sảnh...)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{ backgroundColor: customColor }}
                className="p-2.5 hover:opacity-90 disabled:opacity-40 text-white rounded-xl shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* ================= MODAL ĐẶT LỊCH NHANH TRỰC TIẾP (POPUP FORM) ================= */}
            {showBookingModal && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
                <div className="w-full max-h-[92%] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-3.5 animate-in slide-in-from-bottom-4 duration-200">
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
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
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
                      <div className="col-span-2">
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
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={bookingSubmitting}
                        style={{ backgroundColor: customColor }}
                        className="px-4 py-2 text-white font-semibold rounded-xl shadow-xs hover:opacity-95 transition disabled:opacity-50 flex items-center gap-1.5"
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
            onClick={() => setIsOpen(true)}
            style={{ backgroundColor: customColor }}
            className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
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

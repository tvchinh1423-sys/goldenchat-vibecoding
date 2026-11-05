"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  Sparkles,
  Calendar,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { FormattedMessage } from "@/components/chat/formatted-message";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  suggestedQuestions?: string[];
  appointmentIntent?: boolean;
}

// Âm thanh thông báo tin nhắn (Web Audio API - Điểm WOW chuẩn BTC)
function playDingSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12); // C6
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    // Không chặn nếu trình duyệt chặn autoplay
  }
}

export default function WebWidgetPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "w-1",
      sender: "bot",
      text: "Dạ em là trợ lý tư vấn tại Trung tâm Tiệc cưới & Sự kiện Golden Palace (98 Đông A, Nam Định). Em có thể hỗ trợ anh/chị thông tin về thực đơn, hình ảnh không gian sảnh hay lịch ghé xem sảnh (8:00 - 10:30) ạ?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedQuestions: [
        "Thực đơn tiệc cưới bao nhiêu một bàn?",
        "Cho tôi xem ảnh không gian sảnh tiệc",
        "Địa chỉ nhà hàng ở đâu?",
      ],
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

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

    try {
      const res = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          channel: "web",
          isWorkingHours: true,
          messageCount: messages.length,
          businessProfile: {
            name: "Trung tâm Tiệc cưới & Sự kiện Golden Palace",
            serviceTypeName: "Gói tiệc & Sảnh cưới",
          },
        }),
      });
      const data = await res.json();

      if (soundEnabled) playDingSound();

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: data.reply || "Dạ em đã ghi nhận thông tin của anh/chị ạ!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedQuestions: data.suggestedQuestions,
          appointmentIntent: data.appointmentIntent,
        },
      ]);
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

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessageWithText(input);
  };

  // Google Calendar URL sinh tự động cho lịch hẹn ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(10, 30, 0, 0);
  const formatGCalDate = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15) + "Z";
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Xem sảnh & Thử món tiệc cưới — Golden Palace")}&dates=${formatGCalDate(tomorrow)}/${formatGCalDate(tomorrowEnd)}&details=${encodeURIComponent("Lịch hẹn tham quan đại sảnh và tư vấn thực đơn tiệc cưới tại Golden Palace. Hotline: 0228 6595 959 - Website: https://goldenpalacenamdinh.com")}&location=${encodeURIComponent("98 Đông A, KĐT Hòa Vượng, TP. Nam Định")}`;

  return (
    <div className="min-h-screen bg-slate-900/10 flex items-center justify-center p-4">
      {/* Background mô phỏng trang web nhà hàng */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isOpen ? (
          <div className="w-[360px] sm:w-[410px] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-3.5 sm:p-4 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-sm shadow-xs border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight">Golden Palace Assistant</h3>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-100 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>98 Đông A · Trực tuyến 8:00 - 10:30</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition text-white/80 hover:text-white"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/60" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
                  Hôm nay · Hotline: 0228 6595 959
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

                    {/* Nút Điểm WOW: Thêm vào Google Calendar nếu có ý định đặt hẹn */}
                    {m.appointmentIntent && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          ✓ Đã chuẩn bị sẵn lịch xem sảnh sáng mai (8:00 - 10:30)
                        </span>
                        <a
                          href={googleCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition border border-blue-200 shadow-2xs"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Thêm vào Google Calendar</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {m.time}
                  </span>

                  {/* AI gợi ý 3 câu liên quan (Tiêu chí Phải Chạy - Must-be của BTC) */}
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
            <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
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
                🖼️ Ảnh không gian sảnh
              </button>
              <button
                type="button"
                onClick={() => sendMessageWithText("Địa chỉ nhà hàng ở đâu?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0"
              >
                📍 Địa chỉ & Maps
              </button>
              <button
                type="button"
                onClick={() => sendMessageWithText("Nhà hàng đón khách lúc mấy giờ?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0"
              >
                ⏰ Giờ đón khách (8:00 - 10:30)
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
                placeholder="Nhập tin nhắn (thực đơn, địa chỉ, hẹn xem sảnh...)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
          >
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition" />
          </button>
        )}
      </div>
    </div>
  );
}

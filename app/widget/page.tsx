"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  Smile,
  Image as ImageIcon,
  Camera,
  ThumbsUp,
  Download,
  ZoomIn,
  ZoomOut,
  Check,
  CheckCheck,
  Heart,
  Loader2,
  Trash2,
} from "lucide-react";
import { FormattedMessage } from "@/components/chat/formatted-message";
import { getSmartBookingDefault, googleCalendarUrl } from "@/lib/crm/appointment";
import { saveChatBooking } from "@/lib/crm/client";
import { BOOKING_TYPES, formatAppointment } from "@/lib/crm/model";
import { visitIntent } from "@/lib/chat/follow-ups";
import { playChatTone, playBookingSuccessCelebrationTone, unlockAudioContext } from "@/lib/chat/sound";
import { useVisualViewport } from "@/lib/chat/use-visual-viewport";
import { type BookingDraftInfo } from "@/lib/chat/booking-extractor";
import { compressImageToJpeg, formatFileSize, type CompressedImageResult } from "@/lib/chat/image-utils";
import { syncWidgetChatToInbox, WIDGET_SESSION_STORAGE_KEY } from "@/lib/inbox/widget-sync";

export interface WidgetAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
}

export interface WidgetMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  attachments?: WidgetAttachment[];
  reaction?: string;
  suggestedQuestions?: string[];
  visitType?: ReturnType<typeof visitIntent>;
  customCalendarUrl?: string;
  bookingDraft?: BookingDraftInfo | null;
  handoff?: boolean;
}

// 6 biểu cảm kinh điển phong cách Facebook Messenger & Zalo
const META_REACTIONS = [
  { id: "love", emoji: "❤️", label: "Yêu thích" },
  { id: "like", emoji: "👍", label: "Thích" },
  { id: "haha", emoji: "😆", label: "Haha" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Buồn" },
  { id: "angry", emoji: "😡", label: "Phẫn nộ" },
] as const;

// Nhóm Emoji nhanh phong cách Messenger / Zalo
const EMOJI_GROUPS = [
  {
    name: "Cảm xúc",
    emojis: ["😊", "😂", "🥰", "😍", "🥳", "😎", "🤔", "😅", "🥺", "😇", "🤩", "🤗"],
  },
  {
    name: "Cử chỉ",
    emojis: ["👍", "❤️", "🙏", "👏", "🤝", "🔥", "💯", "✨", "🎉", "👌", "💪", "💐"],
  },
  {
    name: "Tiệc cưới & F&B",
    emojis: ["🏛️", "🍽️", "🥂", "🎂", "💍", "👰", "🤵", "📅", "📍", "📞", "💌", "⭐"],
  },
];

function WebWidgetContent() {
  const router = useRouter();
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

  // Đính kèm ảnh & Trạng thái nén ảnh
  const [selectedImages, setSelectedImages] = useState<CompressedImageResult[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Popup & Menus
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; name?: string } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const [messages, setMessages] = useState<WidgetMessage[]>([
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
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc bot đang phản hồi
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, selectedImages]);

  // Tự động tải lại lịch sử chat trước đó của khách trên Widget (nếu có)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(WIDGET_SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          if (parsed.activeBookingDraft) {
            setActiveBookingDraft(parsed.activeBookingDraft);
          }
        }
      }
    } catch {}
  }, []);

  // Tự động đồng bộ tin nhắn khách chat trên widget và lịch hẹn sang Hộp thư Inbox để con người kiểm soát
  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) return;
    try {
      localStorage.setItem(
        WIDGET_SESSION_STORAGE_KEY,
        JSON.stringify({ messages, activeBookingDraft, lastUpdated: new Date().toISOString() })
      );
      syncWidgetChatToInbox(
        messages,
        activeBookingDraft
          ? {
              fullName: activeBookingDraft.fullName || "Khách Web",
              phone: activeBookingDraft.phone || "",
              appointmentTime: activeBookingDraft.dateTimeIso || getSmartBookingDefault(),
              eventType: activeBookingDraft.eventType || "xem_sanh",
              guestsCount: activeBookingDraft.guestsCount || 2,
              notes: activeBookingDraft.notes || "",
            }
          : undefined
      );
    } catch {}
  }, [messages, activeBookingDraft]);

  // Phím tắt ESC để đóng Lightbox hoặc Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewModalImage) setPreviewModalImage(null);
        if (activeReactionMenu) setActiveReactionMenu(null);
        if (emojiOpen) setEmojiOpen(false);
        if (showBookingModal) setShowBookingModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewModalImage, activeReactionMenu, emojiOpen, showBookingModal]);

  const handleCloseWidget = () => {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "omnichat-close" }, "*");
    }
    setIsOpen(false);
  };

  const handleResetChat = () => {
    setActiveBookingDraft(null);
    setSelectedImages([]);
    setActiveReactionMenu(null);
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

  // ================= XỬ LÝ ẢNH ĐÍNH KÈM (CROSS-PLATFORM) =================
  const processImageFiles = async (files: FileList | File[]) => {
    setImageError(null);
    const validFiles = Array.from(files).filter((f) =>
      /^image\/(png|jpe?g|webp|gif|heic|heif)$/i.test(f.type) ||
      /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      setImageError("Vui lòng chọn file hình ảnh (JPG, PNG, WebP, GIF, HEIC).");
      return;
    }

    if (selectedImages.length + validFiles.length > 4) {
      setImageError("Mỗi tin nhắn tối đa 4 hình ảnh.");
      return;
    }

    setIsCompressing(true);
    try {
      const compressedList: CompressedImageResult[] = [];
      for (const file of validFiles) {
        const result = await compressImageToJpeg(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.85,
        });
        compressedList.push(result);
      }
      setSelectedImages((prev) => [...prev, ...compressedList]);
      if (soundEnabled) playChatTone();
    } catch (err: any) {
      console.error("Lỗi nén ảnh:", err);
      setImageError("Không thể xử lý ảnh. Vui lòng thử lại với ảnh khác!");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void processImageFiles(e.target.files);
    }
  };

  const handleRemoveSelectedImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Hỗ trợ Paste ảnh từ Clipboard (Ctrl + V / Cmd + V)
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!e.clipboardData) return;
    const items = Array.from(e.clipboardData.items);
    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      void processImageFiles(imageFiles);
    }
  };

  // Hỗ trợ Kéo & Thả ảnh (Drag & Drop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processImageFiles(e.dataTransfer.files);
    }
  };

  // ================= THẢ CẢM XÚC TIN NHẮN (REACTION) =================
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const newReaction = msg.reaction === emoji ? undefined : emoji;
          return { ...msg, reaction: newReaction };
        }
        return msg;
      })
    );
    setActiveReactionMenu(null);
    if (soundEnabled) playChatTone();
  };

  // Chèn Emoji vào ô nhập tin nhắn
  const handleInsertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  // Gửi icon Thumbs Up kinh điển của Facebook Messenger
  const handleSendLike = () => {
    void sendMessageWithText("👍");
  };

  // Tự động chốt lịch hẹn trực tiếp khi đã đủ thông tin (NLP Auto-Book)
  const saveDirectBooking = async (
    draft: BookingDraftInfo,
    baseMessages: WidgetMessage[] = messages,
  ) => {
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

      // Phát hiệu ứng âm thanh chúc mừng đặt lịch thành công
      unlockAudioContext();
      void playBookingSuccessCelebrationTone(true);

      const autoBookMsg: WidgetMessage = {
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
      };

      const updatedMsgs = [...baseMessages, autoBookMsg];
      setMessages(updatedMsgs);
      syncWidgetChatToInbox(updatedMsgs, {
        fullName: draft.fullName,
        phone: cleanPhone,
        appointmentTime: visit.appointment_time,
        eventType: draft.eventType,
        guestsCount: draft.guestsCount || 2,
        notes: draft.notes,
      });

      window.dispatchEvent(new Event("storage"));
      setShowBookingModal(false);
      setActiveBookingDraft(null);
    } catch (e: any) {
      console.error("Auto booking error:", e);
      const isBusy = /bận|khung giờ|đổi qua|lịch/i.test(e?.message || "") || e?.status === 409;
      const replyContent = isBusy
        ? "Dạ khung giờ này bên em bận rồi ạ, anh/chị vui lòng đổi qua khung giờ khác giúp em nhé!"
        : `Dạ ${e?.message || "chưa lưu được lịch hẹn"}. Anh/chị vui lòng đổi qua khung giờ khác giúp em nhé!`;

      const busyBotMsg: WidgetMessage = {
        id: `b-busy-${Date.now()}`,
        sender: "bot",
        text: replyContent,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedQuestions: [
          "Đổi sang 09:30",
          "Đổi sang 10:00",
          "Hotline: 0228 659 5959",
        ],
      };
      const updatedMsgs = [...baseMessages, busyBotMsg];
      setMessages(updatedMsgs);
      syncWidgetChatToInbox(updatedMsgs);
    }
  };

  // Gửi tin nhắn kèm text và hình ảnh
  const sendMessageWithText = async (textToSend: string, imagesToSend: CompressedImageResult[] = []) => {
    const userText = textToSend.trim();
    if ((!userText && imagesToSend.length === 0) || loading || isCompressing) return;

    const attachmentsPayload: WidgetAttachment[] = imagesToSend.map((img) => ({
      id: img.id,
      name: img.name,
      url: img.dataUrl,
      size: img.size,
    }));

    const userMsg: WidgetMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userText,
      attachments: attachmentsPayload.length > 0 ? attachmentsPayload : undefined,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextUserMessages = [...messages, userMsg];
    setMessages(nextUserMessages);
    // Đồng bộ tức thì tin nhắn khách gửi sang Hộp thư Admin
    syncWidgetChatToInbox(
      nextUserMessages,
      activeBookingDraft
        ? {
            fullName: activeBookingDraft.fullName || "Khách Web",
            phone: activeBookingDraft.phone || "",
            appointmentTime: activeBookingDraft.dateTimeIso || getSmartBookingDefault(),
            eventType: activeBookingDraft.eventType || "xem_sanh",
            guestsCount: activeBookingDraft.guestsCount || 2,
            notes: activeBookingDraft.notes || "",
          }
        : undefined
    );

    setInput("");
    setSelectedImages([]);
    setImageError(null);
    setEmojiOpen(false);
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
          attachments: attachmentsPayload,
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
              message: userText || (attachmentsPayload.length > 0 ? "Khách gửi hình ảnh" : ""),
              platform: "Web Widget",
            },
          }),
        }).catch(() => {});
      }

      if (data.autoBooked && data.bookingDraft) {
        await saveDirectBooking(data.bookingDraft, nextUserMessages);
      } else {
        const botReplyMsg: WidgetMessage = {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: data.reply || "Dạ em đã ghi nhận thông tin của anh/chị ạ!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedQuestions: data.suggestedQuestions,
          visitType: resolvedVisitType,
          bookingDraft: data.bookingDraft,
          handoff: isHandoff,
        };

        const nextBotMessages = [...nextUserMessages, botReplyMsg];
        setMessages(nextBotMessages);

        // Đồng bộ tức thì câu trả lời của Bot sang Hộp thư Admin
        const effectiveDraft = data.bookingDraft || activeBookingDraft;
        syncWidgetChatToInbox(
          nextBotMessages,
          effectiveDraft
            ? {
                fullName: effectiveDraft.fullName || "Khách Web",
                phone: effectiveDraft.phone || "",
                appointmentTime: effectiveDraft.dateTimeIso || getSmartBookingDefault(),
                eventType: effectiveDraft.eventType || "xem_sanh",
                guestsCount: effectiveDraft.guestsCount || 2,
                notes: effectiveDraft.notes || "",
              }
            : undefined
        );
      }
    } catch {
      const errBotMsg: WidgetMessage = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "Dạ kết nối đang chập chờn, anh/chị liên hệ Hotline 0228 6595 959 để được hỗ trợ tức thì nhé!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const withErr = [...nextUserMessages, errBotMsg];
      setMessages(withErr);
      syncWidgetChatToInbox(
        withErr,
        activeBookingDraft
          ? {
              fullName: activeBookingDraft.fullName || "Khách Web",
              phone: activeBookingDraft.phone || "",
              appointmentTime: activeBookingDraft.dateTimeIso || getSmartBookingDefault(),
              eventType: activeBookingDraft.eventType || "xem_sanh",
              guestsCount: activeBookingDraft.guestsCount || 2,
              notes: activeBookingDraft.notes || "",
            }
          : undefined
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void sendMessageWithText(input, selectedImages);
  };

  function openBooking(type: "xem_sanh" | "thu_mon" | "tu_van_su_kien" = "xem_sanh") {
    setBookingType(type);
    if (!activeBookingDraft?.dateTimeIso) {
      setBookingTime(getSmartBookingDefault());
    }
    setBookingError("");
    setShowBookingModal(true);
  }

  // Submit Form Đặt lịch trực tiếp trong chat
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudioContext();
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

      // Phát hiệu ứng âm thanh chúc mừng đặt lịch thành công
      unlockAudioContext();
      void playBookingSuccessCelebrationTone(true);

      const confirmMsg: WidgetMessage = {
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
      };

      const updatedMsgs = [...messages, confirmMsg];
      setMessages(updatedMsgs);
      syncWidgetChatToInbox(updatedMsgs, {
        fullName: bookingName.trim(),
        phone: cleanPhone,
        appointmentTime: visit.appointment_time,
        eventType: bookingType,
        guestsCount: bookingGuests,
        notes: bookingNotes.trim(),
      });
      window.dispatchEvent(new Event("storage"));

      setShowBookingModal(false);
      setBookingNotes("");
    } catch (e: any) {
      setBookingError(e?.message || "Không thể lưu lịch hẹn. Vui lòng thử lại!");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const hasContentToSend = input.trim().length > 0 || selectedImages.length > 0;

  return (
    <div
      className={`widget-shell min-h-dvh ${isEmbedded ? "bg-transparent" : "bg-slate-900/10"}`}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background mô phỏng khi xem trực tiếp trên tab riêng */}
      {!isEmbedded && (
        <div className="hidden sm:block fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]" />
      )}

      {/* Floating Chat Widget Container */}
      <div
        ref={viewportRef}
        className={`group/chat fixed inset-x-0 top-[var(--chat-top,0px)] z-50 flex h-[var(--chat-height,100dvh)] flex-col items-end ${
          isEmbedded || !isOpen ? "" : "widget-viewport sm:inset-auto sm:bottom-6 sm:right-6 sm:h-auto"
        } ${isOpen ? "" : "pointer-events-none"}`}
      >
        {isOpen ? (
          <div
            className={`${
              isEmbedded
                ? "w-full h-full rounded-none border-0"
                : "widget-panel w-full h-full sm:w-[420px] sm:h-[min(640px,calc(100dvh-2.5rem))] rounded-none sm:rounded-3xl border-0 sm:border"
            } bg-white shadow-2xl border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in sm:slide-in-from-bottom-5 duration-200 relative`}
          >
            {/* Top Switcher Bar: Chuyển đổi nhanh 2 chiều giữa Widget Khách Hàng ⇋ Quản Trị Admin */}
            {!isEmbedded && (
              <div className="bg-slate-950 text-white text-[11px] px-3.5 pb-1.5 pt-[calc(0.4rem+var(--safe-top,0px))] flex items-center justify-between shrink-0 border-b border-slate-800 z-20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-slate-300 font-medium truncate">Giao diện Chat Khách Hàng</span>
                </div>
                <Link
                  href="/inbox"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition shadow-xs active:scale-95 shrink-0"
                  title="Quay lại Trang Quản Trị Admin"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Về Trang Admin</span>
                </Link>
              </div>
            )}

            {/* ================= HEADER CHUẨN ZALO / MESSENGER ================= */}
            <div
              style={{
                background: `linear-gradient(135deg, ${customColor}, #3b82f6, #4338ca)`,
              }}
              className={`widget-header flex shrink-0 flex-wrap items-center justify-between gap-x-2 bg-blue-600 pb-2 pl-[max(0.75rem,var(--safe-left))] pr-[max(0.75rem,var(--safe-right))] ${
                isEmbedded ? "pt-[calc(0.75rem+var(--safe-top))]" : "pt-2.5"
              } text-white shadow-xs select-none sm:p-3.5`}
            >
              {/* Bot Info Profile */}
              <div className="flex min-w-0 flex-1 items-center gap-2 max-sm:basis-full sm:gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-sm shadow-xs border border-white/20 bg-white/10">
                    <img
                      src="/icon-192.png"
                      alt="OmniChat Bot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Chấm trạng thái Online nhấp nháy chuẩn Messenger */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                      isAiActive ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  >
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight max-w-[180px] truncate">
                      {customTitle}
                    </h3>
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-100 mt-0.5">
                    <span className="truncate">
                      {isAiActive
                        ? "98 Đông A · Đón tiếp 8:00 - 10:30"
                        : "⚡ Tư vấn viên trực tuyến"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons trên Header */}
              <div className="flex shrink-0 flex-wrap items-center gap-1 max-sm:ml-auto group-data-[keyboard-open]/chat:hidden">
                {/* Nút Quay lại Admin nhanh trực tiếp trên Header */}
                {!isEmbedded && (
                  <Link
                    href="/inbox"
                    title="Quay lại Trang Quản Trị Hộp thư Admin"
                    className="flex min-h-11 sm:min-h-8 items-center gap-1 rounded-xl border border-white/30 bg-white/20 px-2 text-xs font-bold text-white hover:bg-white/30 transition shadow-2xs active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Về Admin</span>
                    <span className="sm:hidden">Admin</span>
                  </Link>
                )}

                {/* Nút Đặt lịch */}
                <button
                  type="button"
                  title="Đặt lịch tư vấn & xem sảnh"
                  onClick={() => openBooking()}
                  className="flex min-h-11 sm:min-h-8 items-center gap-1 rounded-xl border border-white/20 bg-white/15 px-2.5 text-xs font-semibold text-white hover:bg-white/25 transition shadow-2xs active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đặt lịch</span>
                </button>

                {/* Nút Đổi âm thanh */}
                <button
                  type="button"
                  title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                  onClick={() => {
                    if (!soundEnabled) playChatTone();
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="grid h-11 w-11 sm:h-8 sm:w-8 place-items-center rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition active:scale-90"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/60" />
                  )}
                </button>

                {/* Reset cuộc trò chuyện */}
                <button
                  type="button"
                  title="Làm mới cuộc trò chuyện"
                  onClick={handleResetChat}
                  className="grid h-11 w-11 sm:h-8 sm:w-8 place-items-center rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition active:scale-90"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Đóng widget */}
                <button
                  type="button"
                  title="Đóng khung chat"
                  onClick={handleCloseWidget}
                  className="grid h-11 w-11 sm:h-8 sm:w-8 place-items-center rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ================= OVERLAY KÉO THẢ ẢNH (DRAG & DROP) ================= */}
            {isDragOver && (
              <div className="absolute inset-0 z-40 bg-blue-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-150">
                <ImageIcon className="w-16 h-16 mb-2 animate-bounce" />
                <h4 className="text-lg font-bold">Thả hình ảnh vào đây</h4>
                <p className="text-xs text-blue-100 mt-1">
                  Hỗ trợ JPG, PNG, WebP, GIF, HEIC · Tối đa 4 ảnh
                </p>
              </div>
            )}

            {/* ================= KHUNG NỘI DUNG TIN NHẮN (MESSAGE STREAM) ================= */}
            <div
              ref={scrollRef}
              onClick={() => {
                if (activeReactionMenu) setActiveReactionMenu(null);
                if (emojiOpen) setEmojiOpen(false);
              }}
              className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain bg-[#f3f4f6]/70 py-3.5 pl-[max(0.75rem,var(--safe-left,0px))] pr-[max(0.75rem,var(--safe-right,0px))]"
            >
              {/* Badge thông báo Hotline đầu ngày */}
              <div className="text-center my-1">
                <span className="text-[10px] text-slate-500 font-medium bg-white/90 border border-slate-200/80 px-3 py-1 rounded-full shadow-2xs inline-flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-blue-600" />
                  <span>Golden Palace · Hotline hỗ trợ: <strong>0228 6595 959</strong></span>
                </span>
              </div>

              {messages.map((m) => {
                const isUser = m.sender === "user";
                const isReactionMenuOpen = activeReactionMenu === m.id;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col group/msg relative ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[92%] sm:max-w-[88%]">
                      {/* Avatar Bot bên cạnh tin nhắn đầu tiên */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mb-1 shadow-2xs ring-1 ring-slate-200">
                          <img
                            src="/icon-192.png"
                            alt="OmniChat"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* VÙNG BONG BÓNG TIN NHẮN CHUẨN ZALO / MESSENGER */}
                      <div className="relative">
                        <div
                          className={`relative break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed transition-all shadow-2xs ${
                            isUser
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                          }`}
                        >
                          {/* 1. HIỂN THỊ DANH SÁCH ẢNH ĐÍNH KÈM (IMAGE GRID) */}
                          {m.attachments && m.attachments.length > 0 && (
                            <div
                              className={`mb-2 ${
                                m.attachments.length === 1
                                  ? "max-w-[280px]"
                                  : "grid grid-cols-2 gap-1.5 max-w-[280px]"
                              }`}
                            >
                              {m.attachments.map((att, idx) => (
                                <div
                                  key={att.id || idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewModalImage({ url: att.url, name: att.name });
                                    setLightboxZoom(1);
                                  }}
                                  className="relative group/media overflow-hidden rounded-xl bg-slate-900/10 cursor-pointer aspect-auto shadow-2xs border border-black/5 hover:opacity-95 transition"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.name || `Ảnh ${idx + 1}`}
                                    className={`w-full object-cover transition-transform duration-200 group-hover/media:scale-105 ${
                                      m.attachments?.length === 1
                                        ? "max-h-56 rounded-xl"
                                        : "h-28 rounded-lg"
                                    }`}
                                  />
                                  {/* Overlay hover phóng to ảnh */}
                                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="p-1.5 rounded-full bg-white/90 text-slate-800 shadow-sm flex items-center gap-1 text-[10px] font-semibold">
                                      <ZoomIn className="w-3.5 h-3.5" />
                                      <span>Xem ảnh</span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 2. HIỂN THỊ NỘI DUNG VĂN BẢN (LINK & ACTION BUTTONS) */}
                          {m.text && (
                            <FormattedMessage
                              text={m.text}
                              isUser={isUser}
                            />
                          )}

                          {/* 3. THẺ TÓM TẮT PHIẾU HẸN (NLP PREVIEW) */}
                          {m.bookingDraft && (m.bookingDraft.fullName || m.bookingDraft.timeStr) && !m.bookingDraft.isComplete && (
                            <div className="mt-2 p-2.5 bg-blue-50/90 border border-blue-200/80 rounded-xl text-[11px] space-y-1 text-slate-800">
                              <div className="flex items-center justify-between font-semibold text-blue-900">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span>
                                    {m.bookingDraft.fullName ? `Khách: ${m.bookingDraft.fullName}` : ""}{" "}
                                    {m.bookingDraft.timeStr ? `· ${m.bookingDraft.timeStr} (${m.bookingDraft.dateStr})` : ""}
                                  </span>
                                </span>
                                <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  Chờ SĐT
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px]">
                                👉 Quý khách nhắn số điện thoại vào chat để em chốt lịch ngay nhé!
                              </p>
                            </div>
                          )}

                          {/* 3.1 NÚT ĐẶT LỊCH 1-CHẠM KHI NHẬN DIỆN Ý ĐỊNH ĐẶT LỊCH */}
                          {m.visitType && !m.customCalendarUrl && !m.bookingDraft?.isComplete && (
                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openBooking(m.visitType || "xem_sanh")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>📅 Mở form chọn ngày giờ xem sảnh</span>
                              </button>
                            </div>
                          )}

                          {/* 4. NÚT GOOGLE CALENDAR 1-CHẠM KHI CHỐT LỊCH THÀNH CÔNG */}
                          {m.customCalendarUrl && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100">
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

                          {/* 5. NÚT GỌI HOTLINE KHI HANDOFF TƯ VẤN VIÊN */}
                          {m.handoff && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                              <a
                                href="tel:02286595959"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition border border-rose-200 shadow-2xs"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Gọi Hotline 0228 659 5959</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* HUY HIỆU REACTION ĐÃ THẢ (REACTION BADGE CHUẨN ZALO / MESSENGER) */}
                        {m.reaction && (
                          <button
                            type="button"
                            title="Bấm để gỡ cảm xúc"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReaction(m.id, m.reaction!);
                            }}
                            className={`absolute -bottom-2 ${
                              isUser ? "left-2" : "right-2"
                            } z-10 flex items-center gap-0.5 bg-white border border-slate-200/90 rounded-full px-1.5 py-0.5 shadow-xs hover:scale-110 active:scale-95 transition-all text-xs`}
                          >
                            <span>{m.reaction}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">1</span>
                          </button>
                        )}

                        {/* NÚT KÍCH HOẠT REACTION NHANH (HIỆN KHI HOVER HOẶC BẤM) */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 ${
                            isUser ? "-left-8" : "-right-8"
                          }`}
                        >
                          <button
                            type="button"
                            title="Thả cảm xúc"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReactionMenu(isReactionMenuOpen ? null : m.id);
                            }}
                            className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-500 hover:text-amber-500 hover:bg-slate-50 transition active:scale-90"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* THANH FLOATING REACTION BAR NỔI 6 BIỂU CẢM KINH ĐIỂN */}
                        {isReactionMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute -top-11 z-30 flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-full px-2 py-1 shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
                              isUser ? "right-0" : "left-0"
                            }`}
                          >
                            {META_REACTIONS.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                title={r.label}
                                onClick={() => handleToggleReaction(m.id, r.emoji)}
                                className={`text-base sm:text-lg hover:scale-130 active:scale-110 transition-transform p-0.5 rounded-full ${
                                  m.reaction === r.emoji ? "bg-blue-50 ring-2 ring-blue-400" : ""
                                }`}
                              >
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DÒNG THỜI GIAN & TRẠNG THÁI GỬI (ĐÃ NHẬN ✓✓) */}
                    <div
                      className={`flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1 ${
                        isUser ? "justify-end" : "justify-start pl-8"
                      }`}
                    >
                      <span>{m.time}</span>
                      {isUser && (
                        <span className="flex items-center text-blue-600 font-medium">
                          <CheckCheck className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* AI GỢI Ý 3 CÂU LIÊN QUAN (MUST-BE CỦA BTC) */}
                    {!isUser && m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                      <div className="mt-2 mb-1 max-w-[92%] flex flex-wrap gap-1.5 pl-8">
                        {m.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => void sendMessageWithText(q)}
                            className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-full transition shadow-2xs text-left active:scale-95 inline-flex items-center gap-1"
                          >
                            <span>💬</span>
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Indicator Bot đang gõ */}
              {loading && (
                <div className="flex items-center gap-2 text-slate-500 text-xs px-2 py-1">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs text-[11px] font-bold">
                    GP
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2 shadow-2xs flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-slate-400 ml-1">Golden Palace đang trả lời…</span>
                  </div>
                </div>
              )}
            </div>

            {/* ================= QUICK CHIPS GỢI Ý NHANH ================= */}
            <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-slate-200/80 bg-slate-100/90 py-1.5 pl-[max(0.75rem,var(--safe-left,0px))] pr-[max(0.75rem,var(--safe-right,0px))] text-[11px] select-none no-scrollbar">
              <button
                type="button"
                onClick={() => openBooking()}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full whitespace-nowrap shadow-xs transition shrink-0 flex items-center gap-1 active:scale-95"
              >
                <Calendar className="w-3 h-3" />
                <span>Đặt lịch xem sảnh</span>
              </button>
              <button
                type="button"
                onClick={() => void sendMessageWithText("Thực đơn tiệc cưới bao nhiêu một bàn?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0 active:scale-95"
              >
                🍽️ Thực đơn bàn tiệc
              </button>
              <button
                type="button"
                onClick={() => void sendMessageWithText("Cho tôi xem ảnh không gian sảnh tiệc")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0 active:scale-95"
              >
                🖼️ Ảnh sảnh tiệc
              </button>
              <button
                type="button"
                onClick={() => void sendMessageWithText("Địa chỉ nhà hàng ở đâu?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0 active:scale-95"
              >
                📍 98 Đông A Maps
              </button>
              <button
                type="button"
                onClick={() => void sendMessageWithText("Nhà hàng đón khách lúc mấy giờ?")}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap shadow-2xs transition shrink-0 active:scale-95"
              >
                ⏰ Đón khách 8:00-10:30
              </button>
            </div>

            {/* ================= THANH PREVIEW ẢNH ĐANG CHỌN (ATTACHMENT PREVIEW BAR) ================= */}
            {selectedImages.length > 0 && (
              <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-slate-200 bg-blue-50/70 p-2 text-xs">
                {selectedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative shrink-0 w-14 h-14 rounded-xl border border-blue-200 overflow-hidden bg-white shadow-2xs group/thumb"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      title="Xóa ảnh này"
                      onClick={() => handleRemoveSelectedImage(img.id)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-[8px] text-white text-center truncate px-0.5">
                      {formatFileSize(img.size)}
                    </span>
                  </div>
                ))}

                {isCompressing && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 px-2 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang nén ảnh...</span>
                  </div>
                )}
              </div>
            )}

            {imageError && (
              <div className="bg-rose-50 text-rose-700 border-t border-rose-200 px-3 py-1.5 text-[11px] flex items-center justify-between">
                <span>⚠️ {imageError}</span>
                <button
                  type="button"
                  onClick={() => setImageError(null)}
                  className="text-rose-500 hover:text-rose-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* ================= KHAY EMOJI PICKER POPUP ================= */}
            {emojiOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="border-t border-slate-200 bg-white p-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                  <div className="flex items-center gap-2">
                    {EMOJI_GROUPS.map((grp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveEmojiTab(idx)}
                        className={`text-xs px-2 py-0.5 rounded-lg transition font-medium ${
                          activeEmojiTab === idx
                            ? "bg-blue-100 text-blue-700"
                            : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {grp.name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmojiOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto">
                  {EMOJI_GROUPS[activeEmojiTab].emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="text-xl p-1.5 rounded-lg hover:bg-slate-100 active:scale-90 transition flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ================= COMPOSER NHẬP TIN NHẮN PHONG CÁCH ZALO / MESSENGER ================= */}
            <form
              onSubmit={handleSend}
              className="flex shrink-0 items-center gap-1.5 border-t border-slate-200 bg-white pl-[max(0.625rem,var(--safe-left))] pr-[max(0.625rem,var(--safe-right))] pt-2.5 pb-[calc(0.625rem+var(--safe-bottom))] group-data-[keyboard-open]/chat:pb-2.5"
            >
              {/* Input Nhập Nội dung (Bắt đầu từ lề an toàn bên trái) */}
              <div className="relative min-w-0 flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Nội dung tin nhắn"
                  placeholder={
                    selectedImages.length > 0
                      ? "Thêm lời nhắn cho ảnh..."
                      : "Nhập tin nhắn..."
                  }
                  enterKeyHint="send"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-full text-base sm:text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Nút Đính kèm ảnh (Native label cross-platform) */}
              <label
                htmlFor="widget-image-upload"
                title="Đính kèm hình ảnh (JPG, PNG, HEIC)"
                className="grid h-11 w-11 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer active:scale-90"
              >
                <ImageIcon className="w-5 h-5" />
                <input
                  id="widget-image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,image/heic,image/heif,.heic,.heif"
                  multiple
                  onChange={handleImageInputChange}
                  className="sr-only"
                />
              </label>

              {/* Nút Mở Emoji Picker */}
              <button
                type="button"
                title="Chèn biểu tượng cảm xúc"
                onClick={() => setEmojiOpen(!emojiOpen)}
                className={`grid h-11 w-11 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full transition active:scale-90 ${
                  emojiOpen
                    ? "bg-blue-100 text-blue-600"
                    : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Nút Gửi / Nút Thumbs Up (Like) phong cách Messenger */}
              {hasContentToSend ? (
                <button
                  type="submit"
                  aria-label="Gửi tin nhắn"
                  disabled={loading || isCompressing}
                  style={{ backgroundColor: customColor }}
                  className="grid h-11 w-11 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full text-white shadow-xs transition hover:opacity-90 active:scale-95 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Gửi tin nhắn"
                  title="Gửi nút thích 👍"
                  onClick={handleSendLike}
                  className="grid h-11 w-11 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full text-blue-600 hover:bg-blue-50 transition active:scale-90"
                >
                  <ThumbsUp className="w-5 h-5 fill-blue-600/20" />
                </button>
              )}
            </form>

            {/* ================= MODAL LIGHTBOX XEM ẢNH PHÓNG TO (IMAGE VIEWER) ================= */}
            {previewModalImage && (
              <div
                onClick={() => setPreviewModalImage(null)}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in duration-200"
              >
                {/* Header thanh công cụ Lightbox */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between w-full max-w-4xl text-white pb-3 border-b border-white/10"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-medium truncate">
                      {previewModalImage.name || "Hình ảnh chi tiết"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Phóng to */}
                    <button
                      type="button"
                      title="Phóng to"
                      onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.25, 2.5))}
                      className="p-2 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    {/* Thu nhỏ */}
                    <button
                      type="button"
                      title="Thu nhỏ"
                      onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.25, 0.75))}
                      className="p-2 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    {/* Mở tab mới */}
                    <a
                      href={previewModalImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Mở trong tab mới"
                      className="p-2 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {/* Tải về */}
                    <a
                      href={previewModalImage.url}
                      download={previewModalImage.name || "goldenpalace-photo.jpg"}
                      title="Tải ảnh về máy"
                      className="p-2 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {/* Nút Đóng */}
                    <button
                      type="button"
                      title="Đóng xem ảnh"
                      onClick={() => setPreviewModalImage(null)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition ml-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Vùng hiển thị ảnh phóng to */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center w-full max-h-[78vh] p-2 overflow-auto"
                >
                  <img
                    src={previewModalImage.url}
                    alt={previewModalImage.name || "Ảnh phóng to"}
                    style={{ transform: `scale(${lightboxZoom})` }}
                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-150 select-none"
                  />
                </div>

                {/* Chú thích chân trang Lightbox */}
                <div className="text-[11px] text-white/60 pt-2 text-center">
                  Nhấn <strong>ESC</strong> hoặc chạm ra ngoài để đóng xem ảnh
                </div>
              </div>
            )}

            {/* ================= MODAL ĐẶT LỊCH NHANH TRỰC TIẾP (POPUP FORM) ================= */}
            {showBookingModal && (
              <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs sm:items-center">
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
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-base sm:text-xs"
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

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudioContext();
                          void playBookingSuccessCelebrationTone(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl border border-amber-200 transition active:scale-95"
                        title="Nghe thử âm chuông tiệc cưới hân hoan khi đặt lịch thành công"
                      >
                        <span aria-hidden="true">🎉</span>
                        <span>Nghe thử âm chúc mừng</span>
                      </button>

                      <div className="flex items-center gap-2 ml-auto">
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
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {bookingSubmitting ? "Đang xếp lịch..." : "Xác nhận đặt lịch"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Nút Mở Widget Tròn Nổi & Nút Về Admin khi chat đang thu gọn */
          <div className="pointer-events-auto flex items-center gap-2 mt-auto mr-[max(1rem,var(--safe-right,0px))] mb-[max(1rem,var(--safe-bottom,0px))]">
            {!isEmbedded && (
              <Link
                href="/inbox"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900/95 text-white rounded-full text-xs font-bold shadow-xl border border-slate-700/80 backdrop-blur-md hover:bg-slate-800 transition active:scale-95"
                title="Quay lại Trang Quản Trị Admin"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về Admin</span>
              </Link>
            )}
            <button
              type="button"
              aria-label="Mở khung chat"
              onClick={() => setIsOpen(true)}
              style={{ backgroundColor: customColor }}
              className="widget-launcher group flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
            >
              <MessageSquare className="w-6 h-6 group-hover:scale-110 transition" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WebWidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-2.5 text-xs text-slate-400">
          <img src="/icon-192.png" alt="OmniChat" className="w-10 h-10 rounded-xl shadow-xs animate-pulse" />
          <span>Đang tải OmniChat Widget...</span>
        </div>
      }
    >
      <WebWidgetContent />
    </Suspense>
  );
}

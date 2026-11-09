"use client";
/* Local FileReader previews use data URLs; no image optimization is needed. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Archive,
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Expand,
  Heart,
  ImagePlus,
  Info,
  LoaderCircle,
  Minimize2,
  Send,
  Smile,
  Sparkles,
  X,
  Phone,
  UserCheck,
  UserPlus,
  Check,
  Users,
  Pin,
  PinOff,
  ThumbsUp,
  Copy,
  Download,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CHANNEL_LABELS,
  formatDate,
  formatTime,
  waitingLabel,
  detectContact,
} from "@/lib/inbox/helpers";
import { knowledgeBase } from "@/lib/inbox/demo-data";
import type { Attachment, Conversation } from "@/lib/inbox/types";
import { FormattedMessage } from "@/components/chat/formatted-message";
import { Avatar } from "./shared";
import { visitIntent } from "@/lib/chat/follow-ups";
import { compressImageToJpeg } from "@/lib/chat/image-utils";
import { googleCalendarUrl } from "@/lib/crm/appointment";
import { triggerHaptic } from "@/lib/mobile/haptics";
import { useSwipe } from "@/lib/hooks/use-touch-gestures";
import { useAuth } from "@/lib/auth/auth-context";

interface Props {
  conversation: Conversation;
  draft: string;
  generatingDraft: boolean;
  attachments: Attachment[];
  onDraft: (text: string) => void;
  onAttachments: (attachments: Attachment[]) => void;
  onSend: (customContent?: string) => void;
  onAsk: (question: string) => void;
  asking: boolean;
  onBook: (type: NonNullable<ReturnType<typeof visitIntent>>) => void;
  onGenerateDraft: () => void;
  botReplying?: boolean;
  onTriggerBotReply?: () => void;
  onAiToggle: (enabled: boolean) => void;
  onResolve: () => void;
  onArchive: () => void;
  onReaction: (id: string, reaction?: string) => void;
  onPinMessage?: (id: string) => void;
  onBack: () => void;
  onInfo: () => void;
  expanded: boolean;
  onExpand: () => void;
  notify: (message: string) => void;
  now: number;
  onAssign?: (assignedTo: string, staffName?: string) => void;
}

const META_REACTIONS = [
  { id: "love", emoji: "❤️", label: "Yêu thích" },
  { id: "like", emoji: "👍", label: "Thích" },
  { id: "haha", emoji: "😆", label: "Haha" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Buồn" },
  { id: "angry", emoji: "😡", label: "Phẫn nộ" },
] as const;

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
export function ChatPane({
  conversation,
  draft,
  generatingDraft,
  attachments,
  onDraft,
  onAttachments,
  onSend,
  onAsk,
  asking,
  onBook,
  onGenerateDraft,
  botReplying = false,
  onTriggerBotReply,
  onAiToggle,
  onResolve,
  onArchive,
  onReaction,
  onPinMessage,
  onBack,
  onInfo,
  expanded,
  onExpand,
  notify,
  now,
  onAssign,
}: Props) {
  const { currentUser, role, canAssignChat, users } = useAuth();
  const [assignOpen, setAssignOpen] = useState(false);
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pinnedMessage = conversation.messages.find(
    (m) => m.id === conversation.pinnedMessageId || m.pinned
  );

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(id);
      triggerHaptic("light");
      setTimeout(() => setHighlightedMessageId(null), 2500);
    }
  };
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const lastMessageContent = lastMessage?.content;
  const lastMessageId = lastMessage?.id;

  useEffect(() => {
    const element = streamRef.current;
    if (element) {
      const scrollBottom = () => {
        element.scrollTop = element.scrollHeight;
      };
      scrollBottom();
      const timer = setTimeout(scrollBottom, 80);
      return () => clearTimeout(timer);
    }
  }, [conversation.id, conversation.messages.length, lastMessageId, lastMessageContent]);
  const wait = waitingLabel(conversation, now);
  const isArchived = conversation.status === "archived";
  const customerPhone =
    conversation.lead?.phone ||
    detectContact(conversation.messages).phones[0] ||
    "";

  // Mobile edge swipe-to-back gesture
  const swipeSectionRef = useSwipe<HTMLElement>(
    {
      onSwipeRight: () => {
        triggerHaptic("light");
        onBack();
      },
    },
    { threshold: 60, edgeOnly: true }
  );
  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (!readingImage) onSend();
    }
  };
  async function attach(file?: File) {
    if (!file) return;
    if (attachments.length >= 4) {
      notify("Mỗi tin tối đa 4 hình ảnh đính kèm.");
      return;
    }
    setReadingImage(true);
    try {
      // Nén ảnh tự động qua HTML5 Canvas: hỗ trợ HEIC từ iOS, ảnh >10MB từ Android/Windows
      const compressed = await compressImageToJpeg(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
      });
      onAttachments([
        ...attachments,
        { id: compressed.id, name: compressed.name, dataUrl: compressed.dataUrl },
      ]);
      triggerHaptic("light");
    } catch {
      notify("Không thể xử lý ảnh. Vui lòng chọn ảnh khác.");
    } finally {
      setReadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Hỗ trợ dán ảnh trực tiếp từ Clipboard (Ctrl + V trên Windows / Cmd + V trên Mac)
  const onComposerPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!event.clipboardData) return;
    const items = Array.from(event.clipboardData.items);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          void attach(file);
          break;
        }
      }
    }
  };
  return (
    <section
      ref={swipeSectionRef}
      className="panel flex h-full flex-col"
      aria-label={`Hội thoại với ${conversation.name}`}
    >
      <header className="flex min-h-20 shrink-0 items-center justify-between gap-2 border-b px-3 py-3 sm:px-5 max-md:group-data-[keyboard-open]/chat:min-h-11 max-md:[@media(max-height:420px)]:min-h-11 max-md:group-data-[keyboard-open]/chat:py-1 max-md:[@media(max-height:420px)]:py-1">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Quay lại danh sách"
            onClick={onBack}
          >
            <ArrowLeft />
          </Button>
          <div className="hidden sm:block">
            <Avatar conversation={conversation} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="truncate text-sm font-semibold sm:text-base">
                {conversation.name}
              </h2>
              {wait && (
                <span className="text-[10px] text-rose-500">{wait}</span>
              )}
            </div>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {CHANNEL_LABELS[conversation.channel]} · Trung tâm Tiệc cưới & Sự
              kiện Golden Palace
            </p>
          </div>
          {customerPhone && (
            <a
              href={`tel:${customerPhone}`}
              onClick={() => triggerHaptic("medium")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold shrink-0 transition active:scale-95 shadow-xs"
              title={`Gọi cho ${conversation.name}: ${customerPhone}`}
              aria-label={`Gọi cho ${conversation.name}`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Gọi ngay</span>
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Nút Phân Công / Chỉ Định Nhân Viên (Admin & Quản lý) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              if (canAssignChat || conversation.assignedTo === "unassigned") {
                setAssignOpen(true);
              }
            }}
            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 shadow-2xs ${
              conversation.assignedStaffName
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : conversation.assignedTo === "me"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : conversation.assignedTo === "team"
                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse"
            }`}
            title={
              canAssignChat
                ? "Bấm để chỉ định nhân viên phụ trách phiên chat"
                : conversation.assignedTo === "unassigned"
                ? "Bấm để nhận phụ trách phiên chat này"
                : `Người phụ trách: ${conversation.assignedStaffName || "Đội tư vấn"}`
            }
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="max-w-[125px] truncate hidden sm:inline">
              {conversation.assignedStaffName
                ? `Phụ trách: ${conversation.assignedStaffName}`
                : conversation.assignedTo === "me"
                ? "Bạn phụ trách"
                : conversation.assignedTo === "team"
                ? "Đội tư vấn"
                : "Chưa phân công"}
            </span>
            <span className="sm:hidden text-[11px]">
              {conversation.assignedStaffName
                ? conversation.assignedStaffName.split(" ").pop()
                : "Gán"}
            </span>
            {canAssignChat && (
              <span className="text-[9px] text-blue-500 font-bold ml-0.5">▼</span>
            )}
          </button>

          <label
            className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground"
            title="Bật/Tắt Trợ lý AI tự động phản hồi hội thoại"
          >
            AI
            <Switch
              aria-label={`AI tự động cho ${conversation.name}`}
              checked={conversation.aiEnabled}
              onCheckedChange={onAiToggle}
            />
          </label>
          <Button
            variant="ghost"
            size="icon"
            title={
              conversation.status === "resolved"
                ? "Mở lại hội thoại"
                : "Đánh dấu đã xong"
            }
            aria-label={
              conversation.status === "resolved"
                ? "Mở lại hội thoại"
                : "Đánh dấu đã xong"
            }
            onClick={onResolve}
            className={cn(
              "hidden sm:inline-flex",
              conversation.status === "resolved" && "text-emerald-600",
            )}
            disabled={isArchived}
          >
            <CheckCircle2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={isArchived ? "Khôi phục hội thoại" : "Lưu trữ hội thoại"}
            aria-label={
              isArchived ? "Khôi phục hội thoại" : "Lưu trữ hội thoại"
            }
            onClick={onArchive}
            className="hidden sm:inline-flex"
          >
            <Archive />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={expanded ? "Thu gọn" : "Mở rộng khung chat"}
            aria-label={expanded ? "Thu gọn" : "Mở rộng khung chat"}
            className="hidden md:inline-flex"
            onClick={onExpand}
          >
            {expanded ? <Minimize2 /> : <Expand />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Thông tin khách hàng"
            aria-label="Thông tin khách hàng"
            className={expanded ? "inline-flex" : "xl:hidden"}
            onClick={onInfo}
          >
            <Info />
          </Button>
        </div>
      </header>

      {/* Banner thông báo AI đã chuyển giao cho tư vấn viên tiếp quản */}
      {!conversation.aiEnabled && conversation.status === "pending" && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-rose-50 px-4 py-2 text-xs text-rose-900 border-rose-200 shadow-2xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="font-bold text-[11px] uppercase tracking-wider text-rose-700 shrink-0">Chờ tiếp quản:</span>
            <p className="truncate text-xs text-rose-800 font-medium">
              {conversation.note || "Khách hàng gặp vấn đề ngoài phạm vi AI hoặc yêu cầu tư vấn viên hỗ trợ."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAiToggle(true)}
            className="px-2.5 py-1 text-[11px] text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-md font-medium transition shrink-0"
            title="Bật lại chế độ AI tự động trả lời"
          >
            🤖 Bật lại AI
          </button>
        </div>
      )}

      {/* Pinned Message Banner (Chuẩn Meta Business Suite) */}
      {pinnedMessage && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-amber-50/90 px-4 py-2 text-xs text-amber-900 border-amber-200/90 shadow-2xs animate-in slide-in-from-top-2 max-md:group-data-[keyboard-open]/chat:hidden max-md:[@media(max-height:420px)]:hidden">
          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 flex-1"
            onClick={() => scrollToMessage(pinnedMessage.id)}
            title="Bấm để cuộn đến tin nhắn này"
          >
            <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0 fill-amber-500" />
            <span className="font-bold text-[11px] uppercase tracking-wider text-amber-700 shrink-0">Tin đã ghim:</span>
            <p className="truncate text-xs text-slate-800 font-medium">{pinnedMessage.content}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => scrollToMessage(pinnedMessage.id)}
              className="px-2 py-0.5 text-[11px] text-amber-700 bg-amber-100/90 hover:bg-amber-200 rounded font-medium transition"
            >
              Xem
            </button>
            <button
              type="button"
              onClick={() => onPinMessage?.(pinnedMessage.id)}
              className="p-1 text-slate-400 hover:text-amber-800 rounded-md transition"
              title="Bỏ ghim tin nhắn"
              aria-label="Bỏ ghim tin nhắn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-[#fcfcff] px-4 py-2 text-[10px] text-muted-foreground max-md:group-data-[keyboard-open]/chat:hidden max-md:[@media(max-height:420px)]:group-data-[chat-open]/chat:hidden">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              conversation.status === "pending"
                ? "bg-amber-400"
                : conversation.status === "resolved"
                  ? "bg-emerald-400"
                  : "bg-blue-400",
            )}
          />
          {isArchived
            ? "Đã lưu trữ"
            : conversation.status === "resolved"
              ? "Đã hoàn tất tư vấn"
              : "Hội thoại đang mở"}
        </span>
        {conversation.aiEnabled ? (
          <span className="font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
            🤖 Trợ lý AI đang hỗ trợ
          </span>
        ) : (
          <span className="font-medium text-amber-700 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-full flex items-center gap-1">
            ⚡ AI đã tạm ngắt · Chuyên viên tiếp quản
          </span>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-b px-4 py-2 text-[10px] text-muted-foreground sm:hidden max-md:group-data-[keyboard-open]/chat:hidden max-md:[@media(max-height:420px)]:hidden">
        <button
          disabled={isArchived}
          className="disabled:opacity-40"
          onClick={onResolve}
        >
          {conversation.status === "resolved" ? "Mở lại" : "Đánh dấu đã xong"}
        </button>
        <button onClick={onArchive}>
          {isArchived ? "Khôi phục" : "Lưu trữ"}
        </button>
      </div>
      <div
        ref={streamRef}
        className="scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-[#fcfcff] p-4 sm:p-5 pb-8 sm:pb-12"
        role="log"
        aria-label="Tin nhắn"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {conversation.messages.map((message, index) => {
          if (message.content.startsWith("🔔")) {
            return (
              <div key={message.id || index} className="flex justify-center my-2.5">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-medium text-slate-600 shadow-2xs">
                  <span>{message.content}</span>
                </div>
              </div>
            );
          }
          const previousQuestion =
            message.sender === "bot"
              ? conversation.messages
                  .slice(0, index)
                  .findLast((item) => item.sender === "customer")?.content
              : undefined;
          const visit =
            !message.bookingConfirmation && previousQuestion
              ? visitIntent(previousQuestion)
              : undefined;
          const isCustomer = message.sender === "customer";
          const previous = conversation.messages[index - 1];
          const showDate =
            !previous ||
            formatDate(previous.createdAt) !== formatDate(message.createdAt);
          return (
            <div key={message.id}>
              {showDate && (
                <div className="mb-6 mt-1 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] capitalize text-muted-foreground">
                    {formatDate(message.createdAt)}
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              )}
              <div
                id={`msg-${message.id}`}
                className={cn(
                  "group relative flex items-end gap-2 transition-all p-1 rounded-2xl",
                  !isCustomer && "flex-row-reverse",
                  highlightedMessageId === message.id && "bg-amber-100/60 ring-2 ring-amber-400"
                )}
              >
                {isCustomer ? (
                  <Avatar conversation={conversation} small />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[8px] font-semibold text-primary">
                    {message.sender === "bot" ? (
                      <img
                        src="/icon-192.png"
                        alt="Bot"
                        className="h-full w-full rounded-full object-cover shadow-2xs"
                      />
                    ) : (
                      "NK"
                    )}
                  </div>
                )}
                <div className="min-w-0 max-w-[85%] sm:max-w-[80%] relative">
                  {/* Floating Meta Reaction Bar */}
                  {activeReactionMenu === message.id && (
                    <div
                      className={cn(
                        "absolute -top-11 z-30 flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-2xl border border-slate-200/90 animate-in zoom-in-90 duration-150",
                        isCustomer ? "left-0" : "right-0"
                      )}
                    >
                      {META_REACTIONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            onReaction(message.id, r.id);
                            setActiveReactionMenu(null);
                          }}
                          className="hover:scale-135 active:scale-110 transition-transform p-1 text-base cursor-pointer leading-none"
                          title={r.label}
                          aria-label={r.label}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={cn(
                      "relative rounded-2xl px-4 py-3 text-[13px] leading-[1.7] transition-all",
                      isCustomer
                        ? "rounded-bl-xs bg-[#f0f2f5] text-[#050505] border border-slate-200/40 shadow-2xs"
                        : "rounded-br-xs bg-[#0084ff] text-white shadow-xs",
                      (message.pinned || message.id === conversation.pinnedMessageId) &&
                        "ring-2 ring-amber-400/90 shadow-sm"
                    )}
                  >
                    {/* Badge đã ghim */}
                    {(message.pinned || message.id === conversation.pinnedMessageId) && (
                      <span className="absolute -top-2.5 right-3 px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-[9px] shadow-xs flex items-center gap-0.5 z-10">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        <span>Đã ghim</span>
                      </span>
                    )}

                    <FormattedMessage
                      text={message.content}
                      isUser={!isCustomer}
                    />
                    {message.bookingConfirmation && (
                      <a
                        href={googleCalendarUrl(message.bookingConfirmation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-primary shadow-xs hover:bg-slate-50 transition"
                      >
                        <CalendarDays className="h-4 w-4" /> Thêm vào Google Calendar
                      </a>
                    )}

                    {/* Media Attachments với Lightbox Trigger */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className={cn("grid gap-1.5", message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="relative group/media overflow-hidden rounded-xl border border-slate-200/60 bg-black/5 cursor-pointer shadow-xs"
                              onClick={() => setPreviewImage(attachment.dataUrl)}
                            >
                              <img
                                src={attachment.dataUrl}
                                alt={attachment.name}
                                className="max-h-56 w-full rounded-xl object-cover hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="p-1.5 rounded-full bg-white/90 text-slate-800 shadow-sm">
                                  <ZoomIn className="w-4 h-4" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Huy hiệu Reaction đã thả (Reaction Badge chuẩn Meta) */}
                    {(message.reaction || message.liked) && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          onReaction(message.id, message.reaction || "love");
                        }}
                        aria-label={message.liked ? "Bỏ thả tim" : "Thả tim"}
                        aria-pressed={Boolean(message.liked)}
                        className="absolute -bottom-2.5 right-2 flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-800"
                        title="Bấm để gỡ cảm xúc"
                      >
                        <span className="leading-none">
                          {META_REACTIONS.find((r) => r.id === message.reaction)?.emoji || "❤️"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Message Action Bar (Meta Style: Smile React, Pin, Copy) */}
                  <div
                    className={cn(
                      "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity flex items-center gap-0.5 mt-1",
                      !isCustomer ? "justify-end" : "justify-start"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReactionMenu(
                          activeReactionMenu === message.id ? null : message.id
                        )
                      }
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
                      title="Bày tỏ cảm xúc"
                      aria-label="Bày tỏ cảm xúc"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        onPinMessage?.(message.id);
                      }}
                      className={cn(
                        "p-1 rounded-md transition active:scale-95",
                        (message.pinned || message.id === conversation.pinnedMessageId)
                          ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      )}
                      title={
                        (message.pinned || message.id === conversation.pinnedMessageId)
                          ? "Bỏ ghim tin nhắn này"
                          : "Ghim tin nhắn quan trọng này lên đầu"
                      }
                      aria-label="Ghim tin nhắn"
                    >
                      <Pin
                        className={cn(
                          "w-3.5 h-3.5",
                          (message.pinned || message.id === conversation.pinnedMessageId) &&
                            "fill-current"
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(message.content);
                        notify("Đã sao chép nội dung tin nhắn.");
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
                      title="Sao chép tin nhắn"
                      aria-label="Sao chép tin nhắn"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {!isArchived && visit && (
                    <div
                      className="mt-2 flex flex-wrap justify-end gap-1.5"
                      aria-label="Gợi ý thao tác đặt lịch"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onBook(visit)}
                      >
                        <CalendarDays className="mr-1 h-3.5 w-3.5" /> Đặt lịch{" "}
                        {visit === "thu_mon" ? "thử món" : "xem sảnh"}
                      </Button>
                    </div>
                  )}
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-1 px-1 text-[9px] text-muted-foreground",
                      !isCustomer && "justify-end",
                    )}
                  >
                    <span>
                      {message.sender === "bot"
                        ? "Golden Palace Assistant · "
                        : message.sender === "agent"
                          ? "Bạn · "
                          : ""}
                    </span>
                    <time dateTime={message.createdAt}>
                      {formatTime(message.createdAt)}
                    </time>
                    {!isCustomer && (
                      <CheckCheck className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {botReplying && (
          <div className="group flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[8px] font-semibold text-primary">
              <Bot className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
            <div className="min-w-0 max-w-[85%] sm:max-w-[80%]">
              <div className="relative rounded-2xl rounded-bl-md bg-blue-50/90 border border-blue-200/80 px-4 py-2.5 text-xs text-blue-900 flex items-center gap-2.5 shadow-2xs">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span className="font-medium">Golden Palace AI đang soạn câu trả lời...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="relative shrink-0 border-t bg-white p-3 sm:p-4 max-md:group-data-[keyboard-open]/chat:p-1.5 max-md:[@media(max-height:420px)]:p-1">
        {isArchived ? (
          <div className="flex items-center justify-between gap-3 py-3">
            <p className="text-xs text-muted-foreground">
              Khôi phục hội thoại để tiếp tục trả lời.
            </p>
            <Button variant="outline" size="sm" onClick={onArchive}>
              Khôi phục
            </Button>
          </div>
        ) : (
          <>
            {attachments.length > 0 && (
              <div className="mb-2 flex gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="h-14 w-14 rounded-lg border object-cover"
                    />
                    <button
                      aria-label={`Bỏ ảnh ${attachment.name}`}
                      className="absolute -right-1 -top-1 rounded-full bg-slate-700 p-0.5 text-white"
                      onClick={() =>
                        onAttachments(
                          attachments.filter(
                            (item) => item.id !== attachment.id,
                          ),
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(() => {
              const lastMsg =
                conversation.messages[conversation.messages.length - 1];
              const isCustomerWaiting =
                conversation.aiEnabled && lastMsg?.sender === "customer";
              if (!isCustomerWaiting) return null;
              return (
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/90 px-3 py-2 text-xs text-blue-900 shadow-2xs animate-in fade-in max-md:group-data-[keyboard-open]/chat:hidden max-md:[@media(max-height:420px)]:hidden">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium">
                      Chế độ AI đang bật · Tin nhắn của khách đang chờ phản hồi
                    </span>
                  </div>
                  {onTriggerBotReply && (
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      disabled={botReplying}
                      className="h-7 px-3 text-[11px] bg-primary text-white hover:bg-primary/90 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0"
                      onClick={onTriggerBotReply}
                    >
                      {botReplying ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {botReplying ? "Đang trả lời..." : "Bot trả lời ngay"}
                      </span>
                    </Button>
                  )}
                </div>
              );
            })()}
            <Textarea
              ref={inputRef}
              aria-label="Nội dung tin nhắn"
              placeholder="Nhắn tin... (Hỗ trợ dán ảnh Ctrl+V / Cmd+V)"
              value={draft}
              onChange={(event) => onDraft(event.target.value)}
              onKeyDown={onComposerKeyDown}
              onPaste={onComposerPaste}
              maxLength={6000}
              className="mb-3 min-h-[62px] border-0 p-1 text-base shadow-none focus-visible:ring-0 max-md:group-data-[keyboard-open]/chat:mb-1 max-md:[@media(max-height:420px)]:mb-0.5 max-md:group-data-[keyboard-open]/chat:min-h-10 max-md:[@media(max-height:420px)]:min-h-9 md:text-[13px]"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Chèn cảm xúc"
                  aria-expanded={emojiOpen}
                  onClick={() => setEmojiOpen(!emojiOpen)}
                  className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Smile />
                </Button>
                {emojiOpen && (
                  <div className="absolute bottom-12 left-0 z-20 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl animate-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-1 pb-2 mb-2 border-b border-slate-100 overflow-x-auto scrollbar-none">
                      {EMOJI_GROUPS.map((group, idx) => (
                        <button
                          key={group.name}
                          type="button"
                          onClick={() => setActiveEmojiTab(idx)}
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-lg whitespace-nowrap transition",
                            activeEmojiTab === idx
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_GROUPS[activeEmojiTab].emojis.map((emoji) => (
                        <button
                          aria-label={`Chèn ${emoji}`}
                          key={emoji}
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            onDraft(draft + emoji);
                            setEmojiOpen(false);
                            inputRef.current?.focus();
                          }}
                          className="flex items-center justify-center p-1.5 rounded-lg text-lg hover:bg-slate-100 hover:scale-120 active:scale-95 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <label
                htmlFor="inbox-file-upload"
                title="Đính kèm ảnh (Hỗ trợ chụp từ camera, HEIC iPhone, nén ảnh tự động)"
                aria-label="Đính kèm ảnh"
                className={`inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition active:scale-95 ${
                  readingImage ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {readingImage ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <input
                  id="inbox-file-upload"
                  ref={fileRef}
                  type="file"
                  accept="image/*,image/heic,image/heif,.heic,.heif"
                  className="sr-only"
                  aria-label="Chọn ảnh đính kèm"
                  onChange={(event) => void attach(event.target.files?.[0])}
                />
              </label>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full border border-blue-200 px-2 text-[11px] sm:px-3 text-blue-700 bg-blue-50 hover:bg-blue-100"
                  disabled={generatingDraft}
                  aria-busy={generatingDraft}
                  onClick={() => {
                    onGenerateDraft();
                    inputRef.current?.focus();
                  }}
                >
                  {generatingDraft ? (
                    <LoaderCircle className="!h-3.5 !w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="!h-3.5 !w-3.5" />
                  )}
                  Soạn nháp AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-2 text-[11px] sm:px-3 text-slate-600"
                  onClick={() => setSnippetsOpen(true)}
                >
                  / Kho tin
                </Button>

                {/* Nút Thích 👍 nhanh chuẩn Meta Business Suite */}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Gửi thích"
                  title="Gửi biểu tượng thích"
                  className="h-8 w-8 p-0 text-[#0084ff] hover:bg-blue-50 active:scale-125 transition-transform shrink-0"
                  onClick={() => {
                    triggerHaptic("light");
                    onSend("👍");
                  }}
                >
                  <ThumbsUp className="h-4 w-4 fill-[#0084ff]" />
                </Button>

                {/* Nút Gửi */}
                <Button
                  size="sm"
                  aria-label="Gửi"
                  className={cn(
                    "px-3 text-[11px] rounded-xl shadow-xs transition-colors shrink-0",
                    draft.trim() || attachments.length
                      ? "bg-[#0084ff] hover:bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (!draft.trim() && !attachments.length) return;
                    triggerHaptic("light");
                    onSend();
                  }}
                  disabled={readingImage || (!draft.trim() && !attachments.length)}
                >
                  <Send className="!h-3.5 !w-3.5" />
                  <span className="hidden sm:inline">Gửi</span>
                </Button>
              </div>
            </div>
            <p className="mt-2.5 text-[9px] text-muted-foreground max-md:group-data-[keyboard-open]/chat:hidden max-md:[@media(max-height:420px)]:hidden">
              Enter để gửi · Shift + Enter xuống dòng · Bản nháp cần được duyệt
              trước khi gửi
            </p>
          </>
        )}
      </footer>
      <Dialog open={snippetsOpen} onOpenChange={setSnippetsOpen}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">
            Kho tin Golden Palace
          </DialogTitle>
          <DialogDescription className="mb-5 mt-1 text-xs text-muted-foreground">
            Chọn mẫu để điền vào ô soạn thảo và chỉnh sửa trước khi gửi.
          </DialogDescription>
          <div className="space-y-2">
            {knowledgeBase.map((faq) => (
              <button
                key={faq.category}
                className="w-full rounded-xl border p-4 text-left hover:border-blue-200 hover:bg-blue-50/50"
                onClick={() => {
                  onDraft(faq.answer);
                  setSnippetsOpen(false);
                  inputRef.current?.focus();
                }}
              >
                <p className="text-sm font-medium">{faq.question}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {faq.answer}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉ định nhân viên phụ trách */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-slate-200">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>Chỉ Định Phiên Chat Cho Nhân Viên</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Quản trị viên và Quản lý có thể chỉ định phiên chat với <strong>{conversation.name}</strong> cho chuyên viên tư vấn cụ thể:
          </DialogDescription>

          <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
            {users
              .filter((u) => u.active)
              .map((staff) => {
                const isCurrent =
                  conversation.assignedTo === staff.id ||
                  conversation.assignedStaffName === staff.name ||
                  (conversation.assignedTo === "me" && currentUser?.id === staff.id);
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("medium");
                      if (onAssign) onAssign(staff.id, staff.name);
                      setAssignOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center text-white shrink-0 ${
                          staff.role === "admin"
                            ? "bg-purple-600"
                            : staff.role === "manager"
                            ? "bg-blue-600"
                            : "bg-emerald-600"
                        }`}
                      >
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">
                            {staff.name}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                              staff.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : staff.role === "manager"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {staff.role === "admin"
                              ? "Admin"
                              : staff.role === "manager"
                              ? "Quản lý"
                              : "Nhân viên"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {staff.title || staff.department}
                        </p>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  if (onAssign) onAssign("team", "Đội tư vấn Golden Palace");
                  setAssignOpen(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 text-center"
              >
                👥 Đội tư vấn chung
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  if (onAssign) onAssign("unassigned", "");
                  setAssignOpen(false);
                }}
                className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-rose-50 text-xs font-medium text-rose-600 text-center"
              >
                Bỏ phân công
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox phóng to ảnh Media chuẩn Meta Business Suite */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-4 bg-slate-950/95 border-slate-800 text-white flex flex-col items-center">
            <DialogTitle className="sr-only">Xem ảnh chi tiết</DialogTitle>
            <DialogDescription className="sr-only">Ảnh đính kèm chất lượng cao trong hội thoại</DialogDescription>
            <div className="relative max-h-[75vh] overflow-hidden rounded-xl bg-black/40 flex items-center justify-center p-2">
              <img
                src={previewImage}
                alt="Ảnh phóng to"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>
            <div className="flex items-center justify-between w-full pt-3 px-1 border-t border-slate-800/80 mt-2">
              <a
                href={previewImage}
                download="omnichat-media.png"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Mở ảnh gốc / Tải về
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewImage(null)}
                className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
              >
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

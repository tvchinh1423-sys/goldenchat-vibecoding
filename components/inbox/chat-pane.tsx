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
} from "@/lib/inbox/helpers";
import { knowledgeBase } from "@/lib/inbox/demo-data";
import type { Attachment, Conversation } from "@/lib/inbox/types";
import { FormattedMessage } from "@/components/chat/formatted-message";
import { Avatar } from "./shared";
import { suggestedQuestions, visitIntent } from "@/lib/chat/follow-ups";
import { googleCalendarUrl } from "@/lib/crm/appointment";

interface Props {
  conversation: Conversation;
  draft: string;
  generatingDraft: boolean;
  attachments: Attachment[];
  onDraft: (text: string) => void;
  onAttachments: (attachments: Attachment[]) => void;
  onSend: () => void;
  onAsk: (question: string) => void;
  asking: boolean;
  onBook: (type: NonNullable<ReturnType<typeof visitIntent>>) => void;
  onGenerateDraft: () => void;
  onAiToggle: (enabled: boolean) => void;
  onResolve: () => void;
  onArchive: () => void;
  onReaction: (id: string) => void;
  onBack: () => void;
  onInfo: () => void;
  expanded: boolean;
  onExpand: () => void;
  notify: (message: string) => void;
  now: number;
}
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
  onAiToggle,
  onResolve,
  onArchive,
  onReaction,
  onBack,
  onInfo,
  expanded,
  onExpand,
  notify,
  now,
}: Props) {
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const element = streamRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [conversation.id, conversation.messages.length]);
  const wait = waitingLabel(conversation, now);
  const isArchived = conversation.status === "archived";
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
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      notify("Chỉ hỗ trợ ảnh PNG, JPG, WebP hoặc GIF.");
      return;
    }
    if (file.size > 700_000 || attachments.length >= 2) {
      notify("Mỗi tin tối đa 2 ảnh, mỗi ảnh không quá 700 KB.");
      return;
    }
    setReadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      onAttachments([
        ...attachments,
        { id: crypto.randomUUID(), name: file.name, dataUrl },
      ]);
    } catch {
      notify("Không đọc được ảnh. Vui lòng chọn lại.");
    } finally {
      setReadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  return (
    <section
      className="panel flex h-full flex-col"
      aria-label={`Hội thoại với ${conversation.name}`}
    >
      <header className="flex min-h-20 shrink-0 items-center justify-between gap-2 border-b px-3 py-3 sm:px-5">
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
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <label
            className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground"
            title="Cờ AI trong bản demo; gửi tự động qua Botcake chưa được kết nối"
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
          <span>Chỉ hiển thị trong bản demo</span>
        ) : (
          <span className="font-medium text-amber-700 bg-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-full flex items-center gap-1">
            ⚡ AI đã tạm ngắt · Chuyên viên tiếp quản
          </span>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-b px-4 py-2 text-[10px] text-muted-foreground sm:hidden">
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
        className="scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-[#fcfcff] p-4 sm:p-5"
        role="log"
        aria-label="Tin nhắn"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {conversation.messages.map((message, index) => {
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
          const questions =
            message.sender === "bot"
              ? (message.suggestedQuestions ??
                suggestedQuestions(previousQuestion ?? ""))
              : [];
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
                className={cn(
                  "group flex items-end gap-2",
                  !isCustomer && "flex-row-reverse",
                )}
              >
                {isCustomer ? (
                  <Avatar conversation={conversation} small />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[8px] font-semibold text-primary">
                    {message.sender === "bot" ? (
                      <Bot className="h-3.5 w-3.5" />
                    ) : (
                      "NK"
                    )}
                  </div>
                )}
                <div className="min-w-0 max-w-[85%] sm:max-w-[80%]">
                  <div
                    className={cn(
                      "relative rounded-2xl px-4 py-3 text-[13px] leading-[1.7]",
                      isCustomer
                        ? "rounded-bl-md bg-[#f0f1f7] text-foreground"
                        : "rounded-br-md bg-primary text-white",
                    )}
                  >
                    <FormattedMessage
                      text={message.content}
                      isUser={!isCustomer}
                    />
                    {message.bookingConfirmation && (
                      <a
                        href={googleCalendarUrl(message.bookingConfirmation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-primary"
                      >
                        <CalendarDays className="h-4 w-4" /> Thêm vào Google
                        Calendar
                      </a>
                    )}
                    {message.attachments?.map((attachment) => (
                      <a
                        href={attachment.dataUrl}
                        download={attachment.name}
                        key={attachment.id}
                        className="mt-2 block"
                      >
                        <img
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="max-h-48 rounded-lg object-contain"
                        />
                        <span className="text-[10px] underline">
                          {attachment.name}
                        </span>
                      </a>
                    ))}
                    <button
                      onClick={() => onReaction(message.id)}
                      aria-label={message.liked ? "Bỏ thả tim" : "Thả tim"}
                      aria-pressed={Boolean(message.liked)}
                      className={cn(
                        "absolute -bottom-3 right-2 rounded-full border bg-white p-1 text-rose-500 shadow-sm transition-opacity focus:opacity-100",
                        message.liked
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-3 w-3",
                          message.liked && "fill-rose-500",
                        )}
                      />
                    </button>
                  </div>
                  {!isArchived && (questions.length > 0 || visit) && (
                    <div
                      className="mt-2 flex flex-wrap justify-end gap-1.5"
                      aria-label="Gợi ý tiếp theo"
                    >
                      {visit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onBook(visit)}
                        >
                          <CalendarDays /> Đặt lịch{" "}
                          {visit === "thu_mon" ? "thử món" : "xem sảnh"}
                        </Button>
                      )}
                      {questions.map((question) => (
                        <button
                          key={question}
                          type="button"
                          disabled={asking}
                          onClick={() => onAsk(question)}
                          className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          {question}
                        </button>
                      ))}
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
      </div>
      <footer className="relative shrink-0 border-t bg-white p-3 sm:p-4">
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
            <Textarea
              ref={inputRef}
              aria-label="Nội dung tin nhắn"
              placeholder="Nhắn tin..."
              value={draft}
              onChange={(event) => onDraft(event.target.value)}
              onKeyDown={onComposerKeyDown}
              maxLength={6000}
              className="mb-3 min-h-[62px] border-0 p-1 text-base shadow-none focus-visible:ring-0 max-md:group-data-[keyboard-open]/chat:mb-1 max-md:group-data-[keyboard-open]/chat:min-h-10 md:text-[13px]"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Chèn cảm xúc"
                  aria-expanded={emojiOpen}
                  onClick={() => setEmojiOpen(!emojiOpen)}
                >
                  <Smile />
                </Button>
                {emojiOpen && (
                  <div className="absolute bottom-12 left-0 z-10 flex rounded-xl border bg-white p-2 shadow-lg">
                    {["😊", "❤️", "👍", "🙏", "✨"].map((emoji) => (
                      <button
                        aria-label={`Chèn ${emoji}`}
                        key={emoji}
                        onClick={() => {
                          onDraft(draft + emoji);
                          setEmojiOpen(false);
                          inputRef.current?.focus();
                        }}
                        className="rounded p-2 hover:bg-muted"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Đính kèm ảnh demo"
                title="Ảnh demo, tối đa 700 KB/ảnh"
                onClick={() => fileRef.current?.click()}
                disabled={readingImage}
              >
                {readingImage ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ImagePlus />
                )}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                aria-label="Chọn ảnh đính kèm"
                onChange={(event) => void attach(event.target.files?.[0])}
              />
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full border border-blue-200 px-2 text-[11px] sm:px-3"
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
                  className="rounded-full px-2 text-[11px] sm:px-3"
                  onClick={() => setSnippetsOpen(true)}
                >
                  / Kho tin
                </Button>
                <Button
                  size="sm"
                  aria-label="Gửi"
                  className="px-3 text-[11px]"
                  onClick={onSend}
                  disabled={
                    (!draft.trim() && !attachments.length) || readingImage
                  }
                >
                  <Send className="!h-3.5 !w-3.5" />
                  <span className="hidden sm:inline">Gửi</span>
                </Button>
              </div>
            </div>
            <p className="mt-2.5 text-[9px] text-muted-foreground max-md:group-data-[keyboard-open]/chat:hidden">
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
    </section>
  );
}

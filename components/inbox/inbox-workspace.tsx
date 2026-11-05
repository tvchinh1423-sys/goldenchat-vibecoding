"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Check, Inbox, MessageCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createDemoConversations } from "@/lib/inbox/demo-data";
import { filterConversations } from "@/lib/inbox/helpers";
import { parseSnapshot, STORAGE_KEY } from "@/lib/inbox/storage";
import type { Attachment, Conversation, InboxFilters } from "@/lib/inbox/types";
import { ConversationList } from "./conversation-list";
import { ChatPane } from "./chat-pane";
import { InfoPanel, type LeadFields } from "./info-panel";

const DEFAULT_FILTERS: InboxFilters = {
  query: "",
  tab: "all",
  channels: [],
  hasBooking: false,
  hasContact: false,
  showArchived: false,
};

export function InboxWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>(
    createDemoConversations,
  );
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState("trang");
  const [filters, setFilters] = useState<InboxFilters>(DEFAULT_FILTERS);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const draftRequest = useRef<AbortController | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>(
    {},
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(0);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notify = useCallback((text: string) => setToast(text), []);
  const filtered = filterConversations(conversations, filters);
  const active =
    filtered.find((conversation) => conversation.id === selectedId) ??
    filtered[0];
  const openCount = conversations.filter(
    (conversation) =>
      conversation.status === "active" || conversation.status === "pending",
  ).length;

  useEffect(() => {
    let initialConversations = createDemoConversations();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) initialConversations = parseSnapshot(saved);
    } catch {
      setToast("Không đọc được dữ liệu đã lưu. Đang dùng dữ liệu mẫu.");
    }
    setConversations(initialConversations);
    const requestedId = new URLSearchParams(window.location.search).get(
      "conversation",
    );
    const requested = initialConversations.find(
      (conversation) => conversation.id === requestedId,
    );
    if (requested) {
      setSelectedId(requested.id);
      setChatOpen(true);
      if (requested.status === "archived")
        setFilters({ ...DEFAULT_FILTERS, showArchived: true });
    }
    setNow(Date.now());
    setReady(true);
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, conversations }),
      );
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [conversations, ready]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setExpanded(false);
        setChatOpen(false);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeId = active?.id;
  useEffect(() => {
    draftRequest.current?.abort();
    draftRequest.current = null;
    setGeneratingId(null);
    return () => draftRequest.current?.abort();
  }, [activeId]);

  function cancelDraft() {
    draftRequest.current?.abort();
    draftRequest.current = null;
    setGeneratingId(null);
  }

  async function generateDraft() {
    if (!active || generatingId) return;
    const id = active.id;
    const controller = new AbortController();
    draftRequest.current = controller;
    setGeneratingId(id);
    try {
      const response = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: active.messages.map(({ sender, content }) => ({
            sender,
            content,
          })),
        }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || typeof result.reply !== "string")
        throw new Error(result.error || "Chưa tạo được bản nháp.");
      setDrafts((current) => ({ ...current, [id]: result.reply }));
      notify(
        result.mode === "demo"
          ? "Đã điền gợi ý FAQ mẫu (chưa cấu hình AI). Hãy duyệt trước khi gửi."
          : "AI đã soạn bản nháp. Hãy duyệt trước khi gửi.",
      );
    } catch (error) {
      if (!controller.signal.aborted)
        notify(
          error instanceof Error ? error.message : "Chưa tạo được bản nháp.",
        );
    } finally {
      if (draftRequest.current === controller) {
        draftRequest.current = null;
        setGeneratingId(null);
      }
    }
  }
  const activeUnread = active?.unread;
  useEffect(() => {
    if (
      !ready ||
      !activeId ||
      !activeUnread ||
      (!chatOpen && !window.matchMedia("(min-width: 768px)").matches)
    )
      return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeId
          ? { ...conversation, unread: 0 }
          : conversation,
      ),
    );
  }, [activeId, activeUnread, ready, chatOpen]);

  const updateConversation = (
    id: string,
    update: (conversation: Conversation) => Conversation,
  ) =>
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? update(conversation) : conversation,
      ),
    );
  const updateFilters = (patch: Partial<InboxFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setChatOpen(false);
  };
  function selectConversation(id: string) {
    setSelectedId(id);
    setChatOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("conversation", id);
    window.history.replaceState(null, "", url.toString());
  }
  function sendMessage() {
    if (!active || active.status === "archived") return;
    const content = (drafts[active.id] ?? "").trim();
    const files = attachments[active.id] ?? [];
    if (!content && !files.length) return;
    cancelDraft();
    updateConversation(active.id, (conversation) => ({
      ...conversation,
      aiEnabled: false,
      status: "active",
      unread: 0,
      messages: [
        ...conversation.messages,
        {
          id: crypto.randomUUID(),
          sender: "agent",
          content,
          createdAt: new Date().toISOString(),
          ...(files.length ? { attachments: files } : {}),
        },
      ],
    }));
    setDrafts((current) => ({ ...current, [active.id]: "" }));
    setAttachments((current) => ({ ...current, [active.id]: [] }));
    notify("Đã thêm tin nhắn demo. AI tự tắt khi tư vấn viên tiếp quản.");
  }
  function createLead(fields: LeadFields) {
    if (!active) return false;
    if (
      conversations.some(
        (conversation) => conversation.lead?.phone === fields.phone,
      )
    )
      return false;
    updateConversation(active.id, (conversation) => ({
      ...conversation,
      lead: {
        ...fields,
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        source: conversation.channel,
        status: "new",
        created_at: new Date().toISOString(),
      },
    }));
    notify("Đã lưu khách hàng vào dữ liệu demo trên trình duyệt.");
    return true;
  }
  function renderInfo() {
    if (!active) return null;
    return (
      <InfoPanel
        key={active.id}
        conversation={active}
        note={noteDrafts[active.id] ?? active.note}
        onNote={(text) =>
          setNoteDrafts((current) => ({ ...current, [active.id]: text }))
        }
        onSaveNote={() => {
          updateConversation(active.id, (conversation) => ({
            ...conversation,
            note: noteDrafts[active.id] ?? conversation.note,
          }));
          notify("Đã cập nhật ghi chú nội bộ trong phiên demo.");
        }}
        onCreateLead={createLead}
        onAssign={(assignedTo) => {
          updateConversation(active.id, (conversation) => ({
            ...conversation,
            assignedTo,
          }));
          notify("Đã cập nhật người phụ trách.");
        }}
        notify={notify}
      />
    );
  }

  return (
    <main className="flex h-dvh min-h-[360px] flex-col overflow-hidden">
      <header className="z-10 flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b bg-white px-4 py-3 sm:px-6 lg:px-7">
        <div className="flex items-center gap-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-primary text-white sm:flex">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Hộp thư
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-primary">
                {openCount} đang mở
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              OmniChat AI <span className="mx-1.5 text-slate-300">/</span> Không
              gian tư vấn Golden Palace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <Button
            variant="secondary"
            className="hidden border border-blue-100 text-xs md:inline-flex"
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setExpanded(false);
              setChatOpen(false);
            }}
          >
            <MessageCircle />
            Kênh chat
          </Button>
          <Button
            variant="outline"
            asChild
            className="h-9 w-9 p-0 text-xs md:w-auto md:px-3"
          >
            <Link
              href="/training"
              aria-label="Bot tư vấn khách"
              title="Bot tư vấn khách"
            >
              <Bot />
              <span className="hidden md:inline">Bot tư vấn khách</span>
            </Link>
          </Button>
          <div className="relative hidden w-44 xl:block 2xl:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Tìm nhanh hội thoại"
              placeholder="Tìm nhanh..."
              className="bg-[#f7f7fc] pl-9 pr-11 text-xs"
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
            />
            <kbd className="absolute right-2 top-2.5 rounded border bg-white px-1 text-[10px] text-muted-foreground">
              ⌘ K
            </kbd>
          </div>
          <span className="hidden h-7 w-px bg-border xl:block" />
          <div
            title="Ngọc Khánh · Tư vấn viên"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#eaf1ff] text-[11px] font-semibold text-primary"
          >
            NK
          </div>
        </div>
      </header>
      {storageError && (
        <div
          role="alert"
          className="shrink-0 bg-amber-50 px-5 py-2 text-xs leading-5 text-amber-900"
        >
          Không lưu được vào trình duyệt (bộ nhớ đầy hoặc bị chặn). Thay đổi
          hiện tại chỉ còn trong phiên này.
        </div>
      )}
      {!ready ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-5 w-5 animate-pulse" />
          Đang mở hộp thư...
        </div>
      ) : (
        <div
          className={cn(
            "grid min-h-0 flex-1 gap-4 p-3 sm:p-4 lg:p-5",
            expanded
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_280px] 2xl:grid-cols-[340px_minmax(0,1fr)_310px]",
          )}
        >
          <div
            className={cn(
              "min-h-0",
              chatOpen ? "hidden md:block" : "block",
              expanded && "!hidden",
            )}
          >
            <ConversationList
              conversations={conversations}
              filtered={filtered}
              selectedId={active?.id}
              filters={filters}
              onFilters={updateFilters}
              onSelect={selectConversation}
              searchRef={searchRef}
              now={now}
            />
          </div>
          <div
            className={cn(
              "min-h-0",
              chatOpen || expanded ? "block" : "hidden md:block",
            )}
          >
            {active ? (
              <ChatPane
                key={`${active.id}-${chatOpen}`}
                conversation={active}
                draft={drafts[active.id] ?? ""}
                generatingDraft={generatingId === active.id}
                attachments={attachments[active.id] ?? []}
                onDraft={(text) => {
                  cancelDraft();
                  setDrafts((current) => ({ ...current, [active.id]: text }));
                }}
                onAttachments={(files) =>
                  setAttachments((current) => ({
                    ...current,
                    [active.id]: files,
                  }))
                }
                onSend={sendMessage}
                onGenerateDraft={() => void generateDraft()}
                onAiToggle={(aiEnabled) => {
                  updateConversation(active.id, (conversation) => ({
                    ...conversation,
                    aiEnabled,
                  }));
                  notify(
                    `${aiEnabled ? "Đã bật" : "Đã tắt"} cờ AI cho hội thoại demo. Gửi tự động qua Botcake chưa được kết nối.`,
                  );
                }}
                onResolve={() => {
                  updateConversation(active.id, (conversation) => ({
                    ...conversation,
                    status:
                      conversation.status === "resolved"
                        ? "active"
                        : "resolved",
                    unread: 0,
                  }));
                  notify(
                    active.status === "resolved"
                      ? "Đã mở lại hội thoại."
                      : "Đã đánh dấu hội thoại hoàn tất.",
                  );
                }}
                onArchive={() => {
                  cancelDraft();
                  updateConversation(active.id, (conversation) => ({
                    ...conversation,
                    status:
                      conversation.status === "archived"
                        ? "active"
                        : "archived",
                  }));
                  setChatOpen(false);
                  setExpanded(false);
                  notify(
                    active.status === "archived"
                      ? "Đã khôi phục hội thoại."
                      : "Đã lưu trữ hội thoại. Xem lại bằng bộ lọc Lưu trữ.",
                  );
                }}
                onReaction={(id) =>
                  updateConversation(active.id, (conversation) => ({
                    ...conversation,
                    messages: conversation.messages.map((message) =>
                      message.id === id
                        ? { ...message, liked: !message.liked }
                        : message,
                    ),
                  }))
                }
                onBack={() => setChatOpen(false)}
                onInfo={() => setInfoOpen(true)}
                expanded={expanded}
                onExpand={() => setExpanded(!expanded)}
                notify={notify}
                now={now}
              />
            ) : (
              <div className="panel flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <Inbox className="h-12 w-12 text-slate-200" />
                <h2 className="text-sm font-semibold">
                  Không có hội thoại phù hợp
                </h2>
                <p className="text-xs text-muted-foreground">
                  Thay đổi bộ lọc để xem cuộc trò chuyện.
                </p>
              </div>
            )}
          </div>
          {!expanded && (
            <aside
              className="panel hidden xl:block"
              aria-label="Thông tin khách hàng"
            >
              {active ? (
                renderInfo()
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-xs text-muted-foreground">
                  Chọn hội thoại để xem thông tin
                </div>
              )}
            </aside>
          )}
        </div>
      )}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="inset-y-0 left-auto right-0 top-0 h-dvh max-h-dvh w-full max-w-sm translate-x-0 translate-y-0 rounded-none p-0">
          <DialogTitle className="sr-only">Thông tin khách hàng</DialogTitle>
          <DialogDescription className="sr-only">
            Thông tin liên hệ, ghi chú nội bộ và hồ sơ lead.
          </DialogDescription>
          {renderInfo()}
        </DialogContent>
      </Dialog>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
      >
        {toast && (
          <div className="pointer-events-auto flex items-start gap-2 rounded-xl border bg-white p-3 shadow-lg">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="flex-1 text-xs leading-5">{toast}</p>
            <button
              aria-label="Đóng thông báo"
              onClick={() => setToast("")}
              className="p-1 text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Bot, Check, Inbox, MessageCircle, Search, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  autoCleanupIfDemo,
  DEMO_CONVERSATION_IDS,
  DEMO_LEAD_IDS,
  DEMO_BOOKING_IDS,
} from "@/lib/clean-data";
import {
  ensureWidgetConversationInInbox,
  createDefaultWidgetConversation,
} from "@/lib/inbox/widget-sync";
import { createFaqDraft } from "@/lib/inbox/demo-data";
import { detectContact, filterConversations } from "@/lib/inbox/helpers";
import { parseSnapshot, STORAGE_KEY } from "@/lib/inbox/storage";
import { useVisualViewport } from "@/lib/chat/use-visual-viewport";
import type { Attachment, Conversation, InboxFilters } from "@/lib/inbox/types";
import { ConversationList } from "./conversation-list";
import { ChatPane } from "./chat-pane";
import { InfoPanel, type LeadFields } from "./info-panel";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { loadCRM, saveChatBooking, saveCRMLead } from "@/lib/crm/client";
import {
  BOOKING_TYPES,
  formatAppointment,
  type BookingInput,
} from "@/lib/crm/model";
import { BookingEditor } from "@/components/crm/booking-editor";
import { suggestedQuestions, type visitIntent } from "@/lib/chat/follow-ups";
import { playChatTone, playBookingSuccessCelebrationTone, unlockAudioContext } from "@/lib/chat/sound";
import { extractLeadInfo } from "@/lib/lead-extractor";
import { applyCRMToInbox } from "@/lib/crm/inbox-adapter";
import { CRM_STORAGE_KEY } from "@/lib/crm/demo-store";
import { useAuth } from "@/lib/auth/auth-context";
import { UserProfileMenu } from "@/components/auth/user-profile-menu";
import { UserManagementModal } from "@/components/users/user-management-modal";
import { LoginDialog } from "@/components/auth/login-dialog";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { InstallAppButton } from "@/components/pwa/install-button";
import { getPlatformShortcutLabel } from "@/lib/platform";

const DEFAULT_FILTERS: InboxFilters = {
  query: "",
  tab: "all",
  channels: [],
  hasBooking: false,
  hasContact: false,
  showArchived: false,
};

const READ_TRACKING_KEY = "omnichat_last_read_v1";

function getReadTrackingMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(READ_TRACKING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReadTracking(conversationId: string, lastMessageId?: string) {
  if (typeof window === "undefined" || !conversationId) return;
  try {
    const map = getReadTrackingMap();
    map[conversationId] = lastMessageId || "read";
    localStorage.setItem(READ_TRACKING_KEY, JSON.stringify(map));
  } catch {}
}

function applyReadTracking(convs: Conversation[]): Conversation[] {
  const map = getReadTrackingMap();
  return convs.map((c) => {
    const msgs = Array.isArray(c.messages) ? c.messages : [];
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

    // Nếu tin nhắn cuối đã được lưu là đã đọc, HOẶC tin nhắn cuối do nhân viên/bot gửi:
    const isAlreadyRead =
      Boolean(lastMsg && map[c.id] === lastMsg.id) ||
      Boolean(lastMsg && lastMsg.sender !== "customer");

    if (isAlreadyRead && c.unread !== 0) {
      return { ...c, unread: 0 };
    }
    return c;
  });
}

export function InboxWorkspace() {
  const { currentUser, role, users, canManageUsers } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const viewportRef = useVisualViewport<HTMLElement>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ready, setReady] = useState(false);
  const [askingId, setAskingId] = useState<string | null>(null);
  const pendingQuestion = useRef(false);
  const [chatVisit, setChatVisit] = useState<{
    conversation: Conversation;
    type: NonNullable<ReturnType<typeof visitIntent>>;
  } | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filters, setFilters] = useState<InboxFilters>(DEFAULT_FILTERS);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [botReplyingId, setBotReplyingId] = useState<string | null>(null);
  const draftRequest = useRef<AbortController | null>(null);
  const crmRevision = useRef(0);
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
  const [shortcutLabel, setShortcutLabel] = useState("⌘K");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShortcutLabel(getPlatformShortcutLabel());
  }, []);
  const notify = useCallback((text: string) => setToast(text), []);

  const effectiveFilters: InboxFilters = {
    ...filters,
    currentUserId: currentUser?.id,
    currentStaffName: currentUser?.name,
  };
  const filtered = filterConversations(conversations, effectiveFilters);
  const active =
    filtered.find((conversation) => conversation.id === selectedId) ??
    filtered[0];
  const openCount = conversations.filter(
    (conversation) =>
      conversation.status === "active" || conversation.status === "pending",
  ).length;

  useEffect(() => {
    let initialConversations: Conversation[] = [];
    if (typeof window !== "undefined") {
      autoCleanupIfDemo();
      ensureWidgetConversationInInbox();
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const list = parseSnapshot(saved);
          initialConversations = applyReadTracking(
            list.filter((c) => !DEMO_CONVERSATION_IDS.includes(c.id))
          );
        }
      } catch {
        initialConversations = [];
      }
    }
    setConversations(initialConversations);
    const requestedId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get(
      "conversation",
    ) : null;
    const requested = requestedId
      ? initialConversations.find(
          (conversation) => conversation.id === requestedId,
        )
      : undefined;
    if (requested) {
      setSelectedId(requested.id);
      setChatOpen(true);
      if (requested.status === "archived")
        setFilters({ ...DEFAULT_FILTERS, showArchived: true });
    } else if (initialConversations.length > 0) {
      setSelectedId(initialConversations[0].id);
    } else {
      setSelectedId("");
    }
    setNow(Date.now());
    setReady(true);
    const interval = setInterval(() => setNow(Date.now()), 60_000);

    const onCleared = () => {
      setConversations([]);
      setSelectedId("");
      setChatOpen(false);
    };
    const onRestored = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const list = parseSnapshot(saved);
          setConversations(list);
          if (list.length > 0) setSelectedId(list[0].id);
        }
      } catch {}
    };
    const onInboxUpdated = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const list = parseSnapshot(saved);
          setConversations(list);
        }
      } catch {}
    };
    window.addEventListener("omnichat-inbox-cleared", onCleared);
    window.addEventListener("omnichat-demo-restored", onRestored);
    window.addEventListener("omnichat-inbox-updated", onInboxUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("omnichat-inbox-cleared", onCleared);
      window.removeEventListener("omnichat-demo-restored", onRestored);
      window.removeEventListener("omnichat-inbox-updated", onInboxUpdated);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const currentStored = localStorage.getItem(STORAGE_KEY);
      const nextJson = JSON.stringify({ version: 1, conversations });
      if (currentStored !== nextJson) {
        localStorage.setItem(STORAGE_KEY, nextJson);
        window.dispatchEvent(new CustomEvent("omnichat-inbox-updated"));
        // Đẩy lên Cloud Sync để các thiết bị khác (iPhone, Máy tính) nhận ngay
        void fetch("/api/sync/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversations }),
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});
      }
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [conversations, ready]);

  // Polling Cloud Sync định kỳ mỗi 3 giây để đồng bộ dữ liệu thời gian thực giữa các thiết bị khác nhau
  const cloudRevisionRef = useRef(0);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;

  useEffect(() => {
    if (!ready) return;
    let active = true;

    const pullCloudSync = async () => {
      try {
        const res = await fetch(`/api/sync/store?since=${cloudRevisionRef.current}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(3500),
        });
        if (!active || !res.ok) return;
        const data = await res.json();
        if (data.modified && data.revision > cloudRevisionRef.current) {
          cloudRevisionRef.current = data.revision;
          if (Array.isArray(data.conversations)) {
            let cleanConvs = data.conversations.filter(
              (c: any) => !DEMO_CONVERSATION_IDS.includes(c.id)
            );
            // Bảo toàn hội thoại và lịch hẹn Web Widget nếu danh sách chưa có kênh Web
            const hasWeb = cleanConvs.some((c: any) => c.channel === "web");
            if (!hasWeb) {
              const defaultWeb = createDefaultWidgetConversation();
              cleanConvs = [defaultWeb, ...cleanConvs];
            }

            // Áp dụng read tracking bảo vệ trạng thái đã đọc triệt để
            cleanConvs = applyReadTracking(cleanConvs);

            // Nếu người dùng đang mở xem cuộc trò chuyện nào thì cuộc trò chuyện đó chắc chắn unread = 0
            const currentSelected = selectedIdRef.current;
            const currentChatOpen = chatOpenRef.current;
            if (currentSelected && (currentChatOpen || (typeof window !== "undefined" && window.innerWidth >= 768))) {
              cleanConvs = cleanConvs.map((c: any) =>
                c.id === currentSelected ? { ...c, unread: 0 } : c,
              );
            }

            setConversations(cleanConvs);
            setSelectedId((prev) => {
              if (!prev && cleanConvs.length > 0) return cleanConvs[0].id;
              if (prev && !cleanConvs.some((c: any) => c.id === prev)) return cleanConvs[0]?.id || "";
              return prev;
            });
          }
          if (data.crm) {
            try {
              const cleanLeads = (data.crm.leads || []).filter(
                (l: any) => !DEMO_LEAD_IDS.includes(l.id)
              );
              const cleanBookings = (data.crm.bookings || []).filter(
                (b: any) => !DEMO_BOOKING_IDS.includes(b.id)
              );
              const defaultWeb = createDefaultWidgetConversation();
              if (defaultWeb.lead && !cleanLeads.some((l: any) => l.inbox_reference === "web-duong" || l.phone === defaultWeb.lead?.phone)) {
                cleanLeads.unshift({
                  id: defaultWeb.lead.id,
                  inbox_reference: defaultWeb.id,
                  full_name: defaultWeb.lead.full_name,
                  phone: defaultWeb.lead.phone,
                  email: defaultWeb.lead.email,
                  notes: defaultWeb.lead.demand_notes,
                  source: "web" as const,
                  stage: "N3" as const,
                  assigned_to: "Ngọc Khánh",
                  event_date: "12/2026",
                  table_count: 35,
                  last_touched_at: "2026-11-07T08:18:45.000Z",
                  created_at: "2026-11-07T08:18:45.000Z",
                });
              }
              if (defaultWeb.booking && !cleanBookings.some((b: any) => b.lead_id === "lead-web-duong")) {
                cleanBookings.unshift({
                  id: "booking-web-duong",
                  lead_id: "lead-web-duong",
                  appointment_time: "2026-11-12T02:30:00.000Z",
                  event_type: "xem_sanh" as const,
                  guests_count: 4,
                  assigned_staff: "Ngọc Khánh",
                  notes: "Khách đặt lịch từ Web Widget ghé xem sảnh & thử món tiệc cưới 35 bàn.",
                  status: "pending" as const,
                  created_at: "2026-11-07T08:18:45.000Z",
                });
              }
              localStorage.setItem(
                CRM_STORAGE_KEY,
                JSON.stringify({ version: 1, leads: cleanLeads, bookings: cleanBookings }),
              );
              window.dispatchEvent(new Event("omnichat-crm-change"));
            } catch {}
          }
        }
      } catch {}
    };

    void pullCloudSync();
    const interval = setInterval(pullCloudSync, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    const refreshCRM = async () => {
      const revision = ++crmRevision.current;
      try {
        const crm = await loadCRM();
        if (mounted && revision === crmRevision.current)
          setConversations((current) => applyCRMToInbox(current, crm));
      } catch {
        /* Inbox remains usable; CRM errors are shown when opening/saving CRM. */
      }
    };

    const reloadInboxFromStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const list = applyReadTracking(parseSnapshot(saved));
          if (mounted) {
            setConversations(list);
            // Nếu có tin nhắn mới từ web, đảm bảo người dùng nhìn thấy
            setSelectedId((prev) => {
              if (prev && list.some((c) => c.id === prev)) return prev;
              return list[0]?.id || "";
            });
          }
        }
      } catch {}
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEY ||
        event.key === "omnichat.widget.session.v1" ||
        event.key === null
      ) {
        reloadInboxFromStorage();
      }
      if (event.key === CRM_STORAGE_KEY || event.key === null) {
        void refreshCRM();
      }
    };

    // Lắng nghe BroadcastChannel để nhận tin nhắn tức thì từ tab Widget
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("omnichat_sync");
      bc.onmessage = (e) => {
        if (e.data?.type === "WIDGET_CHAT_UPDATE") {
          reloadInboxFromStorage();
        }
      };
    } catch {}

    void refreshCRM();
    window.addEventListener("storage", onStorage);
    window.addEventListener("omnichat-inbox-updated", reloadInboxFromStorage);
    return () => {
      mounted = false;
      bc?.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("omnichat-inbox-updated", reloadInboxFromStorage);
    };
  }, [ready]);

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
      if (!controller.signal.aborted) {
        const hadExistingText = Boolean((drafts[id] || "").trim());
        setDrafts((current) => {
          const currentText = (current[id] || "").trim();
          // Bảo vệ dữ liệu: Tuyệt đối không ghi đè nếu nhân viên đã tự soạn nội dung trước đó
          if (currentText.length > 0) return current;
          try {
            const fallbackDraft = createFaqDraft(active.messages);
            return { ...current, [id]: fallbackDraft };
          } catch {
            return current;
          }
        });

        if (hadExistingText) {
          notify(
            error instanceof Error
              ? `Không thể tạo nháp AI (${error.message}). Đã giữ nguyên nội dung bạn tự soạn.`
              : "Không thể tạo nháp AI. Đã giữ nguyên nội dung bạn tự soạn.",
          );
        } else {
          notify("Đã điền gợi ý FAQ chuẩn Golden Palace. Hãy duyệt trước khi gửi.");
        }
      }
    } finally {
      if (draftRequest.current === controller) {
        draftRequest.current = null;
        setGeneratingId(null);
      }
    }
  }
  const markConversationAsRead = useCallback((id: string) => {
    if (!id) return;
    setConversations((current) => {
      const target = current.find((c) => c.id === id);
      const msgs = target?.messages || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      saveReadTracking(id, lastMsg?.id);

      if (!target || target.unread === 0) return current;

      const updated = current.map((c) =>
        c.id === id ? { ...c, unread: 0 } : c,
      );

      try {
        const nextJson = JSON.stringify({ version: 1, conversations: updated });
        localStorage.setItem(STORAGE_KEY, nextJson);
        window.dispatchEvent(new CustomEvent("omnichat-inbox-updated"));
        void fetch("/api/sync/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversations: updated }),
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});
      } catch {}

      return updated;
    });
  }, []);

  const activeUnread = active?.unread;
  useEffect(() => {
    if (
      !ready ||
      !activeId ||
      (!chatOpen && !window.matchMedia("(min-width: 768px)").matches)
    )
      return;
    markConversationAsRead(activeId);
  }, [activeId, activeUnread, ready, chatOpen, markConversationAsRead]);

  const updateConversation = (
    id: string,
    update: (conversation: Conversation) => Conversation,
  ) =>
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? update(conversation) : conversation,
      ),
    );

  const handleAssign = useCallback(
    (conversationId: string, assignedTo: string, staffName?: string) => {
      const staff = users.find(
        (u) =>
          u.id === assignedTo ||
          u.username.toLowerCase() === assignedTo.toLowerCase() ||
          u.name === staffName,
      );
      const targetName =
        staff?.name ||
        staffName ||
        (assignedTo === "me"
          ? currentUser?.name || "Bạn"
          : assignedTo === "team"
          ? "Đội tư vấn Golden Palace"
          : "Chưa phân công");

      updateConversation(conversationId, (conversation) => {
        const roleTitle =
          role === "admin"
            ? "Admin"
            : role === "manager"
            ? "Quản lý"
            : "Nhân viên";

        const systemNotice = {
          id: `sys_assign_${Date.now()}`,
          sender: "bot" as const,
          content:
            assignedTo === "unassigned"
              ? `🔔 ${currentUser?.name || "Hệ thống"} (${roleTitle}) đã bỏ phân công phiên chat này.`
              : `🔔 ${currentUser?.name || "Hệ thống"} (${roleTitle}) đã chỉ định phiên chat này cho: ${targetName}.`,
          createdAt: new Date().toISOString(),
        };

        return {
          ...conversation,
          assignedTo,
          assignedStaffName: targetName,
          assignedAt: new Date().toISOString(),
          assignedBy: currentUser?.name || "Admin",
          messages: [...conversation.messages, systemNotice],
        };
      });

      notify(
        assignedTo === "unassigned"
          ? "Đã bỏ phân công phiên chat."
          : `Đã chỉ định phiên chat cho ${targetName}.`,
      );
    },
    [users, currentUser, role, notify],
  );
  const updateFilters = (patch: Partial<InboxFilters>) => {
    if (active?.id) {
      markConversationAsRead(active.id);
    }
    setFilters((current) => ({ ...current, ...patch }));
    setChatOpen(false);
  };
  function selectConversation(id: string) {
    setSelectedId(id);
    setChatOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("conversation", id);
    window.history.replaceState(null, "", url.toString());
    markConversationAsRead(id);
  }
  async function sendMessage(customContent?: string) {
    if (!active || active.status === "archived") return;
    const content = (typeof customContent === "string" ? customContent : (drafts[active.id] ?? "")).trim();
    const files = typeof customContent === "string" ? [] : (attachments[active.id] ?? []);
    if (!content && !files.length) return;
    playChatTone();
    cancelDraft();

    const isFacebook = active.channel === "facebook" || active.id.startsWith("facebook-");
    const newMsgId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    updateConversation(active.id, (conversation) => ({
      ...conversation,
      aiEnabled: false,
      status: "active",
      unread: 0,
      messages: [
        ...conversation.messages,
        {
          id: newMsgId,
          sender: "agent",
          content,
          createdAt: nowIso,
          ...(files.length ? { attachments: files } : {}),
        },
      ],
    }));

    if (typeof customContent !== "string") {
      setDrafts((current) => ({ ...current, [active.id]: "" }));
      setAttachments((current) => ({ ...current, [active.id]: [] }));
    }

    if (isFacebook) {
      const rawRecipientId = active.id.replace(/^facebook-/, "");
      const isNumeric = /^\d+$/.test(rawRecipientId);
      // Nếu là hội thoại khách thật, gửi tới PSID đó. Nếu là hội thoại demo/mẫu, tự động chuyển phát tới Messenger của Chinh (40488746077383338) để kiểm tra thực tế
      const targetPsid = isNumeric ? rawRecipientId : "40488746077383338";

      try {
        notify(
          isNumeric
            ? `Đang chuyển tin nhắn tới Facebook Messenger của ${active.name}...`
            : "Đang gửi tin nhắn thử nghiệm tới Messenger của Chinh (PSID: 40488746077383338)..."
        );
        const res = await fetch("/api/facebook/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: targetPsid,
            message: content,
            conversationId: active.id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Lỗi gửi tin Facebook");
        }
        notify(
          isNumeric
            ? `✅ Đã gửi trực tiếp tới Facebook Messenger của ${active.name}!`
            : "✅ Đã chuyển phát thử nghiệm tới Facebook Messenger của Chinh!"
        );
      } catch (err: any) {
        console.error("Lỗi gửi tin Facebook:", err);
        notify("⚠️ Gửi tin qua Facebook chưa thành công: " + (err.message || "Kiểm tra kết nối"));
      }
    } else if (active.channel === "web" || active.id.startsWith("web-")) {
      try {
        const staffName = currentUser?.name || "Ngọc Khánh";
        const widgetRaw = localStorage.getItem("omnichat.widget.session.v1");
        if (widgetRaw) {
          const parsed = JSON.parse(widgetRaw);
          const msgs = Array.isArray(parsed?.messages) ? parsed.messages : [];
          msgs.push({
            id: newMsgId,
            sender: "bot",
            text: `👤 [Tư vấn viên ${staffName}]:\n${content}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          localStorage.setItem(
            "omnichat.widget.session.v1",
            JSON.stringify({ ...parsed, messages: msgs, lastUpdated: nowIso })
          );
        }

        // Bắn qua BroadcastChannel để tab Web Widget nhận ngay lập tức 0ms
        try {
          const bc = new BroadcastChannel("omnichat_sync");
          bc.postMessage({
            type: "AGENT_MESSAGE",
            id: newMsgId,
            content,
            staffName,
          });
          setTimeout(() => bc.close(), 1000);
        } catch {}

        window.dispatchEvent(
          new CustomEvent("omnichat-widget-message", {
            detail: { id: newMsgId, content, staffName },
          })
        );
        notify("✅ Đã gửi tin nhắn tới Web Chat Widget của khách!");
      } catch {
        notify("Đã thêm tin nhắn tư vấn viên.");
      }
    } else {
      notify("Đã thêm tin nhắn tư vấn viên. AI tự tắt khi tư vấn viên tiếp quản.");
    }
  }

  async function triggerBotReply(
    conversationId: string,
    customQuestion?: string,
  ) {
    const target =
      conversations.find((c) => c.id === conversationId) ?? active;
    if (!target || target.status === "archived" || botReplyingId) return;

    const customerMsg = customQuestion
      ? { content: customQuestion }
      : [...target.messages]
          .reverse()
          .find((m) => m.sender === "customer");

    if (!customerMsg?.content) return;

    setBotReplyingId(conversationId);
    cancelDraft();

    try {
      const response = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: customerMsg.content,
          channel: target.channel,
          messageCount: target.messages.length,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.reply !== "string") {
        throw new Error("Không nhận được phản hồi từ bot.");
      }

      const preferred = Array.isArray(data.suggestedQuestions)
        ? data.suggestedQuestions.filter(
            (item: unknown): item is string => typeof item === "string",
          )
        : [];
      const isAiTurnedOff = data.aiEnabled === false || data.handoff === true;

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        aiEnabled: isAiTurnedOff ? false : conversation.aiEnabled,
        messages: [
          ...conversation.messages,
          {
            id: crypto.randomUUID(),
            sender: "bot",
            content: data.reply,
            suggestedQuestions: suggestedQuestions(
              customerMsg.content,
              true,
              preferred,
            ),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      playChatTone();

      // Nếu là hội thoại Facebook, đồng bộ câu trả lời của Bot ra Messenger của khách
      if (active.channel === "facebook" || active.id.startsWith("facebook-")) {
        const recipientId = active.id.replace(/^facebook-/, "");
        void fetch("/api/facebook/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId,
            message: data.reply,
            conversationId: active.id,
          }),
        }).catch((err) => console.warn("Lỗi gửi bot reply FB:", err));
      }

      if (isAiTurnedOff) {
        notify(
          "⚡ Câu hỏi ngoài phạm vi tri thức: Bot đã tự động ngắt AI để tư vấn viên tiếp quản (tránh trả lời lung tung).",
        );
      } else {
        notify("🤖 Bot đã tự động phản hồi khách hàng.");
      }
    } catch {
      notify(
        "Chưa nhận được phản hồi của bot. Bạn có thể dùng nút Soạn nháp AI để duyệt trước khi gửi.",
      );
    } finally {
      setBotReplyingId(null);
    }
  }

  async function askFollowUp(question: string) {
    if (!active || active.status === "archived" || pendingQuestion.current)
      return;
    const conversationId = active.id;
    pendingQuestion.current = true;
    setAskingId(conversationId);
    cancelDraft();
    playChatTone();
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: [
        ...conversation.messages,
        {
          id: crypto.randomUUID(),
          sender: "customer",
          content: question,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    try {
      const response = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          channel: active.channel,
          messageCount: active.messages.length,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.reply !== "string")
        throw new Error("Không nhận được phản hồi.");
      const preferred = Array.isArray(data.suggestedQuestions)
        ? data.suggestedQuestions.filter(
            (item: unknown): item is string => typeof item === "string",
          )
        : [];
      const isAiTurnedOff = data.aiEnabled === false || data.handoff === true;

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        aiEnabled: isAiTurnedOff ? false : conversation.aiEnabled,
        messages: [
          ...conversation.messages,
          {
            id: crypto.randomUUID(),
            sender: "bot",
            content: data.reply,
            suggestedQuestions: suggestedQuestions(question, true, preferred),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      playChatTone();

      // Nếu là hội thoại Facebook, đồng bộ câu trả lời của Bot ra Messenger của khách
      if (active.channel === "facebook" || active.id.startsWith("facebook-")) {
        const recipientId = active.id.replace(/^facebook-/, "");
        void fetch("/api/facebook/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId,
            message: data.reply,
            conversationId: active.id,
          }),
        }).catch((err) => console.warn("Lỗi gửi bot reply FB:", err));
      }

      if (isAiTurnedOff) {
        notify("⚡ Câu hỏi ngoài phạm vi tri thức: Bot đã tự động ngắt AI để tư vấn viên tiếp quản (tránh trả lời lung tung).");
      }
    } catch {
      notify("Chưa nhận được phản hồi của bot. Hãy bấm lại câu hỏi gợi ý.");
    } finally {
      pendingQuestion.current = false;
      setAskingId(null);
    }
  }

  async function bookInChat(
    input: BookingInput,
    contact?: { name: string; phone: string },
  ) {
    if (!chatVisit) return;
    unlockAudioContext();
    const conversation = chatVisit.conversation;
    const saved = await saveChatBooking(
      {
        full_name:
          contact?.name ?? conversation.lead?.full_name ?? conversation.name,
        phone: contact?.phone ?? conversation.lead?.phone ?? "",
        email: conversation.lead?.email ?? "",
        notes: conversation.lead?.demand_notes ?? "Đặt lịch trong Inbox",
        inbox_reference: conversation.id,
        source: conversation.channel,
        stage: "N1",
        assigned_to: input.assigned_staff,
        event_date: "",
        table_count: null,
      },
      input,
    );
    ++crmRevision.current;
    setConversations((current) => applyCRMToInbox(current, saved));
    updateConversation(conversation.id, (item) => ({
      ...item,
      messages: [
        ...item.messages,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          content: `✅ **XÁC NHẬN ĐÃ NHẬN LỊCH HẸN**\n\n${BOOKING_TYPES[input.event_type]} · ${formatAppointment(input.appointment_time)}\nLịch hẹn đã được hệ thống xác nhận và lưu vào CRM.`,
          bookingConfirmation: {
            appointment_time: input.appointment_time,
            event_type: input.event_type,
          },
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    void playBookingSuccessCelebrationTone(true);
  }
  async function createLead(fields: LeadFields) {
    if (!active) return false;
    ++crmRevision.current;
    if (
      conversations.some(
        (conversation) => conversation.lead?.phone === fields.phone,
      )
    )
      return false;
    const conversationId = active.id;
    const extracted = extractLeadInfo(
      active.messages
        .filter((m) => m.sender === "customer")
        .map((m) => m.content)
        .join("\n"),
    );
    const currentCRM = await loadCRM();
    const existing = currentCRM.leads.find(
      (l) => l.inbox_reference === conversationId,
    );
    if (existing?.phone && existing.phone !== fields.phone)
      throw new Error(
        "Hội thoại đã có hồ sơ CRM. Hãy mở CRM để cập nhật thông tin.",
      );
    const result = await saveCRMLead(
      {
        full_name: fields.full_name,
        phone: fields.phone,
        email: fields.email,
        notes: fields.demand_notes,
        inbox_reference: conversationId,
        source: active.channel,
        stage: existing?.stage ?? "N1",
        assigned_to:
          existing?.assigned_to ??
          (active.assignedTo === "me" ? "Ngọc Khánh" : ""),
        event_date: extracted.eventDate ?? existing?.event_date ?? "",
        table_count: extracted.tableCount ?? existing?.table_count ?? null,
      },
      existing?.phone ? existing.id : undefined,
    );
    const saved = result.leads.find(
      (l) => l.inbox_reference === conversationId,
    );
    if (!saved)
      throw new Error("Chưa xác nhận được hồ sơ đã lưu. Hãy tải lại CRM.");
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      lead: {
        ...fields,
        id: saved.id,
        conversation_id: conversation.id,
        source: conversation.channel,
        status: "new",
        created_at: new Date().toISOString(),
      },
    }));
    notify(
      "✅ Đã lưu khách hàng vào hệ thống CRM. Mở CRM để quản lý lịch hẹn & phễu tư vấn."
    );
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
          notify("Đã cập nhật ghi chú nội bộ.");
        }}
        onCreateLead={createLead}
        onAssign={(assignedTo, staffName) => {
          handleAssign(active.id, assignedTo, staffName);
        }}
        notify={notify}
      />
    );
  }

  return (
    <main
      ref={viewportRef}
      data-chat-open={chatOpen ? "" : undefined}
      className="app-safe-x group/chat flex h-dvh flex-col overflow-hidden pt-[var(--safe-top)] max-md:fixed max-md:inset-x-0 max-md:top-[var(--chat-top,0px)] max-md:h-[var(--chat-height,100dvh)] max-md:pb-[var(--mobile-nav-height)] max-md:data-[keyboard-open]:pb-0 max-md:[@media(max-height:420px)]:data-[chat-open]:pb-0"
    >
      <header className="z-10 flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b bg-white px-4 py-3 max-md:group-data-[keyboard-open]/chat:hidden max-md:[@media(max-height:420px)]:group-data-[chat-open]/chat:hidden sm:px-6 lg:px-7">
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
              if (active?.id) {
                markConversationAsRead(active.id);
              }
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
          <Button
            variant="outline"
            asChild
            className="h-9 px-2.5 text-xs text-blue-700 bg-blue-50/80 hover:bg-blue-100 border-blue-200"
          >
            <Link
              href="/widget"
              aria-label="Khung Chat Khách"
              title="Mở giao diện Chat Khách Hàng (Web Widget)"
            >
              <Globe className="h-4 w-4 text-blue-600 sm:mr-1.5" />
              <span className="hidden sm:inline">Khung Chat Khách</span>
            </Link>
          </Button>
          {/* Nút Mời Cài Đặt App - Chỉ hiện với các thiết bị chưa tải về máy */}
          <InstallAppButton />
          <Button
            variant="outline"
            asChild
            className="hidden h-9 text-xs md:inline-flex"
          >
            <Link href="/dashboard">
              <BarChart3 />
              Báo cáo
            </Link>
          </Button>
          <div className="relative hidden w-44 xl:block 2xl:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Tìm nhanh hội thoại"
              placeholder={`Tìm nhanh... (${shortcutLabel})`}
              className="bg-[#f7f7fc] pl-9 pr-11 text-xs"
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
            />
            <kbd className="absolute right-2 top-2.5 rounded border bg-white px-1 text-[10px] text-muted-foreground">
              {shortcutLabel}
            </kbd>
          </div>
          <span className="hidden h-7 w-px bg-border xl:block" />
          <NotificationBell />
          <UserProfileMenu
            onOpenUserManagement={() => setShowUserModal(true)}
            onOpenLoginModal={() => setShowLoginModal(true)}
          />
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
            "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-4 p-3 sm:p-4 lg:p-5",
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
              onRefresh={async () => {
                try {
                  const crm = await loadCRM();
                  setConversations((current) => applyCRMToInbox(current, crm));
                  notify("Đã đồng bộ dữ liệu mới nhất.");
                } catch {
                  notify("Đã làm mới danh sách hội thoại.");
                }
              }}
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
                asking={askingId !== null}
                onAsk={(question) => void askFollowUp(question)}
                onBook={(type) => setChatVisit({ conversation: active, type })}
                onGenerateDraft={() => void generateDraft()}
                botReplying={botReplyingId === active.id}
                onTriggerBotReply={() => void triggerBotReply(active.id)}
                onAiToggle={(aiEnabled) => {
                  updateConversation(active.id, (conversation) => ({
                    ...conversation,
                    aiEnabled,
                  }));
                  if (aiEnabled) {
                    const lastMsg =
                      active.messages[active.messages.length - 1];
                    if (lastMsg && lastMsg.sender === "customer") {
                      notify(
                        "🤖 Đã bật AI · Bot đang tiếp quản và tự động trả lời khách...",
                      );
                      setTimeout(() => {
                        void triggerBotReply(active.id);
                      }, 700);
                    } else {
                      notify(
                        "🤖 Đã bật chế độ AI tự động. Bot sẽ trả lời khi khách gửi tin nhắn tiếp theo.",
                      );
                    }
                  } else {
                    notify("Đã tắt chế độ AI. Tư vấn viên tiếp quản hội thoại.");
                  }
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
                onReaction={(id, reactionType = "love") =>
                  updateConversation(active.id, (conversation) => ({
                    ...conversation,
                    messages: conversation.messages.map((message) => {
                      if (message.id !== id) return message;
                      const isSame = message.reaction === reactionType || (reactionType === "love" && message.liked && !message.reaction);
                      return {
                        ...message,
                        liked: !isSame,
                        reaction: isSame ? undefined : reactionType,
                      };
                    }),
                  }))
                }
                onPinMessage={(id) => {
                  updateConversation(active.id, (conversation) => {
                    const isAlreadyPinned = conversation.pinnedMessageId === id;
                    const targetMsg = conversation.messages.find((m) => m.id === id);
                    const newPinnedId = isAlreadyPinned ? undefined : id;
                    notify(
                      isAlreadyPinned
                        ? "Đã bỏ ghim tin nhắn."
                        : `📌 Đã ghim tin nhắn: "${targetMsg?.content.slice(0, 35) || ""}..."`
                    );
                    return {
                      ...conversation,
                      pinnedMessageId: newPinnedId,
                      messages: conversation.messages.map((m) => ({
                        ...m,
                        pinned: m.id === newPinnedId,
                      })),
                    };
                  });
                }}
                onBack={() => {
                  if (active?.id) {
                    markConversationAsRead(active.id);
                  }
                  setChatOpen(false);
                }}
                onInfo={() => setInfoOpen(true)}
                expanded={expanded}
                onExpand={() => setExpanded(!expanded)}
                notify={notify}
                now={now}
                onAssign={(assignedTo, staffName) =>
                  handleAssign(active.id, assignedTo, staffName)
                }
              />
            ) : (
              <div className="panel flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
                  <Inbox className="h-7 w-7" />
                </div>
                <h2 className="text-base font-semibold text-slate-800">
                  {conversations.length === 0
                    ? "Hộp thư trực tuyến sẵn sàng"
                    : "Không có hội thoại phù hợp"}
                </h2>
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {conversations.length === 0
                    ? "Hệ thống đang lắng nghe tin nhắn từ Facebook Messenger, Zalo và Web Widget. Tin nhắn mới sẽ tự động hiển thị tại đây khi khách liên hệ."
                    : "Thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các cuộc trò chuyện."}
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
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
                  <Inbox className="h-8 w-8 text-slate-200 mb-2" />
                  Chưa có hội thoại nào được chọn
                </div>
              )}
            </aside>
          )}
        </div>
      )}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="left-auto right-0 top-[var(--chat-top,0px)] h-[var(--chat-height,100dvh)] max-h-none w-full max-w-sm translate-x-0 translate-y-0 rounded-none !pt-[var(--safe-top)] !pb-[var(--safe-bottom)] !pl-[var(--safe-left)] !pr-[var(--safe-right)] [--dialog-top-inset:var(--safe-top)]">
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

      {/* Mobile Bottom Navigation Bar (Chuẩn Zalo) */}
      <MobileBottomNav className="absolute group-data-[keyboard-open]/chat:hidden [@media(max-height:420px)]:group-data-[chat-open]/chat:hidden" />
      {chatVisit && (
        <BookingEditor
          lead={{
            id: chatVisit.conversation.lead?.id ?? chatVisit.conversation.id,
            full_name:
              chatVisit.conversation.lead?.full_name ||
              detectContact(chatVisit.conversation.messages).fullName ||
              chatVisit.conversation.name,
            assigned_to: "Ngọc Khánh",
          }}
          initialType={chatVisit.type}
          collectContact={
            chatVisit.conversation.lead
              ? undefined
              : (detectContact(chatVisit.conversation.messages).phones[0] ?? "")
          }
          onSave={(input, _id, contact) => bookInChat(input, contact)}
          onClose={() => setChatVisit(null)}
        />
      )}

      {/* User Management Modal */}
      <UserManagementModal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
      />

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
}

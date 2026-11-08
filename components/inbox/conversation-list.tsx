"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Archive,
  CalendarDays,
  Check,
  ChevronDown,
  ContactRound,
  Search,
  SearchX,
  X,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CHANNEL_LABELS,
  CURRENT_STAFF,
  formatTime,
  waitingLabel,
} from "@/lib/inbox/helpers";
import type {
  Channel,
  Conversation,
  InboxFilters,
  InboxTab,
} from "@/lib/inbox/types";
import { Avatar, ChannelIcon } from "./shared";
import { triggerHaptic } from "@/lib/mobile/haptics";
import { usePullToRefresh } from "@/lib/hooks/use-touch-gestures";
import { useAuth } from "@/lib/auth/auth-context";

interface Props {
  conversations: Conversation[];
  filtered: Conversation[];
  selectedId?: string;
  filters: InboxFilters;
  onFilters: (value: Partial<InboxFilters>) => void;
  onSelect: (id: string) => void;
  searchRef: RefObject<HTMLInputElement>;
  now: number;
  onRefresh?: () => Promise<void> | void;
}
export function ConversationList({
  conversations,
  filtered,
  selectedId,
  filters,
  onFilters,
  onSelect,
  searchRef,
  now,
  onRefresh,
}: Props) {
  const { currentUser } = useAuth();
  const [channelsOpen, setChannelsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mobile pull-to-refresh
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh<HTMLDivElement>(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  });
  useEffect(() => {
    if (!channelsOpen) return;
    const close = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node))
        setChannelsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [channelsOpen]);
  const visible = conversations.filter((c) =>
    filters.showArchived ? c.status === "archived" : c.status !== "archived",
  );
  const tabs: { id: InboxTab; label: string; count: number }[] = [
    { id: "all", label: "Tất cả", count: visible.length },
    {
      id: "pending",
      label: "Cần xử lý",
      count: visible.filter((c) => c.status === "pending").length,
    },
    {
      id: "mine",
      label: "Của tôi",
      count: visible.filter((c) => {
        if (c.assignedTo === "me") return true;
        if (
          currentUser &&
          (c.assignedTo === currentUser.id ||
            c.assignedTo.toLowerCase() === currentUser.username.toLowerCase())
        )
          return true;
        if (currentUser && c.assignedStaffName === currentUser.name) return true;
        return false;
      }).length,
    },
  ];
  const reset = () =>
    onFilters({
      query: "",
      tab: "all",
      channels: [],
      hasBooking: false,
      hasContact: false,
      showArchived: false,
    });
  return (
    <section
      className="panel flex h-full flex-col"
      aria-label="Danh sách hội thoại"
    >
      <div className="space-y-4 border-b p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            aria-label="Tìm hội thoại"
            placeholder="Tên, SĐT, nội dung..."
            value={filters.query}
            onChange={(event) => onFilters({ query: event.target.value })}
            className="bg-[#fafaff] pl-9 pr-10"
          />
          {filters.query ? (
            <button
              title="Xóa tìm kiếm"
              aria-label="Xóa tìm kiếm"
              onClick={() => onFilters({ query: "" })}
              className="absolute right-3 top-3 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="absolute right-3 top-3 text-[10px] text-muted-foreground">
              ⌘ K
            </span>
          )}
        </div>
        <div
          className="flex gap-1"
          role="group"
          aria-label="Phân loại hội thoại"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              aria-pressed={filters.tab === tab.id}
              onClick={() => onFilters({ tab: tab.id })}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-1 py-2 text-xs transition-colors",
                filters.tab === tab.id
                  ? "bg-blue-50 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label} <span className="text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <div
            className="relative"
            ref={dropdownRef}
            onKeyDown={(event) => {
              if (event.key === "Escape") setChannelsOpen(false);
            }}
          >
            <button
              aria-expanded={channelsOpen}
              aria-controls="channel-filters"
              onClick={() => setChannelsOpen(!channelsOpen)}
              className={cn(
                "flex h-8 items-center gap-1 rounded-full border px-3 hover:bg-muted",
                filters.channels.length > 0 &&
                  "border-blue-200 bg-blue-50 text-primary",
              )}
            >
              <span>
                Kênh
                {filters.channels.length ? ` (${filters.channels.length})` : ""}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {channelsOpen && (
              <div
                id="channel-filters"
                className="absolute left-0 top-10 z-20 w-44 rounded-xl border bg-white p-2 shadow-xl"
              >
                {(Object.keys(CHANNEL_LABELS) as Channel[]).map((channel) => (
                  <label
                    key={channel}
                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={filters.channels.includes(channel)}
                      onChange={(event) =>
                        onFilters({
                          channels: event.target.checked
                            ? [...filters.channels, channel]
                            : filters.channels.filter(
                                (item) => item !== channel,
                              ),
                        })
                      }
                      className="h-4 w-4 accent-blue-500"
                    />
                    <ChannelIcon channel={channel} />
                    {CHANNEL_LABELS[channel]}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            aria-pressed={filters.hasBooking}
            onClick={() => onFilters({ hasBooking: !filters.hasBooking })}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border px-2.5 hover:bg-muted",
              filters.hasBooking && "border-blue-200 bg-blue-50 text-primary",
            )}
          >
            <CalendarDays className="h-3 w-3" />
            Có lịch hẹn
          </button>
          <button
            aria-pressed={filters.hasContact}
            onClick={() => onFilters({ hasContact: !filters.hasContact })}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border px-2.5 hover:bg-muted",
              filters.hasContact && "border-blue-200 bg-blue-50 text-primary",
            )}
          >
            <ContactRound className="h-3 w-3" />
            Có SĐT/email
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{filtered.length} cuộc hội thoại</span>
          <button
            aria-pressed={filters.showArchived}
            className={cn(
              "flex items-center gap-1 hover:text-primary",
              filters.showArchived && "font-semibold text-primary",
            )}
            onClick={() =>
              onFilters({ showArchived: !filters.showArchived, tab: "all" })
            }
          >
            <Archive className="h-3 w-3" />
            {filters.showArchived ? "Đang xem lưu trữ" : "Lưu trữ"}
          </button>
        </div>
      </div>
      <div ref={containerRef} className="scrollbar-thin flex-1 overflow-y-auto relative">
        {/* Mobile Pull to refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="flex items-center justify-center overflow-hidden transition-all text-blue-600 bg-blue-50/70 border-b border-blue-100"
            style={{ height: isRefreshing ? 44 : Math.max(pullDistance, 0) }}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing ? "animate-spin text-blue-600" : "text-blue-500")} />
            <span className="text-xs font-semibold text-blue-700">
              {isRefreshing ? "Đang đồng bộ..." : pullDistance >= 70 ? "Thả ra để làm mới" : "Kéo xuống làm mới"}
            </span>
          </div>
        )}
        {filtered.length ? (
          filtered.map((conversation) => {
            const lastMessage = conversation.messages.at(-1)!;
            const wait = waitingLabel(conversation, now);
            return (
              <button
                key={conversation.id}
                onClick={() => {
                  triggerHaptic("light");
                  onSelect(conversation.id);
                }}
                aria-current={
                  selectedId === conversation.id ? "true" : undefined
                }
                className={cn(
                  "relative flex w-full gap-3 border-b px-4 py-4 text-left transition-colors hover:bg-[#f8faff]",
                  selectedId === conversation.id &&
                    "bg-[#edf4ff] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary",
                )}
              >
                <Avatar conversation={conversation} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold">
                      {conversation.name}
                    </span>
                    <time
                      dateTime={lastMessage.createdAt}
                      className="shrink-0 text-[10px] text-muted-foreground"
                    >
                      {formatTime(lastMessage.createdAt)}
                    </time>
                  </div>
                  <p className="truncate text-xs leading-5 text-muted-foreground">
                    {lastMessage.sender !== "customer" && "Bạn: "}
                    {lastMessage.content || "Hình ảnh đính kèm"}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {conversation.status === "resolved" ? (
                        <>
                          <Check className="h-3 w-3" />
                          Đã xong
                        </>
                      ) : conversation.channel === "web" ? (
                        <span className="text-teal-600 font-medium">🌐 Web Chat Widget</span>
                      ) : conversation.channel === "facebook" && /^\d+$/.test(conversation.id.replace(/^facebook-/, "")) ? (
                        <span className="text-blue-600 font-medium flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Fanpage Live
                        </span>
                      ) : (
                        "Trung tâm Tiệc cưới Golden Palace"
                      )}
                    </span>
                    {wait && (
                      <span className="ml-auto text-[10px] text-rose-500">
                        {wait}
                      </span>
                    )}
                    {conversation.unread > 0 ? (
                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-white">
                        {conversation.unread}
                      </span>
                    ) : conversation.assignedStaffName ? (
                      <span
                        className="ml-auto rounded bg-blue-50 text-blue-700 border border-blue-200/80 px-1.5 py-0.5 text-[9px] font-semibold flex items-center gap-0.5 shrink-0"
                        title={`Phụ trách: ${conversation.assignedStaffName}`}
                      >
                        <span className="text-[8px]">👤</span>
                        <span className="truncate max-w-[65px]">
                          {conversation.assignedStaffName}
                        </span>
                      </span>
                    ) : conversation.assignedTo === "me" ? (
                      <span className="ml-auto rounded bg-[#e6e8f2] px-1 py-0.5 text-[9px] font-semibold">
                        {CURRENT_STAFF}
                      </span>
                    ) : conversation.assignedTo === "unassigned" ? (
                      <span className="ml-auto rounded bg-amber-50 text-amber-700 border border-amber-200/80 px-1 py-0.5 text-[9px] font-medium">
                        Chưa gán
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        ) : conversations.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Hộp thư sẵn sàng</p>
            <p className="max-w-[210px] text-xs leading-relaxed text-muted-foreground">
              Chưa có hội thoại mới. Tin nhắn từ Facebook, Zalo hoặc Web Widget sẽ tự động xuất hiện tại đây khi khách liên hệ.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 px-6 text-center">
            <SearchX className="h-9 w-9 text-slate-300" />
            <p className="text-sm font-medium">Không tìm thấy hội thoại</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Thử từ khóa khác hoặc bỏ bớt bộ lọc.
            </p>
            <Button variant="outline" size="sm" onClick={reset}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t bg-[#fcfcff] px-4 py-3 text-[11px] text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="font-medium text-slate-600">Hệ thống trực tuyến · Sẵn sàng tiếp nhận</span>
      </div>
    </section>
  );
}

import type { Conversation, InboxFilters, Message } from "./types";

export const CHANNEL_LABELS = {
  facebook: "Facebook",
  web: "Web",
  zalo: "Zalo",
} as const;
export const CURRENT_STAFF = "NK";
export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** Local UI extraction only; inspect customer messages, never staff signatures. */
export function detectContact(messages: Message[]) {
  const customerMessages = messages.filter(
    (message) => message.sender === "customer",
  );
  const text = customerMessages.map((message) => message.content).join("\n");
  const emails = [
    ...new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []),
  ];
  const phones = [
    ...new Set(
      (
        text.match(
          /(?<![\w])(?:\+84|84|0)[\s.-]?[35789](?:[\s.-]?\d){8}(?!\d)/g,
        ) ?? []
      ).map((phone) => phone.replace(/[\s.-]/g, "").replace(/^\+?84/, "0")),
    ),
  ];
  const fullName = customerMessages
    .flatMap((message) => message.content.split(/\n/))
    .map((line) => line.trim())
    .find((line) =>
      /^[A-ZÀ-Ỹ][\p{L}]*(?:\s+[A-ZÀ-Ỹ][\p{L}]*){1,5}$/u.test(line),
    );
  return { phones, emails, fullName: fullName ?? "" };
}

export function filterConversations(
  conversations: Conversation[],
  filters: InboxFilters,
) {
  const query = normalizeSearch(filters.query.trim());
  return conversations
    .filter((conversation) => {
      if (
        filters.showArchived
          ? conversation.status !== "archived"
          : conversation.status === "archived"
      )
        return false;
      if (filters.tab === "pending" && conversation.status !== "pending")
        return false;
      if (filters.tab === "mine" && conversation.assignedTo !== "me")
        return false;
      if (
        filters.channels.length &&
        !filters.channels.includes(conversation.channel)
      )
        return false;
      if (filters.hasBooking && !conversation.booking) return false;
      const contact = detectContact(conversation.messages);
      if (
        filters.hasContact &&
        !contact.phones.length &&
        !contact.emails.length &&
        !conversation.lead?.phone &&
        !conversation.lead?.email
      )
        return false;
      const searchable = [
        conversation.name,
        conversation.lead?.full_name,
        conversation.lead?.phone,
        conversation.lead?.email,
        ...conversation.messages.map((message) => message.content),
      ]
        .filter(Boolean)
        .join(" ");
      return (
        !query ||
        normalizeSearch(searchable).includes(query) ||
        (/^[+\d\s.-]+$/.test(query) &&
          query.replace(/[^\d]/g, "").length >= 3 &&
          searchable
            .replace(/[^\d]/g, "")
            .includes(query.replace(/[^\d]/g, "")))
      );
    })
    .sort(
      (a, b) =>
        Date.parse(b.messages.at(-1)?.createdAt ?? "") -
        Date.parse(a.messages.at(-1)?.createdAt ?? ""),
    );
}

export function formatTime(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
}
export function waitingLabel(conversation: Conversation, now: number) {
  if (conversation.status !== "pending") return null;
  const last = conversation.messages.at(-1);
  if (!last || last.sender !== "customer") return null;
  if (Date.parse(last.createdAt) > now) return null;
  const minutes = Math.max(
    1,
    Math.floor((now - Date.parse(last.createdAt)) / 60_000),
  );
  return minutes < 60
    ? `chờ ${minutes} phút`
    : `chờ ${Math.floor(minutes / 60)} giờ`;
}

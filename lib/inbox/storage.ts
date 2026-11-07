import type { Conversation } from "./types";
import { BOOKING_TYPES } from "@/lib/crm/model";

export const STORAGE_KEY = "omnichat.inbox.golden-palace.v1";
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isDate = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

/** Treat browser storage as untrusted; a broken snapshot must not crash the page. */
export function parseSnapshot(raw: string): Conversation[] {
  const snapshot: unknown = JSON.parse(raw);
  if (
    !isRecord(snapshot) ||
    snapshot.version !== 1 ||
    !Array.isArray(snapshot.conversations) ||
    snapshot.conversations.length === 0
  )
    throw new Error("Invalid snapshot");
  const ids = new Set<string>();
  for (const item of snapshot.conversations) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      ids.has(item.id) ||
      typeof item.name !== "string" ||
      typeof item.avatarColor !== "string" ||
      typeof item.note !== "string" ||
      typeof item.aiEnabled !== "boolean" ||
      !["facebook", "web", "zalo"].includes(String(item.channel)) ||
      !["active", "pending", "resolved", "archived"].includes(
        String(item.status),
      ) ||
      typeof item.assignedTo !== "string" ||
      !item.assignedTo ||
      (item.assignedStaffName !== undefined &&
        typeof item.assignedStaffName !== "string") ||
      (item.assignedAt !== undefined && typeof item.assignedAt !== "string") ||
      (item.assignedBy !== undefined && typeof item.assignedBy !== "string") ||
      !Number.isInteger(item.unread) ||
      (item.unread as number) < 0 ||
      !Array.isArray(item.messages) ||
      !item.messages.length
    )
      throw new Error("Invalid conversation");
    ids.add(item.id);
    for (const message of item.messages) {
      if (
        !isRecord(message) ||
        typeof message.id !== "string" ||
        typeof message.content !== "string" ||
        !["customer", "agent", "bot"].includes(String(message.sender)) ||
        !isDate(message.createdAt) ||
        (message.liked !== undefined && typeof message.liked !== "boolean")
      )
        throw new Error("Invalid message");
      const confirmation = message.bookingConfirmation;
      if (
        confirmation !== undefined &&
        (!isRecord(confirmation) ||
          !isDate(confirmation.appointment_time) ||
          typeof confirmation.event_type !== "string" ||
          !Object.hasOwn(BOOKING_TYPES, confirmation.event_type))
      )
        throw new Error("Invalid booking confirmation");
      if (
        message.suggestedQuestions !== undefined &&
        (!Array.isArray(message.suggestedQuestions) ||
          message.suggestedQuestions.length !== 3 ||
          message.suggestedQuestions.some(
            (question) => typeof question !== "string",
          ))
      )
        throw new Error("Invalid follow-up questions");
      if (
        message.attachments !== undefined &&
        (!Array.isArray(message.attachments) ||
          message.attachments.some(
            (attachment: unknown) =>
              !isRecord(attachment) ||
              typeof attachment.id !== "string" ||
              typeof attachment.name !== "string" ||
              typeof attachment.dataUrl !== "string" ||
              !/^data:image\/(png|jpeg|webp|gif);base64,/.test(
                attachment.dataUrl,
              ),
          ))
      )
        throw new Error("Invalid attachment");
    }
    if (
      item.booking !== undefined &&
      (!isRecord(item.booking) ||
        !isDate(item.booking.appointmentTime) ||
        typeof item.booking.staff !== "string" ||
        typeof item.booking.notes !== "string")
    )
      throw new Error("Invalid booking");
    if (
      item.lead !== undefined &&
      (!isRecord(item.lead) ||
        ![
          "id",
          "conversation_id",
          "full_name",
          "phone",
          "email",
          "demand_notes",
          "source",
          "created_at",
        ].every(
          (key) =>
            typeof (item.lead as Record<string, unknown>)[key] === "string",
        ) ||
        item.lead.status !== "new")
    )
      throw new Error("Invalid lead");
  }
  return snapshot.conversations as Conversation[];
}

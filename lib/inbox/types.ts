import type { BookingInput } from "@/lib/crm/model";

export type Channel = "facebook" | "web" | "zalo";
export type ConversationStatus = "active" | "pending" | "resolved" | "archived";
export type InboxTab = "all" | "pending" | "mine";

export interface Attachment {
  id: string;
  name: string;
  dataUrl: string;
}
export interface Message {
  id: string;
  sender: "customer" | "agent" | "bot";
  content: string;
  createdAt: string;
  liked?: boolean;
  reaction?: "like" | "love" | "haha" | "wow" | "sad" | "angry" | string;
  pinned?: boolean;
  attachments?: Attachment[];
  suggestedQuestions?: string[];
  bookingConfirmation?: Pick<BookingInput, "appointment_time" | "event_type">;
}
export interface Lead {
  id: string;
  conversation_id: string;
  full_name: string;
  phone: string;
  email: string;
  demand_notes: string;
  source: Channel;
  status: "new";
  created_at: string;
}
export interface Conversation {
  id: string;
  name: string;
  channel: Channel;
  avatarColor: string;
  status: ConversationStatus;
  aiEnabled: boolean;
  assignedTo: "me" | "team" | "unassigned" | string;
  assignedStaffName?: string;
  assignedAt?: string;
  assignedBy?: string;
  unread: number;
  note: string;
  messages: Message[];
  booking?: { appointmentTime: string; staff: string; notes: string };
  lead?: Lead;
  pinnedMessageId?: string;
  crmMode?: "demo" | "supabase";
}
export interface InboxFilters {
  query: string;
  tab: InboxTab;
  channels: Channel[];
  hasBooking: boolean;
  hasContact: boolean;
  showArchived: boolean;
  currentUserId?: string;
  currentStaffName?: string;
}

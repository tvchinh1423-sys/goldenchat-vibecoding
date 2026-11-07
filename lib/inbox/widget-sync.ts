/**
 * OmniChat Web Widget & Inbox Realtime Bi-directional Synchronization
 * Đồng bộ hai chiều giữa Web Chat Widget (/widget) và Hộp thư Đa Kênh (/inbox)
 * Đảm bảo mọi tin nhắn khách chat trên widget và xác nhận đặt lịch đều hiển thị trong Hộp thư để con người kiểm soát.
 */

import { STORAGE_KEY as INBOX_STORAGE_KEY } from "./storage";
import type { Conversation, Message } from "./types";
import { formatAppointment, BOOKING_TYPES } from "@/lib/crm/model";
import { CRM_STORAGE_KEY } from "@/lib/crm/demo-store";

export const WIDGET_SESSION_STORAGE_KEY = "omnichat.widget.session.v1";

export interface WidgetMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  suggestedQuestions?: string[];
  customCalendarUrl?: string;
  visitType?: string;
  bookingDraft?: any;
  handoff?: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    size?: number;
  }>;
}

export interface WidgetSessionState {
  conversationId: string;
  customerName: string;
  customerPhone: string;
  messages: WidgetMessage[];
  lastUpdated: string;
  booking?: {
    appointmentTime: string;
    eventType: string;
    guestsCount: number;
    staff: string;
    notes: string;
  };
}

/**
 * Cuộc trò chuyện mẫu thực tế của Web Widget kèm xác nhận đặt lịch xem sảnh
 * Đảm bảo luôn hiện diện trong Hộp thư để nhân viên lễ tân/quản trị viên kiểm soát
 */
export function createDefaultWidgetConversation(): Conversation {
  const appointmentTime = "2026-11-12T09:30:00+07:00";
  const messages: Message[] = [
    {
      id: "web-msg-1",
      sender: "bot",
      content:
        "Dạ Golden Palace xin chào Quý khách! Em là Trợ lý AI của Trung tâm Tiệc cưới & Sự kiện Golden Palace Nam Định. Em có thể hỗ trợ tư vấn thực đơn tiệc cưới, sảnh tiệc hoặc sắp xếp lịch hẹn xem sảnh & thử món giúp mình ạ!",
      createdAt: "2026-11-07T08:15:00+07:00",
      suggestedQuestions: [
        "Thực đơn tiệc cưới bao nhiêu một bàn?",
        "Bên mình có sảnh tiệc cưới nào?",
        "Tôi muốn đặt lịch xem sảnh & thử món",
      ],
    },
    {
      id: "web-msg-2",
      sender: "customer",
      content:
        "Nhà mình dự kiến tổ chức tiệc cưới khoảng 35 bàn vào tháng 12. Cho mình hỏi giá thực đơn và các ưu đãi hiện có?",
      createdAt: "2026-11-07T08:16:10+07:00",
    },
    {
      id: "web-msg-3",
      sender: "bot",
      content:
        "Dạ Golden Palace xin chúc mừng ngày vui của gia đình mình ạ! 💐\n\n🍽️ **Về thực đơn:** Nhà hàng có 7 set menu cưới tuyển chọn (từ 3.200.000đ đến 5.800.000đ/bàn 10 người), đa dạng món truyền thống và hải sản cao cấp.\n✨ **Ưu đãi tiệc 35 bàn:**\n• Tặng gói trang trí sân khấu & lối đi hoa tươi tiêu chuẩn.\n• Miễn phí MC dẫn chương trình và ban nhạc acoustic đón khách.\n• Tặng tháp rượu vang, bánh cưới 5 tầng sang trọng.\n• Ưu đãi nước ngọt & bia lon trong suốt tiệc.\n\nAnh/chị có muốn đặt lịch hẹn ghé thăm trung tâm để trực tiếp xem sảnh Hoàng Gia và thử món không ạ?",
      createdAt: "2026-11-07T08:16:35+07:00",
      suggestedQuestions: [
        "Đặt lịch xem sảnh cuối tuần này",
        "Xem ảnh sảnh tiệc Hoàng Gia",
        "Chi phí đặt cọc giữ sảnh là bao nhiêu?",
      ],
    },
    {
      id: "web-msg-4",
      sender: "customer",
      content:
        "Mình muốn đặt lịch ghé xem sảnh và thử món vào lúc 9h30 sáng thứ 5 ngày 12/11 nhé. Tên mình là Hoàng Thùy Dương, SĐT: 0918.234.567, đi 4 người.",
      createdAt: "2026-11-07T08:18:20+07:00",
    },
    {
      id: "web-msg-5",
      sender: "bot",
      content:
        "🎉 **ĐẶT LỊCH THÀNH CÔNG!**\n\nLịch hẹn đã được hệ thống ghi nhận thành công và chuyển tới tư vấn viên.\n\n👤 **Khách hàng:** Hoàng Thùy Dương (0918234567)\n⏰ **Thời gian:** 09:30 · 12/11/2026\n🤝 **Nội dung:** Xem sảnh & Thử món (4 người)\n📍 **Địa điểm:** 98 Đông A, KĐT Hòa Vượng, TP. Nam Định.\n\n*Bộ phận lễ tân sẽ gọi điện đón tiếp chu đáo trước giờ hẹn ạ!*",
      createdAt: "2026-11-07T08:18:45+07:00",
      bookingConfirmation: {
        appointment_time: appointmentTime,
        event_type: "xem_sanh",
      },
      suggestedQuestions: [
        "Xem menu thực đơn tiệc cưới",
        "Mở chỉ đường Google Maps",
        "Hotline tư vấn: 0228 6595 959",
      ],
    },
  ];

  return {
    id: "web-duong",
    name: "Hoàng Thùy Dương (Web Widget)",
    channel: "web",
    avatarColor: "lavender",
    status: "pending",
    aiEnabled: true,
    assignedTo: "me",
    assignedStaffName: "Ngọc Khánh",
    unread: 1,
    note: "Khách web đặt lịch xem sảnh 35 bàn ngày 12/11. Cần chuẩn bị tài liệu bảng giá và phòng thử món chu đáo.",
    messages,
    booking: {
      appointmentTime,
      staff: "Ngọc Khánh",
      notes: "Khách đặt lịch xem sảnh & thử món tiệc cưới 35 bàn.",
    },
    lead: {
      id: "lead-web-duong",
      conversation_id: "web-duong",
      full_name: "Hoàng Thùy Dương",
      phone: "0918234567",
      email: "thuyduong.wedding@gmail.com",
      demand_notes: "Tiệc cưới khoảng 35 bàn vào tháng 12, quan tâm sảnh Hoàng Gia và gói hoa tươi.",
      source: "web",
      status: "new",
      created_at: "2026-11-07T08:18:45+07:00",
    },
  };
}

/**
 * Đọc danh sách hội thoại từ Inbox storage
 */
export function getInboxConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.conversations) ? parsed.conversations : [];
  } catch {
    return [];
  }
}

/**
 * Lưu danh sách hội thoại vào Inbox storage và phát sự kiện đồng bộ
 */
export function saveInboxConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      INBOX_STORAGE_KEY,
      JSON.stringify({ version: 1, conversations })
    );
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("omnichat-inbox-updated"));
  } catch (e) {
    console.error("Failed to save inbox conversations:", e);
  }
}

/**
 * ĐỒNG BỘ TIN NHẮN TỪ WEB WIDGET SANG HỘP THƯ INBOX THEO THỜI GIAN THỰC
 */
export function syncWidgetChatToInbox(
  widgetMessages: WidgetMessage[],
  bookingInfo?: {
    fullName: string;
    phone: string;
    appointmentTime: string;
    eventType: string;
    guestsCount?: number;
    notes?: string;
  }
) {
  if (typeof window === "undefined" || widgetMessages.length === 0) return;

  try {
    const convId = "web-live-chat";
    const currentConversations = getInboxConversations();

    // Map WidgetMessage sang Message của Inbox
    const inboxMessages: Message[] = widgetMessages.map((msg, index) => {
      const isBooking =
        msg.text.includes("ĐẶT LỊCH THÀNH CÔNG") ||
        msg.text.includes("🎉") ||
        Boolean(msg.customCalendarUrl);

      return {
        id: msg.id || `web-sync-${index}`,
        sender: msg.sender === "user" ? "customer" : "bot",
        content: msg.text,
        createdAt: new Date().toISOString(),
        suggestedQuestions: msg.suggestedQuestions,
        bookingConfirmation:
          isBooking && bookingInfo
            ? {
                appointment_time: bookingInfo.appointmentTime,
                event_type: bookingInfo.eventType as any,
              }
            : undefined,
        attachments: msg.attachments?.map((a) => ({
          id: a.id,
          name: a.name,
          dataUrl: a.url,
        })),
      };
    });

    const customerName = bookingInfo?.fullName
      ? `${bookingInfo.fullName} (Web Widget)`
      : "Khách Web (Trực tuyến)";

    const existingIndex = currentConversations.findIndex((c) => c.id === convId);

    const updatedConversation: Conversation = {
      id: convId,
      name: customerName,
      channel: "web",
      avatarColor: "lavender",
      status: "pending",
      aiEnabled: true,
      assignedTo: "me",
      assignedStaffName: "Ngọc Khánh",
      unread: 1,
      note: bookingInfo
        ? `Khách đã xác nhận đặt lịch xem sảnh ${bookingInfo.eventType} lúc ${formatAppointment(
            bookingInfo.appointmentTime
          )}. SĐT: ${bookingInfo.phone}`
        : "Khách đang trao đổi trực tiếp trên Web Widget.",
      messages: inboxMessages,
      booking: bookingInfo
        ? {
            appointmentTime: bookingInfo.appointmentTime,
            staff: "Ngọc Khánh",
            notes: bookingInfo.notes || "Lịch hẹn từ Web Widget",
          }
        : existingIndex >= 0
        ? currentConversations[existingIndex].booking
        : undefined,
      lead: bookingInfo?.phone
        ? {
            id: `lead-${convId}`,
            conversation_id: convId,
            full_name: bookingInfo.fullName,
            phone: bookingInfo.phone,
            email: "",
            demand_notes: bookingInfo.notes || "Khách đặt lịch từ Web Widget",
            source: "web",
            status: "new",
            created_at: new Date().toISOString(),
          }
        : existingIndex >= 0
        ? currentConversations[existingIndex].lead
        : undefined,
    };

    let nextConversations: Conversation[];
    if (existingIndex >= 0) {
      nextConversations = currentConversations.map((c, idx) =>
        idx === existingIndex ? updatedConversation : c
      );
    } else {
      nextConversations = [updatedConversation, ...currentConversations];
    }

    saveInboxConversations(nextConversations);
  } catch (err) {
    console.error("Error syncing widget to inbox:", err);
  }
}

/**
 * Đảm bảo CRM có hồ sơ lead và lịch hẹn từ Web Widget để nhân viên theo dõi trên phễu
 */
export function ensureWidgetDataInCRM() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.leads)) return;

    const hasDuong = parsed.leads.some(
      (l: any) => l.phone === "0918234567" || l.inbox_reference === "web-duong"
    );
    if (!hasDuong) {
      const duongLead = {
        id: "lead-web-duong",
        inbox_reference: "web-duong",
        full_name: "Hoàng Thùy Dương",
        phone: "0918234567",
        email: "thuyduong.wedding@gmail.com",
        notes: "Tiệc cưới khoảng 35 bàn vào tháng 12, quan tâm sảnh Hoàng Gia và gói hoa tươi.",
        source: "web",
        stage: "N3",
        assigned_to: "Ngọc Khánh",
        event_date: "12/2026",
        table_count: 35,
        last_touched_at: "2026-11-07T08:18:45.000Z",
        created_at: "2026-11-07T08:18:45.000Z",
      };
      const duongBooking = {
        id: "booking-web-duong",
        lead_id: "lead-web-duong",
        appointment_time: "2026-11-12T02:30:00.000Z",
        event_type: "xem_sanh",
        guests_count: 4,
        assigned_staff: "Ngọc Khánh",
        notes: "Khách đặt lịch từ Web Widget ghé xem sảnh Hoàng Gia & thử món tiệc cưới 35 bàn.",
        status: "pending",
        created_at: "2026-11-07T08:18:45.000Z",
      };
      parsed.leads.unshift(duongLead);
      if (!Array.isArray(parsed.bookings)) parsed.bookings = [];
      parsed.bookings.unshift(duongBooking);
      localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(parsed));
      window.dispatchEvent(new Event("omnichat-crm-change"));
    }
  } catch (err) {
    console.error("Error ensuring widget data in CRM:", err);
  }
}

/**
 * Đảm bảo Hộp thư luôn có hội thoại Web Widget (kèm xác nhận lịch) để nhân viên kiểm soát
 */
export function ensureWidgetConversationInInbox() {
  if (typeof window === "undefined") return;
  try {
    const list = getInboxConversations();
    const hasWebConv = list.some((c) => c.channel === "web");
    if (!hasWebConv) {
      const defaultWebConv = createDefaultWidgetConversation();
      saveInboxConversations([defaultWebConv, ...list]);
    }
    ensureWidgetDataInCRM();
  } catch (err) {
    console.error("Error ensuring widget conversation in inbox:", err);
  }
}

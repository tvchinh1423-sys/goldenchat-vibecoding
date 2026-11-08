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
  visitType?: "xem_sanh" | "thu_mon";
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
 * Trả về danh sách tin nhắn mẫu của Web Widget để hiển thị và bảo toàn lịch sử chat
 */
export function getDefaultTestWidgetMessages(): WidgetMessage[] {
  const defaultConv = createDefaultWidgetConversation();
  return defaultConv.messages.map((m) => ({
    id: m.id,
    sender: m.sender === "customer" ? ("user" as const) : ("bot" as const),
    text: m.content,
    time: m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "08:18",
    suggestedQuestions: m.suggestedQuestions,
  }));
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
 * Phát broadcast đồng bộ đa tab tức thì (Zero-latency cross-tab sync)
 */
export function broadcastWidgetUpdate(detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const bc = new BroadcastChannel("omnichat_sync");
    bc.postMessage({
      type: "WIDGET_CHAT_UPDATE",
      timestamp: Date.now(),
      ...detail,
    });
    bc.close();
  } catch {
    // Trình duyệt không hỗ trợ BroadcastChannel thì bỏ qua
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
    broadcastWidgetUpdate();

    // Đồng bộ tức thì lên Cloud Store để các thiết bị khác (iPhone, Mac) nhận ngay
    void fetch("/api/sync/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversations }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save inbox conversations:", e);
  }
}

/**
 * ĐỒNG BỘ TIN NHẮN TỪ WEB WIDGET SANG HỘP THƯ INBOX THEO THỜI GIAN THỰC
 * Tự động tìm và cập nhật vào cuộc hội thoại kênh Web trong Inbox (ví dụ: web-duong)
 * Giữ nguyên vẹn toàn bộ diễn biến hỏi đáp và thẻ xác nhận đặt lịch để con người kiểm soát.
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
    const currentConversations = getInboxConversations();

    // 1. Tìm hội thoại kênh Web hiện có trong Hộp thư (ưu tiên web-duong nếu có)
    const existingIndex = currentConversations.findIndex(
      (c) => c.channel === "web" || c.id === "web-duong" || c.id === "web-live-chat"
    );
    const existingConv = existingIndex >= 0 ? currentConversations[existingIndex] : null;
    const convId = existingConv?.id || "web-duong";

    const nowIso = new Date().toISOString();
    const todayYmd = nowIso.slice(0, 10);

    // 2. Chuyển đổi toàn bộ WidgetMessage sang Message chuẩn của Hộp thư
    const inboxMessages: Message[] = widgetMessages.map((msg, index) => {
      const isBooking =
        msg.text.includes("ĐẶT LỊCH THÀNH CÔNG") ||
        msg.text.includes("XÁC NHẬN ĐÃ NHẬN LỊCH HẸN") ||
        msg.text.includes("🎉") ||
        Boolean(msg.customCalendarUrl);

      // Tạo timestamp chuẩn ISO Date
      let createdAt = nowIso;
      if (msg.time && /^\d{1,2}:\d{2}$/.test(msg.time)) {
        createdAt = `${todayYmd}T${msg.time.padStart(5, "0")}:00+07:00`;
      }

      return {
        id: msg.id || `web-sync-${index}`,
        sender: msg.sender === "user" ? "customer" : "bot",
        content: msg.text,
        createdAt,
        bookingConfirmation:
          isBooking && bookingInfo
            ? {
                appointment_time: bookingInfo.appointmentTime,
                event_type: bookingInfo.eventType as any,
              }
            : isBooking && existingConv?.booking
            ? {
                appointment_time: existingConv.booking.appointmentTime,
                event_type: "xem_sanh",
              }
            : undefined,
        attachments: msg.attachments?.map((a) => ({
          id: a.id,
          name: a.name,
          dataUrl: a.url,
        })),
      };
    });

    // 3. Tên hiển thị của khách
    let customerName = "Khách Web (Trực tuyến)";
    if (bookingInfo?.fullName) {
      customerName = `${bookingInfo.fullName} (Web Widget)`;
    } else if (existingConv?.name && !existingConv.name.includes("Khách Web")) {
      customerName = existingConv.name;
    }

    // Giữ lại và bảo toàn các tin nhắn do nhân viên tư vấn đã gửi từ Hộp thư
    const agentMessages = (existingConv?.messages || []).filter((m) => m.sender === "agent");
    const mergedMessages = [...inboxMessages];
    for (const am of agentMessages) {
      if (!mergedMessages.some((m) => m.id === am.id || (m.content === am.content && Math.abs(Date.parse(m.createdAt || "0") - Date.parse(am.createdAt || "0")) < 15000))) {
        mergedMessages.push(am);
      }
    }
    mergedMessages.sort((a, b) => Date.parse(a.createdAt || "0") - Date.parse(b.createdAt || "0"));

    const updatedConversation: Conversation = {
      ...(existingConv || {}),
      id: convId,
      name: customerName,
      channel: "web",
      avatarColor: existingConv?.avatarColor || "lavender",
      status: "pending",
      aiEnabled: existingConv ? existingConv.aiEnabled : true,
      assignedTo: existingConv?.assignedTo || "me",
      assignedStaffName: existingConv?.assignedStaffName || "Ngọc Khánh",
      unread: 1,
      note: bookingInfo
        ? `Khách đã xác nhận đặt lịch xem sảnh ${bookingInfo.eventType} lúc ${formatAppointment(
            bookingInfo.appointmentTime
          )}. SĐT: ${bookingInfo.phone}`
        : existingConv?.note || "Khách đang trao đổi trực tiếp trên Web Widget.",
      messages: mergedMessages,
      booking: bookingInfo
        ? {
            appointmentTime: bookingInfo.appointmentTime,
            staff: "Ngọc Khánh",
            notes: bookingInfo.notes || "Lịch hẹn từ Web Widget",
          }
        : existingConv?.booking,
      lead: bookingInfo?.phone
        ? {
            id: existingConv?.lead?.id || `lead-${convId}`,
            conversation_id: convId,
            full_name: bookingInfo.fullName,
            phone: bookingInfo.phone,
            email: existingConv?.lead?.email || "",
            demand_notes: bookingInfo.notes || "Khách đặt lịch từ Web Widget",
            source: "web",
            status: "new",
            created_at: existingConv?.lead?.created_at || nowIso,
          }
        : existingConv?.lead,
    };

    let nextConversations: Conversation[];
    if (existingIndex >= 0) {
      // Đưa cuộc trò chuyện kênh Web có tin nhắn mới lên đầu danh sách
      const remaining = currentConversations.filter((_, idx) => idx !== existingIndex);
      nextConversations = [updatedConversation, ...remaining];
    } else {
      nextConversations = [updatedConversation, ...currentConversations];
    }

    saveInboxConversations(nextConversations);

    // Đồng bộ sang CRM nếu có thông tin đặt lịch
    if (bookingInfo?.phone) {
      ensureWidgetBookingInCRM(convId, bookingInfo);
    }
  } catch (err) {
    console.error("Error syncing widget to inbox:", err);
  }
}

/**
 * Cập nhật hồ sơ lead và lịch hẹn vào CRM khi khách đặt lịch trên Widget
 */
export function ensureWidgetBookingInCRM(
  inboxRef: string,
  booking: {
    fullName: string;
    phone: string;
    appointmentTime: string;
    eventType: string;
    guestsCount?: number;
    notes?: string;
  }
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.leads)) return;

    const cleanPhone = booking.phone.replace(/[\s.-]/g, "").replace(/^\+?84/, "0");
    const leadId = `lead-${inboxRef}`;

    const leadIndex = parsed.leads.findIndex(
      (l: any) => l.phone === cleanPhone || l.inbox_reference === inboxRef
    );

    const leadRecord = {
      id: leadIndex >= 0 ? parsed.leads[leadIndex].id : leadId,
      inbox_reference: inboxRef,
      full_name: booking.fullName,
      phone: cleanPhone,
      email: leadIndex >= 0 ? parsed.leads[leadIndex].email : "",
      notes: booking.notes || `Khách đặt lịch ${booking.eventType} từ Web Widget`,
      source: "web" as const,
      stage: "N3" as const,
      assigned_to: "Ngọc Khánh",
      event_date: "",
      table_count: null,
      last_touched_at: new Date().toISOString(),
      created_at: leadIndex >= 0 ? parsed.leads[leadIndex].created_at : new Date().toISOString(),
    };

    if (leadIndex >= 0) {
      parsed.leads[leadIndex] = leadRecord;
    } else {
      parsed.leads.unshift(leadRecord);
    }

    if (!Array.isArray(parsed.bookings)) parsed.bookings = [];
    const bookingIndex = parsed.bookings.findIndex((b: any) => b.lead_id === leadRecord.id);

    const bookingRecord = {
      id: bookingIndex >= 0 ? parsed.bookings[bookingIndex].id : `booking-${inboxRef}`,
      lead_id: leadRecord.id,
      appointment_time: booking.appointmentTime,
      event_type: booking.eventType,
      guests_count: booking.guestsCount || 2,
      assigned_staff: "Ngọc Khánh",
      notes: booking.notes || "Khách đặt lịch từ Web Widget",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    if (bookingIndex >= 0) {
      parsed.bookings[bookingIndex] = bookingRecord;
    } else {
      parsed.bookings.unshift(bookingRecord);
    }

    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new Event("omnichat-crm-change"));

    // Đồng bộ tức thì lên Cloud Store để các thiết bị khác nhận ngay
    void fetch("/api/sync/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crm: parsed }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch (err) {
    console.error("Error updating CRM from widget booking:", err);
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
      // 1. Kiểm tra xem khách đã từng nhắn tin trên Widget chưa
      const widgetSessionRaw = localStorage.getItem(WIDGET_SESSION_STORAGE_KEY);
      if (widgetSessionRaw) {
        try {
          const parsed = JSON.parse(widgetSessionRaw);
          const msgs = Array.isArray(parsed?.messages)
            ? parsed.messages
            : Array.isArray(parsed)
            ? parsed
            : [];
          if (msgs.length > 0) {
            syncWidgetChatToInbox(msgs);
            return;
          }
        } catch {}
      }

      // 2. Bảo toàn hội thoại và lịch hẹn Web Widget để con người luôn kiểm soát được
      const defaultWebConv = createDefaultWidgetConversation();
      saveInboxConversations([defaultWebConv, ...list]);
      ensureWidgetDataInCRM();
    }
  } catch (err) {
    console.error("Error ensuring widget conversation in inbox:", err);
  }
}

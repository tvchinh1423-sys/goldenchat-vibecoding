// types/database.ts

export type PlatformType = 'facebook' | 'zalo' | 'web';
export type SenderType = 'customer' | 'bot' | 'agent';

// Giai đoạn phễu khách hàng (Khớp 100% Ảnh 3 & 4)
export type LeadStage =
  | 'N1' // Lead thô (Mới nhận thông tin)
  | 'N2' // Tiềm năng (Đã liên hệ, có nhu cầu)
  | 'N3' // Khảo sát 1-1 (Đã hẹn xem sảnh & thử món trong showcase)
  | 'N4' // Chính thức (Đã đặt cọc / ký hợp đồng)
  | 'N5' // Nuôi dưỡng (Chăm sóc sau tiệc / upsell)
  | 'N0'; // Đã mất (Đổi kế hoạch / chọn nơi khác)

export interface Conversation {
  id: string;
  platform: PlatformType;
  external_thread_id: string; // ID từ Botcake
  customer_name: string;
  customer_avatar?: string;
  customer_phone?: string;
  is_ai_enabled: boolean;      // Toggle bật/tắt AI từng phiên
  assigned_to?: string;        // Phụ trách (Trần Diệu Thúy, v.v.)
  status: 'active' | 'pending' | 'resolved';
  unread_count?: number;
  last_message?: string;
  last_message_at: string;
  has_appointment?: boolean;
  has_contact_info?: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_name?: string;
  content: string;
  status?: 'sent' | 'delivered' | 'read';
  metadata?: Record<string, any>;
  is_draft?: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  conversation_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  course_interest?: string;    // Khóa học quan tâm (ENTD01, v.v.)
  stage: LeadStage;            // N1 -> N5, N0
  assigned_to: string;         // Nhân viên phụ trách
  last_touched_at: string;     // Dùng để lọc "Chưa ai chạm quá 7 ngày"
  notes?: string;
  source: PlatformType | 'manual';
  created_at: string;
}

export interface BookingAppointment {
  id: string;
  lead_id?: string;
  customer_name: string;
  phone: string;
  appointment_time: string;
  event_type?: string;
  guests_count?: number;
  assigned_staff?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
}

export interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags?: string[];
  is_active?: boolean;
  created_at?: string;
}

export interface BotConfig {
  id?: string;
  config_key: string;
  config_value: any;
  updated_at?: string;
}

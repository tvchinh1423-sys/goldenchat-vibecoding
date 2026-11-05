-- ==============================================================================
-- DATABASE SCHEMA CHO OMNICHAT AI — VIBECODING 2026 ĐỀ 04
-- Hệ thống: Supabase (PostgreSQL)
-- Hướng dẫn: Copy toàn bộ nội dung file này dán vào mục SQL Editor trên Supabase Dashboard và bấm RUN
-- ==============================================================================

-- 1. BẢNG HỘI THOẠI (CONVERSATIONS)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('facebook', 'zalo', 'web')),
    external_thread_id VARCHAR(100), -- ID cuộc hội thoại từ FB/Zalo
    customer_name VARCHAR(100) NOT NULL DEFAULT 'Khách hàng',
    customer_avatar TEXT,
    customer_phone VARCHAR(20),
    is_ai_enabled BOOLEAN NOT NULL DEFAULT true, -- AI tự động tư vấn
    assigned_to VARCHAR(50) DEFAULT 'unassigned', -- Gán cho sales/tư vấn viên nào
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'resolved')),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG TIN NHẮN (MESSAGES)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'bot', 'agent')),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    metadata JSONB DEFAULT '{}'::jsonb, -- Lưu thêm quote, token usage, file đính kèm
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG KHÁCH TIỀM NĂNG / PHỄU TUYỂN SINH (LEADS)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    course_interest VARCHAR(100), -- Khóa học quan tâm (ENTD01, v.v.)
    stage VARCHAR(10) NOT NULL DEFAULT 'N1' CHECK (stage IN ('N1', 'N2', 'N3', 'N4', 'N5', 'N0')),
    -- N1: Lead thô, N2: Tiềm năng, N3: Học thử, N4: Chính thức, N5: Nuôi dưỡng, N0: Đã mất
    source VARCHAR(20) DEFAULT 'web' CHECK (source IN ('facebook', 'zalo', 'web', 'manual')),
    assigned_to VARCHAR(50) DEFAULT 'Trần Diệu Thúy',
    last_touched_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG LỊCH HẸN TƯ VẤN (BOOKINGS)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    appointment_time TIMESTAMPTZ NOT NULL, -- Thời gian hẹn tư vấn / học thử 1-1
    event_type VARCHAR(50) DEFAULT 'tu_van_khoa_hoc', -- tu_van_khoa_hoc, hoc_thu_1_1, dinh_huong_nghe_nghiep
    guests_count INT DEFAULT 1, -- Số người tham gia
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    assigned_staff VARCHAR(50), -- Nhân viên/Chuyên gia tiếp đón
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG TRI THỨC FAQ (KNOWLEDGE_BASE)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) DEFAULT 'faq', -- hoc_phi, noi_dung_hoc, chung_chi, lich_hoc, hoc_thu
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG CẤU HÌNH BOT (BOT_CONFIGS)
CREATE TABLE IF NOT EXISTS bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TẠO CHỈ MỤC (INDEXES) ĐỂ TRUY VẤN REALTIME NHANH
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(appointment_time);

-- TẮT RLS HOẶC CHO PHÉP PUBLIC TRUY CẬP ĐỂ TEST TIỆN LỢI TRONG CUỘC THI
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs DISABLE ROW LEVEL SECURITY;

// lib/mock-service.ts
import { KnowledgeItem } from '@/types/database';

export interface BusinessProfile {
  name: string;
  industry: string;
  hotline: string;
  address: string;
  serviceTypeName: string; // ví dụ: "Gói bàn tiệc", "Dịch vụ", "Khóa học"
  bookingVerb: string;      // ví dụ: "Xem sảnh & thử món", "Tư vấn 1-1"
}

export interface BotTrainingConfig {
  businessProfile: BusinessProfile;
  isMasterEnabled: boolean;
  masterStatusNote: string;
  persona: string;
  workingHours: {
    start: number;
    end: number;
  };
  outOfHoursMessage: string;
  channels: {
    facebook: { enabled: boolean; mode: 'bot' | 'draft' | 'off' };
    zalo: { enabled: boolean; mode: 'bot' | 'draft' | 'off' };
    web: { enabled: boolean; mode: 'bot' | 'draft' | 'off' };
  };
  guardrails: string[];
  telegramAlert: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  sampleTestPrompts: string[];
}

export interface IndustryPreset {
  id: string;
  name: string;
  tag: string;
  profile: BusinessProfile;
  persona: string;
  guardrails: string[];
  samplePrompts: string[];
  knowledgeBase: KnowledgeItem[];
}

// BỘ CẤU HÌNH NGÀNH NGHỀ MẪU (MULTI-INDUSTRY PRESETS)
export const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  // ⭐ PRESET MẪU 1: TRUNG TÂM TIỆC CƯỚI & SỰ KIỆN (GOLDEN PALACE SHOWCASE)
  wedding_event: {
    id: 'wedding_event',
    name: 'Tiệc cưới & Hội nghị Sự kiện (Golden Palace Showcase)',
    tag: 'Được khuyên dùng',
    profile: {
      name: 'Trung tâm Tiệc cưới & Sự kiện Golden Palace',
      industry: 'Ẩm thực & Sự kiện (F&B / Hospitality)',
      hotline: '0228 6595 959',
      address: '98 Đông A, KĐT Hòa Vượng, TP. Nam Định',
      serviceTypeName: 'Gói tiệc & Sảnh cưới',
      bookingVerb: 'Xem sảnh tiệc & thử món',
    },
    persona: `Tên bot: Golden Palace Assistant
Xưng hô: Em xưng hô với Quý khách / Anh/Chị
Phong cách: Lịch sự, sang trọng, chu đáo, mến khách và chuyên nghiệp.
Mục tiêu: Tư vấn thực đơn bàn tiệc, công suất sảnh, ưu đãi theo mùa và khéo léo mời khách đặt lịch ghé tham quan sảnh thực tế. Luôn kết thúc lượt trò chuyện bằng một câu hỏi mở lịch thiệp.`,
    guardrails: [
      'Tuyệt đối không cam kết giữ sảnh tiệc trong ngày nếu khách chưa đặt cọc giữ chỗ chính thức.',
      'Không tự ý hứa giảm giá vượt quá 10% trên thực đơn ngoài các gói ưu đãi hiện hành của trung tâm.',
      'Khi khách yêu cầu thực đơn chay/Âu đặc thù hoặc có phàn nàn dịch vụ -> Tự động chuyển ngay cho Quản lý tiệc tiếp đón.',
    ],
    samplePrompts: [
      'Thực đơn tiệc cưới bao nhiêu một bàn?',
      'Cho tôi xem ảnh không gian sảnh tiệc',
      'Địa chỉ nhà hàng ở đâu?',
      'Xem thông tin tiệc và brochure ở đâu?',
      'Nhà hàng đón khách lúc mấy giờ?',
      'Sảnh tiệc bên mình chứa được bao nhiêu khách?',
      'Ưu đãi mùa cưới hiện nay có gì?',
      'Cho tôi hẹn xem sảnh vào cuối tuần',
      'Hotline liên hệ trực tiếp',
      'Số em là 0912345678',
    ],
    knowledgeBase: [
      {
        id: 'gp-1',
        category: 'thuc_don',
        question: 'Thực đơn tiệc cưới bao nhiêu một bàn?',
        answer: 'Dạ thực đơn tiệc cưới tại Golden Palace dao động từ 2.800.000đ - 6.500.000đ/bàn 10 khách với hơn 150 món ăn Á - Âu tinh hoa do các đầu bếp chuyên nghiệp chế biến. Quý khách vui lòng tham khảo trọn bộ menu chi tiết tại đây ạ: https://goldenpalacenamdinh.com/thuc-don . Hiện trung tâm đang tặng kèm gói đồ uống suốt tiệc cho hợp đồng từ 30 bàn trở lên ạ!',
        tags: ['thuc_don', 'gia_ban', 'menu', 'do_uong'],
        is_active: true,
      },
      {
        id: 'gp-2',
        category: 'sanh_tiec',
        question: 'Sảnh tiệc bên mình chứa được bao nhiêu khách?',
        answer: 'Dạ Golden Palace sở hữu hệ thống 4 đại sảnh đa dạng sức chứa từ 150 đến hơn 1.200 khách, trần cao không cột, trang bị màn hình LED P3 và hệ thống âm thanh ánh sáng biểu diễn tiêu chuẩn quốc tế.',
        tags: ['sanh_tiec', 'suc_chua', 'quy_mo'],
        is_active: true,
      },
      {
        id: 'gp-3',
        category: 'uu_dai',
        question: 'Hiện có chương trình ưu đãi gì cho mùa cưới không?',
        answer: 'Dạ Golden Palace đang triển khai gói ưu đãi "Khởi Sắc Tình Yêu": Tặng 100% gói trang trí sảnh cưới hoa tươi cao cấp, tặng MC chuyên nghiệp, vũ đoàn khai tiệc và hỗ trợ tặng bàn tiệc theo số lượng bàn thực tế ạ!',
        tags: ['uu_dai', 'hoa_tuoi', 'khuyen_mai'],
        is_active: true,
      },
      {
        id: 'gp-4',
        category: 'dat_coc',
        question: 'Đặt cọc và giữ sảnh tiệc như thế nào?',
        answer: 'Dạ để giữ ngày đẹp và sảnh ưng ý, anh/chị đặt cọc đợt 1 từ 10.000.000đ - 20.000.000đ tùy quy mô tiệc. Khoản cọc này được cấn trừ trực tiếp khi thanh toán hợp đồng chính thức ạ.',
        tags: ['dat_coc', 'hop_dong', 'giu_sanh'],
        is_active: true,
      },
      {
        id: 'gp-5',
        category: 'hen_xem_sanh',
        question: 'Tôi muốn đặt lịch đến xem sảnh và thử món trực tiếp được không?',
        answer: 'Dạ hoàn toàn được ạ! Golden Palace mở cửa đón khách tham quan sảnh và tư vấn từ 8:00 đến 10:30 sáng và các khung giờ linh hoạt theo lịch hẹn. Anh/chị cho em xin SĐT và ngày dự kiến ghé qua để bên em chuẩn bị chu đáo nhất nhé!',
        tags: ['hen_lich', 'xem_sanh', 'thu_mon'],
        is_active: true,
      },
      {
        id: 'gp-6',
        category: 'hinh_anh',
        question: 'Cho tôi xem hình ảnh không gian và sảnh tiệc của Golden Palace?',
        answer: 'Dạ kính mời Quý khách tham khảo toàn bộ hình ảnh thực tế không gian các đại sảnh tiệc cưới tráng lệ tại đây: https://goldenpalacenamdinh.com/khong-gian . Anh/chị đang dự kiến tiệc bao nhiêu bàn để em tư vấn sảnh phù hợp nhất ạ?',
        tags: ['hinh_anh', 'khong_gian', 'sanh_cuoi'],
        is_active: true,
      },
      {
        id: 'gp-7',
        category: 'dia_chi',
        question: 'Địa chỉ nhà hàng ở đâu và chỉ đường Google Maps?',
        answer: 'Dạ địa chỉ của Golden Palace tại: 98 Đông A, KĐT Hòa Vượng, TP. Nam Định. Quý khách có thể xem vị trí và đường đi thuận tiện trên Google Maps tại đây: https://maps.app.goo.gl/GrYDqNTLNmqQ1nH76?g_st=ic ạ!',
        tags: ['dia_chi', 'vi_tri', 'ban_do', 'google_maps'],
        is_active: true,
      },
      {
        id: 'gp-8',
        category: 'thong_tin_tiec',
        question: 'Xem thông tin tiệc cưới chi tiết và thực đơn ở đâu?',
        answer: 'Dạ Quý khách có thể tham khảo trọn bộ thông tin tiệc cưới tại Website: https://goldenpalacenamdinh.com hoặc xem nhanh tài liệu tổng quan tại: https://tinyurl.com/thongtintieccuoi ạ!',
        tags: ['website', 'brochure', 'thong_tin_tiec'],
        is_active: true,
      },
      {
        id: 'gp-9',
        category: 'hotline',
        question: 'Số điện thoại hotline liên hệ của nhà hàng là gì?',
        answer: 'Dạ Quý khách có thể liên hệ trực tiếp qua Hotline: 0228 6595 959 hoặc truy cập website goldenpalacenamdinh.com. Đội ngũ quản lý tiệc luôn sẵn sàng giải đáp 24/7 ạ!',
        tags: ['hotline', 'lien_he', 'so_dien_thoai'],
        is_active: true,
      },
      {
        id: 'gp-10',
        category: 'gio_don_khach',
        question: 'Nhà hàng đón khách vào khung giờ nào?',
        answer: 'Dạ Golden Palace đón khách tham quan, tư vấn và thử món từ 8:00 đến 10:30 sáng hằng ngày. Quý khách muốn đặt lịch vào ngày nào để bên em chuẩn bị bàn trà tiếp đón riêng chu đáo nhất ạ?',
        tags: ['gio_mo_cua', 'don_khach', 'thoi_gian'],
        is_active: true,
      },
    ],
  },

  // PRESET 2: DỊCH VỤ DOANH NGHIỆP & CHUYỂN ĐỔI SỐ B2B
  b2b_service: {
    id: 'b2b_service',
    name: 'Dịch vụ Doanh nghiệp & Chuyển đổi số B2B',
    tag: 'Công nghệ & Tư vấn',
    profile: {
      name: 'OmniTech Solutions',
      industry: 'Giải pháp Chuyển đổi số & Tự động hóa AI',
      hotline: '0901 234 567',
      address: 'Tòa nhà Innovation, Hà Nội',
      serviceTypeName: 'Gói giải pháp AI & Phần mềm',
      bookingVerb: 'Hẹn lịch Demo 1-1',
    },
    persona: `Tên bot: OmniTech Bot
Xưng hô: Em xưng hô với Anh/Chị / Quý doanh nghiệp
Phong cách: Chuyên nghiệp, am hiểu nghiệp vụ, súc tích, tư vấn giải pháp chuyển đổi số và AI thực chiến.`,
    guardrails: [
      'Không cam kết thời gian hoàn thành dự án dưới 2 tuần khi chưa khảo sát kỹ thuật.',
      'Không tiết lộ mã nguồn hoặc chính sách giá custom của khách hàng khác.',
    ],
    samplePrompts: [
      'Chi phí triển khai Chatbot AI đa kênh bao nhiêu?',
      'Hệ thống có tích hợp được CRM nội bộ không?',
      'Cho tôi đặt lịch hẹn demo phần mềm 1-1',
      'Số em là 0912345678',
    ],
    knowledgeBase: [
      {
        id: 'b2b-1',
        category: 'chi_phi',
        question: 'Chi phí triển khai Chatbot AI đa kênh bao nhiêu?',
        answer: 'Dạ gói giải pháp OmniChat AI triển khai tiêu chuẩn từ 15.000.000đ, bao gồm tích hợp Botcake (Facebook, Zalo cá nhân), Web widget và kết nối CRM quản lý Lead thông minh.',
        tags: ['chi_phi', 'báo_giá'],
        is_active: true,
      },
    ],
  },

  // PRESET 3: THẨM MỸ VIỆN & SPA
  spa_clinic: {
    id: 'spa_clinic',
    name: 'Thẩm mỹ viện, Spa & Phòng khám',
    tag: 'Làm đẹp & Sức khỏe',
    profile: {
      name: 'Aura Beauty & Spa',
      industry: 'Chăm sóc sắc đẹp & Trị liệu da',
      hotline: '0966 888 999',
      address: 'Quận 1, TP. Hồ Chí Minh',
      serviceTypeName: 'Gói liệu trình & Thẩm mỹ',
      bookingVerb: 'Đặt lịch soi da & tư vấn Bác sĩ',
    },
    persona: `Tên bot: Aura Spa Assistant
Xưng hô: Dạ em chào Chị yêu / Anh!
Phong cách: Ngọt ngào, ân cần, thấu hiểu, tư vấn liệu trình chăm sóc da chuẩn y khoa.`,
    guardrails: [
      'Không chẩn đoán bệnh lý da liễu nặng qua tin nhắn mà luôn mời đến thăm khám trực tiếp.',
      'Không hứa hẹn hết nám 100% chỉ sau 1 buổi điều trị.',
    ],
    samplePrompts: [
      'Liệu trình trị mụn bên mình giá bao nhiêu?',
      'Có được Bác sĩ da liễu khám trực tiếp không?',
      'Cho em đặt lịch soi da miễn phí',
      'Số em là 0988112233',
    ],
    knowledgeBase: [
      {
        id: 'spa-1',
        category: 'gia_lieu_trinh',
        question: 'Liệu trình trị mụn bên mình giá bao nhiêu?',
        answer: 'Dạ liệu trình phục hồi da mụn chuẩn y khoa tại Aura Spa có giá từ 490.000đ/buổi. Khách hàng mới được tặng 01 buổi soi da chuyên sâu 3D cùng Bác sĩ ạ!',
        tags: ['tri_mun', 'soi_da'],
        is_active: true,
      },
    ],
  },
};

// Cấu hình mặc định sử dụng Tiệc cưới & Sự kiện (Golden Palace Showcase)
export const DEFAULT_BOT_CONFIG: BotTrainingConfig = {
  businessProfile: INDUSTRY_PRESETS.wedding_event.profile,
  isMasterEnabled: true,
  masterStatusNote: 'Đang hoạt động trên toàn hệ thống',
  persona: INDUSTRY_PRESETS.wedding_event.persona,
  workingHours: {
    start: 8,
    end: 21,
  },
  outOfHoursMessage: 'Dạ hiện tại đã ngoài giờ làm việc. Em đã ghi nhận thông tin của Quý khách, bộ phận tư vấn sẽ liên hệ lại vào 8h30 sáng mai nhé!',
  channels: {
    facebook: { enabled: true, mode: 'bot' },
    zalo: { enabled: true, mode: 'bot' },
    web: { enabled: true, mode: 'draft' },
  },
  guardrails: INDUSTRY_PRESETS.wedding_event.guardrails,
  sampleTestPrompts: INDUSTRY_PRESETS.wedding_event.samplePrompts,
  telegramAlert: {
    enabled: false,
    botToken: '',
    chatId: '',
  },
};

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] =
  INDUSTRY_PRESETS.wedding_event.knowledgeBase;

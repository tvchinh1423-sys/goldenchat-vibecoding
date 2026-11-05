// lib/mock-service.ts
import { KnowledgeItem } from '@/types/database';

export interface BotTrainingConfig {
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
}

export const DEFAULT_BOT_CONFIG: BotTrainingConfig = {
  isMasterEnabled: true,
  masterStatusNote: 'Đang hoạt động trên toàn hệ thống',
  persona: `Tên bot: Kstudy Bot
Xưng hô: mình, gọi khách là bạn
Trả lời ngắn gọn. Không dùng emoji. Kết mỗi lượt bằng một câu hỏi mở.`,
  workingHours: {
    start: 8,
    end: 21,
  },
  outOfHoursMessage: 'Ngoài giờ tư vấn viên sẽ gọi lại vào 8h30 sáng mai nhé',
  channels: {
    facebook: { enabled: true, mode: 'bot' },
    zalo: { enabled: true, mode: 'bot' },
    web: { enabled: true, mode: 'draft' },
  },
  guardrails: [
    'Không tự ý cam kết mức giảm học phí vượt quá chính sách công bố của học viện.',
    'Không đưa ra cam kết 100% có việc làm nếu học viên không hoàn thành điều kiện đồ án.',
    'Khi khách hàng có nhu cầu khiếu nại hoặc hỏi ngoài phạm vi đào tạo -> Tự động chuyển máy cho tư vấn viên thật.',
  ],
  telegramAlert: {
    enabled: false,
    botToken: '',
    chatId: '',
  },
};

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb-1',
    category: 'hoc_phi',
    question: 'Học phí khóa Digital Marketing & AI (ENTD01) là bao nhiêu?',
    answer: 'Dạ học phí chuẩn khóa ENTD01 là 15.000.000đ. Đang có ưu đãi đăng ký sớm trong tháng giảm còn 12.500.000đ, hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng.',
    tags: ['hoc_phi', 'uu_dai', 'tra_gop'],
    is_active: true,
  },
  {
    id: 'kb-2',
    category: 'noi_dung_hoc',
    question: 'Khóa này học gì, học xong làm được gì?',
    answer: 'Khóa học đào tạo thực chiến 3 tháng: Xây dựng chiến lược Marketing đa kênh, ứng dụng AI (ChatGPT, Midjourney, Claude) tự động hóa sáng tạo nội dung, chạy quảng cáo Meta/Google/TikTok và phân tích dữ liệu kinh doanh.',
    tags: ['noi_dung', 'lo_trinh'],
    is_active: true,
  },
  {
    id: 'kb-3',
    category: 'chung_chi',
    question: 'Sau khi hoàn thành khóa học có được cấp chứng chỉ không?',
    answer: 'Dạ có ạ! Học viên hoàn thành đủ các bài thực hành và đồ án tốt nghiệp sẽ được Học viện Kstudy cấp Chứng nhận hoàn thành khóa học chuyên nghiệp, có giá trị công nhận trong mạng lưới đối tác tuyển dụng.',
    tags: ['chung_chi', 'tot_nghiep'],
    is_active: true,
  },
  {
    id: 'kb-4',
    category: 'lich_hoc',
    question: 'Thời gian và lịch khai giảng khóa gần nhất khi nào?',
    answer: 'Khóa ENTD01 gần nhất khai giảng vào ngày 15 hàng tháng. Lịch học linh hoạt gồm lớp Tối 2-4-6 (19h30 - 21h30) hoặc lớp Cuối tuần (Sáng/Chiều Thứ 7 & Chủ Nhật).',
    tags: ['lich_hoc', 'khai_giang'],
    is_active: true,
  },
  {
    id: 'kb-5',
    category: 'hoc_thu',
    question: 'Tôi có được học thử hoặc tham gia buổi định hướng trước không?',
    answer: 'Dạ hoàn toàn được ạ! Kstudy có 01 buổi học thử và định hướng lộ trình nghề nghiệp 1-1 miễn phí cùng Giảng viên chuyên gia. Bạn để lại SĐT để ban đào tạo xếp lịch nhé!',
    tags: ['hoc_thu', 'tu_van_1_1'],
    is_active: true,
  },
];

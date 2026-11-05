import type { LeadStage } from "@/types/database";

export const LEAD_STAGES: {
  id: LeadStage;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    id: "N1",
    title: "LEAD THÔ",
    description: "Mới hỏi thực đơn / sảnh",
    color: "bg-slate-100 text-slate-700",
  },
  {
    id: "N2",
    title: "TIỀM NĂNG",
    description: "Đã có ngày cưới / số bàn dự kiến",
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: "N3",
    title: "KHẢO SÁT 1-1",
    description: "Đã hẹn lịch xem sảnh & thử món",
    color: "bg-violet-50 text-violet-700",
  },
  {
    id: "N4",
    title: "CHÍNH THỨC",
    description: "Đã đặt cọc giữ sảnh / ký hợp đồng",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "N5",
    title: "NUÔI DƯỠNG",
    description: "Chăm sóc sau tiệc / upsell tiệc kỷ niệm",
    color: "bg-amber-50 text-amber-700",
  },
  {
    id: "N0",
    title: "ĐÃ MẤT",
    description: "Đổi kế hoạch / chọn nơi khác",
    color: "bg-rose-50 text-rose-700",
  },
];

export interface ShowcaseLead {
  id: string;
  name: string;
  stage: LeadStage;
  source: "Facebook" | "Zalo" | "Web";
  summary: string;
  eventDate?: string;
  tableCount?: number;
  appointment?: string;
}

/** Fictional records for preparing the funnel; no real booking or contract is created. */
export const DEMO_LEADS: ShowcaseLead[] = [
  {
    id: "menu",
    name: "Mai Huyền",
    stage: "N1",
    source: "Facebook",
    summary: "Mới hỏi thực đơn và các gói sảnh cưới.",
  },
  {
    id: "web-c83d",
    name: "Khách web C83D",
    stage: "N1",
    source: "Web",
    summary:
      "Hỏi sảnh 500 khách ngày 20/11; cần xác minh năm, buổi tiệc và lịch trống.",
  },
  {
    id: "trang",
    name: "Vũ Huyền Trang",
    stage: "N2",
    source: "Facebook",
    summary: "Dự kiến 35 bàn; hỏi ưu đãi và cọc, muốn hẹn xem sảnh cuối tuần.",
    tableCount: 35,
  },
  {
    id: "anh",
    name: "Hoàng Tú Anh",
    stage: "N3",
    source: "Zalo",
    summary: "Đã hẹn xem sảnh; trao đổi thực đơn và lịch thử món.",
    eventDate: "20/12/2026",
    tableCount: 40,
    appointment: "10:00 · 07/11/2026",
  },
  {
    id: "linh",
    name: "Trần Khánh Linh",
    stage: "N4",
    source: "Facebook",
    summary: "Hợp đồng và cọc đã được xác nhận trong kịch bản demo.",
    eventDate: "12/12/2026",
    tableCount: 50,
  },
  {
    id: "jasmine",
    name: "Jasmine Nguyen",
    stage: "N5",
    source: "Zalo",
    summary: "Chăm sóc sau tiệc; đã gửi dự toán cho dịp kỷ niệm tiếp theo.",
  },
  {
    id: "changed-plan",
    name: "Khách web A102",
    stage: "N0",
    source: "Web",
    summary:
      "Gia đình đổi kế hoạch tổ chức tiệc; lưu lại lý do để chăm sóc phù hợp.",
  },
];

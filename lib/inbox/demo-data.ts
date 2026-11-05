import data from "@/mock_data.json";
import type { Conversation, Message } from "./types";

export const knowledgeBase = data.knowledge_base;
export const business = data.business;

/** The handoff contains no conversations: these are explicit demo fixtures. */
export function createDemoConversations(): Conversation[] {
  const [trang, minh, anh] = data.sample_leads;
  const booking = data.sample_bookings[0];
  const messages = (
    id: string,
    entries: [Message["sender"], string, string][],
  ): Message[] =>
    entries.map(([sender, content, time], index) => ({
      id: `${id}-m${index}`,
      sender,
      content,
      createdAt: `2026-11-05T${time}:00+07:00`,
    }));
  const base = {
    aiEnabled: false,
    unread: 0,
    note: "",
    assignedTo: "me" as const,
  };
  return [
    {
      ...base,
      id: "trang",
      name: "Dũ Chanh",
      channel: "facebook",
      avatarColor: "peach",
      status: "pending",
      unread: 2,
      messages: messages("trang", [
        [
          "customer",
          "Em đang quan tâm khóa Digital Marketing & AI, cho em hỏi khóa này học những gì ạ?",
          "09:10",
        ],
        [
          "bot",
          knowledgeBase.find((faq) => faq.category === "noi_dung_hoc")!.answer,
          "09:10",
        ],
        [
          "customer",
          "Khóa học có cấp chứng chỉ khi hoàn thành không ạ?",
          "09:12",
        ],
        [
          "agent",
          knowledgeBase.find((faq) => faq.category === "chung_chi")!.answer,
          "09:14",
        ],
        [
          "agent",
          "Bạn cho Kstudy xin họ tên, SĐT và email để tư vấn viên hỗ trợ mình kỹ hơn nhé!",
          "09:15",
        ],
        [
          "customer",
          `${trang.full_name}\n${trang.email}\n${trang.phone}`,
          "13:29",
        ],
        [
          "customer",
          "Em muốn tìm hiểu thêm về học phí, trả góp và lịch học buổi tối ạ.",
          "13:30",
        ],
      ]),
    },
    {
      ...base,
      id: "huyen",
      name: "Huyền",
      channel: "facebook",
      avatarColor: "pink",
      status: "pending",
      unread: 1,
      assignedTo: "team",
      messages: messages("huyen", [
        ["customer", "Mình cảm ơn nha, để mình tham khảo thêm nhé!", "12:33"],
      ]),
    },
    {
      ...base,
      id: "anh",
      name: anh.full_name,
      channel: "zalo",
      avatarColor: "sage",
      status: "active",
      aiEnabled: true,
      booking: {
        appointmentTime: booking.appointment_time,
        staff: booking.assigned_staff,
        notes: booking.notes,
      },
      messages: messages("anh", [
        [
          "customer",
          "Em muốn đăng ký học thử và tư vấn định hướng chuyển ngành ạ.",
          "11:40",
        ],
        [
          "agent",
          "Kstudy đã ghi nhận lịch tư vấn của bạn vào 19:30 ngày 07/11/2026. Bạn cho mình xin số điện thoại để xác nhận nhé!",
          "11:42",
        ],
        [
          "customer",
          `Số em là ${anh.phone}, email ${anh.email}. Cảm ơn học viện ạ!`,
          "12:08",
        ],
      ]),
    },
    {
      ...base,
      id: "web-c83d",
      name: "Khách web C83D",
      channel: "web",
      avatarColor: "lavender",
      status: "active",
      assignedTo: "unassigned",
      aiEnabled: true,
      messages: messages("web-c83d", [
        ["customer", "Cho mình hỏi khóa ENTD01 có học online không?", "10:57"],
        [
          "bot",
          "Dạ em sẽ nhờ tư vấn viên kiểm tra hình thức học phù hợp. Bạn muốn học online hay trực tiếp tại Hà Nội ạ?",
          "10:58",
        ],
      ]),
    },
    {
      ...base,
      id: "tin",
      name: "Tiến Uy Tín",
      channel: "facebook",
      avatarColor: "sky",
      status: "pending",
      messages: messages("tin", [
        [
          "customer",
          "Mình muốn được tư vấn lộ trình học Marketing cho người mới bắt đầu.",
          "09:10",
        ],
      ]),
    },
    {
      ...base,
      id: "minh",
      name: minh.full_name,
      channel: "web",
      avatarColor: "sand",
      status: "pending",
      messages: messages("minh", [
        [
          "customer",
          `Chào Kstudy, mình là ${minh.full_name}. Mình muốn tìm hiểu khóa học cho nhân viên công ty, bên mình có xuất hóa đơn VAT không?`,
          "08:35",
        ],
        [
          "customer",
          `Liên hệ mình qua ${minh.phone} hoặc ${minh.email} nhé.`,
          "08:36",
        ],
      ]),
    },
    {
      ...base,
      id: "jasmine",
      name: "Jasmine Nguyen",
      channel: "zalo",
      avatarColor: "pink",
      status: "resolved",
      assignedTo: "team",
      messages: messages("jasmine", [
        ["customer", "Mình đã nhận được thông tin rồi, cảm ơn bạn!", "08:34"],
        [
          "agent",
          "Kstudy rất vui được hỗ trợ bạn. Hẹn gặp bạn tại học viện nhé!",
          "08:35",
        ],
      ]),
    },
    {
      ...base,
      id: "archived",
      name: "Khách web A102",
      channel: "web",
      avatarColor: "lavender",
      status: "archived",
      assignedTo: "unassigned",
      messages: messages("archived", [
        [
          "customer",
          "Mình sẽ liên hệ lại khi sắp xếp được thời gian học.",
          "08:00",
        ],
      ]),
    },
  ];
}

/** FAQ preview for Module 1, replace with the Module 2 service later. */
export function createFaqDraft(messages: Message[]) {
  const last =
    [...messages].reverse().find((message) => message.sender === "customer")
      ?.content ?? "";
  const text = last
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const intents: [string, RegExp][] = [
    ["hoc_phi", /hoc phi|tra gop|gia|bao nhieu|giam/],
    ["chung_chi", /chung chi|chung nhan/],
    ["hoc_thu", /hoc thu|dinh huong/],
    ["lich_hoc", /lich hoc|khai giang|buoi toi|cuoi tuan/],
    ["noi_dung_hoc", /hoc gi|hoc nhung|noi dung|marketing|lam duoc/],
  ];
  const matched = intents.find(([, pattern]) => pattern.test(text));
  const faq = knowledgeBase.find((entry) => entry.category === matched?.[0]);
  return faq
    ? `${faq.answer}\n\nBạn muốn Kstudy tư vấn thêm về lộ trình học phù hợp với mình không ạ?`
    : "Dạ Kstudy đã nhận được thông tin của bạn. Em sẽ chuyển tư vấn viên hỗ trợ chi tiết. Bạn muốn được tư vấn qua tin nhắn hay điện thoại ạ?";
}

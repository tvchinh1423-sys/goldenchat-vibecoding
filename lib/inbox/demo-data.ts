import { INDUSTRY_PRESETS } from "@/lib/mock-service";
import type { Conversation, Message } from "./types";

const showcase = INDUSTRY_PRESETS.wedding_event;
export const knowledgeBase = showcase.knowledgeBase;
export const business = showcase.profile;

/** Fictional showcase conversations using the shared industry preset. */
export function createDemoConversations(): Conversation[] {
  const trang = {
    full_name: "Vũ Huyền Trang",
    phone: "0339516196",
    email: "trang@example.com",
  };
  const minh = {
    full_name: "Nguyễn Nhật Minh",
    phone: "0988123456",
    email: "minh@example.com",
  };
  const anh = {
    full_name: "Hoàng Tú Anh",
    phone: "0912345789",
    email: "tuanh@example.com",
  };
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
        ["customer", "Thực đơn tiệc cưới bao nhiêu một bàn?", "09:10"],
        [
          "bot",
          knowledgeBase.find((faq) => faq.category === "thuc_don")!.answer,
          "09:10",
        ],
        [
          "customer",
          "Nhà em dự kiến khoảng 35 bàn. Bên mình có ưu đãi gì cho tiệc cưới không ạ?",
          "09:12",
        ],
        [
          "agent",
          knowledgeBase.find((faq) => faq.category === "uu_dai")!.answer,
          "09:14",
        ],
        [
          "agent",
          "Anh/chị cho Golden Palace xin họ tên và SĐT để tư vấn viên liên hệ sắp xếp lịch xem sảnh & thử món nhé!",
          "09:15",
        ],
        [
          "customer",
          `${trang.full_name}\n${trang.email}\n${trang.phone}`,
          "13:29",
        ],
        [
          "customer",
          "Em để lại số để hẹn xem sảnh và thử món cuối tuần. Cho em hỏi thêm: đặt cọc giữ sảnh bao nhiêu ạ?",
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
        [
          "customer",
          "Mình cảm ơn bảng thực đơn nhé! Để mình bàn thêm với gia đình rồi nhắn lại ngày tổ chức tiệc.",
          "12:33",
        ],
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
        appointmentTime: "2026-11-07T10:00:00+07:00",
        staff: "Chuyên viên tư vấn tiệc Golden Palace",
        notes:
          "Xem sảnh cho tiệc cưới khoảng 40 bàn; trao đổi thực đơn và sắp xếp buổi thử món.",
      },
      messages: messages("anh", [
        [
          "customer",
          "Cho tôi hẹn xem sảnh vào cuối tuần. Gia đình dự kiến tổ chức tiệc cưới ngày 20/12/2026, khoảng 40 bàn.",
          "11:40",
        ],
        [
          "agent",
          "Dạ em hẹn anh/chị đến xem sảnh lúc 10:00 thứ Bảy, ngày 07/11/2026. Mình sẽ cùng trao đổi thực đơn và lịch thử món khi gặp nhé. Anh/chị cho em xin SĐT để tiện đón tiếp ạ!",
          "11:42",
        ],
        [
          "customer",
          `Số em là ${anh.phone}, email ${anh.email}. Nhờ bên mình gọi xác nhận lịch xem sảnh giúp em nhé!`,
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
        [
          "customer",
          "Sảnh tiệc 500 khách còn trống ngày 20/11 không?",
          "10:57",
        ],
        [
          "bot",
          "Dạ Golden Palace có sảnh phù hợp quy mô 500 khách. Em cần nhờ quản lý kiểm tra lịch trống trước khi xác nhận ạ. Anh/chị dự kiến ngày 20/11 năm nào, tiệc trưa hay tối để em kiểm tra đúng lịch nhé?",
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
          "Nhà mình dự kiến 30 bàn vào tháng 12. Cho mình xin các gói thực đơn và ưu đãi trang trí tiệc cưới nhé.",
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
          `Chào Golden Palace, mình là ${minh.full_name}. Công ty mình cần tổ chức tiệc cuối năm khoảng 200 khách, bên mình có xuất hóa đơn VAT không?`,
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
        [
          "customer",
          "Mình đã nhận được dự toán tiệc kỷ niệm rồi, cảm ơn bạn!",
          "08:34",
        ],
        [
          "agent",
          "Golden Palace rất vui được đồng hành cùng gia đình mình. Khi chốt ngày tiệc kỷ niệm, anh/chị nhắn em để kiểm tra sảnh và thực đơn nhé!",
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
          "Gia đình mình đổi kế hoạch tổ chức tiệc rồi. Khi có dịp khác mình sẽ liên hệ lại nhé.",
          "08:00",
        ],
      ]),
    },
  ];
}

/** Local preview only; never confirms hall availability. */
export function createFaqDraft(messages: Message[]) {
  const last =
    [...messages].reverse().find((message) => message.sender === "customer")
      ?.content ?? "";
  const text = last
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
  if (/con trong|lich trong/.test(text))
    return "Dạ em cần nhờ quản lý kiểm tra lịch sảnh trước khi xác nhận. Anh/chị cho em xin ngày tổ chức (kèm năm), tiệc trưa hay tối và số khách dự kiến nhé!";
  const intents: [string, RegExp][] = [
    ["dat_coc", /dat coc|tien coc|giu sanh/],
    ["thuc_don", /thuc don|gia ban|mot ban|1 ban/],
    ["hen_xem_sanh", /xem sanh|thu mon|cuoi tuan|hen/],
    ["uu_dai", /uu dai|khuyen mai|trang tri/],
    ["sanh_tiec", /sanh|suc chua|khach/],
  ];
  const matched = intents.find(([, pattern]) => pattern.test(text));
  const faq = knowledgeBase.find((entry) => entry.category === matched?.[0]);
  return faq
    ? faq.answer
    : "Dạ Golden Palace đã nhận được thông tin. Em sẽ chuyển chuyên viên tư vấn tiệc hỗ trợ chi tiết. Anh/chị muốn được tư vấn qua tin nhắn hay điện thoại ạ?";
}

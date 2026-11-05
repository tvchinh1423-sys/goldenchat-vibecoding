import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_KNOWLEDGE_BASE } from "@/lib/mock-service";

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      channel = "zalo",
      isWorkingHours = true,
      persona = "",
      outOfHoursMessage = "Dạ hiện tại đã ngoài giờ làm việc. Em đã ghi nhận thông tin, tư vấn viên sẽ gọi lại vào 8h30 sáng mai nhé!",
      guardrails = [],
      knowledgeBase = DEFAULT_KNOWLEDGE_BASE,
      businessProfile,
    } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Tin nhắn trống" }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    const lower = trimmedMsg.toLowerCase();
    const brandName = businessProfile?.name || "Golden Palace";

    // 1. Chế độ ngoài giờ
    if (!isWorkingHours) {
      return NextResponse.json({
        success: true,
        reply: outOfHoursMessage,
        triggeredRule: "out_of_hours",
      });
    }

    // 2. Guardrails (Bộ quy tắc an toàn)
    // - Khách đòi giảm giá quá mức (giảm 20%, 30%, 50%)
    if (
      lower.includes("giảm 30%") ||
      lower.includes("giam 30%") ||
      lower.includes("giảm 50%") ||
      lower.includes("giam 50%") ||
      lower.includes("hứa giảm 30%")
    ) {
      return NextResponse.json({
        success: true,
        reply: `Dạ ${brandName} xin phép làm rõ ạ: Trung tâm hiện áp dụng chính sách ưu đãi tặng trọn gói trang trí hoa tươi, MC vũ đoàn và tặng bàn tiệc theo số lượng thực tế, không có chính sách chiết khấu tiền mặt 30% trên thực đơn ạ. Anh/Chị cho em xin số lượng bàn dự kiến để em gửi bảng dự toán tối ưu nhất nhé!`,
        triggeredRule: "guardrail_pricing_violation",
        guardrailWarning: "Phát hiện câu hỏi vượt quá hạn mức ưu đãi giá của trung tâm!",
      });
    }

    // - Giữ sảnh mà chưa cọc
    if (lower.includes("giữ sảnh giúp tôi không cần cọc") || lower.includes("giu sanh khong coc")) {
      return NextResponse.json({
        success: true,
        reply: `Dạ để đảm bảo quyền lợi và tính bảo mật ngày đẹp cho anh/chị, ${brandName} chỉ giữ sảnh chính thức sau khi nhận cọc đợt 1 ạ. Anh/Chị có thể ghé trực tiếp xem sảnh để ưng ý trước khi hoàn tất thủ tục nhé!`,
        triggeredRule: "guardrail_hold_room_without_deposit",
      });
    }

    // - Khách so sánh đối thủ rẻ hơn
    if (lower.includes("bên kia rẻ hơn") || lower.includes("ben kia re hon") || lower.includes("bên khác rẻ hơn")) {
      return NextResponse.json({
        success: true,
        reply: `Dạ ${brandName} rất thấu hiểu sự cân nhắc ngân sách của Quý khách! Điểm nổi bật tại trung tâm là hệ thống đại sảnh trần cao không cột, màn hình LED 4K tiêu chuẩn quốc tế và thực đơn 100% nguyên liệu tươi cao cấp kèm nước uống suốt tiệc. Em mời anh/chị ghé xem sảnh thực tế để cảm nhận không gian và dịch vụ chuẩn 4 sao nhé!`,
        triggeredRule: "guardrail_competitor_comparison",
      });
    }

    // 3. Nhận diện SĐT để tự động bóc tách Lead
    const phoneRegex = /(0[3|5|7|8|9][0-9]{8})\b/;
    const phoneMatch = trimmedMsg.match(phoneRegex);
    if (phoneMatch) {
      return NextResponse.json({
        success: true,
        reply: `Dạ ${brandName} đã ghi nhận số điện thoại ${phoneMatch[0]} của Quý khách. Chuyên viên quản lý tiệc sẽ liên hệ gửi menu chi tiết và xếp lịch đón tiếp Quý khách chu đáo nhất ạ!`,
        leadExtracted: {
          phone: phoneMatch[0],
          status: "N1_LEAD_THO",
          service: businessProfile?.serviceTypeName || "Gói tiệc & Sảnh cưới",
        },
      });
    }

    // 4. Khách hẹn lịch xem sảnh / thử món / trải nghiệm dịch vụ
    if (
      lower.includes("xem sảnh") ||
      lower.includes("xem sanh") ||
      lower.includes("thử món") ||
      lower.includes("thu mon") ||
      lower.includes("cuối tuần") ||
      lower.includes("hẹn")
    ) {
      return NextResponse.json({
        success: true,
        reply: `Dạ ${brandName} đón khách tham quan sảnh và thử món từ 8:00 đến 10:30 sáng hằng ngày tại 98 Đông A, TP. Nam Định. Để ban quản lý chuẩn bị phòng tiếp đón và chuyên viên tư vấn riêng, Quý khách cho em xin Tên và Số điện thoại nhé!`,
        appointmentIntent: true,
        suggestedQuestions: [
          "Địa chỉ nhà hàng ở đâu?",
          "Hotline liên hệ trực tiếp",
          "Cho tôi xem ảnh không gian sảnh tiệc",
        ],
      });
    }

    // 5. Kiểm tra các câu hỏi thực tế về Địa chỉ, Hình ảnh, Website, Hotline, Giờ đón khách
    // 5.1. Hình ảnh không gian sảnh tiệc
    if (
      lower.includes("không gian") ||
      lower.includes("khong gian") ||
      lower.includes("hình ảnh") ||
      lower.includes("hinh anh") ||
      lower.includes("xem ảnh") ||
      lower.includes("xem anh") ||
      lower.includes("ảnh sảnh")
    ) {
      return NextResponse.json({
        success: true,
        reply: `Dạ kính mời Quý khách tham khảo toàn bộ hình ảnh thực tế không gian các đại sảnh tiệc cưới tráng lệ tại đây: https://goldenpalacenamdinh.com/khong-gian . Anh/chị đang dự kiến tiệc bao nhiêu bàn để em tư vấn sảnh phù hợp nhất ạ?`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Địa chỉ nhà hàng ở đâu?",
          "Nhà hàng đón khách lúc mấy giờ?",
        ],
      });
    }

    // 5.2. Địa chỉ, vị trí, Google Maps, chỉ đường
    if (
      lower.includes("địa chỉ") ||
      lower.includes("dia chi") ||
      lower.includes("ở đâu") ||
      lower.includes("o dau") ||
      lower.includes("chỉ đường") ||
      lower.includes("chi duong") ||
      lower.includes("bản đồ") ||
      lower.includes("maps")
    ) {
      return NextResponse.json({
        success: true,
        reply: `Dạ địa chỉ của Golden Palace tại: 98 Đông A, KĐT Hòa Vượng, TP. Nam Định. Quý khách có thể xem vị trí và đường đi thuận tiện trên Google Maps tại đây: https://maps.app.goo.gl/GrYDqNTLNmqQ1nH76?g_st=ic ạ! Nhà hàng đón khách từ 8:00 - 10:30 sáng, Quý khách dự kiến ghé qua hôm nào ạ?`,
        suggestedQuestions: [
          "Nhà hàng đón khách lúc mấy giờ?",
          "Hotline liên hệ trực tiếp",
          "Xem thông tin tiệc và brochure ở đâu?",
        ],
      });
    }

    // 5.3. Thông tin tiệc, Brochure, Website
    if (
      lower.includes("thông tin tiệc") ||
      lower.includes("thong tin tiec") ||
      lower.includes("website") ||
      lower.includes("brochure") ||
      lower.includes("tài liệu") ||
      lower.includes("link")
    ) {
      return NextResponse.json({
        success: true,
        reply: `Dạ Quý khách có thể tham khảo trọn bộ thông tin tiệc cưới tại Website: https://goldenpalacenamdinh.com hoặc xem nhanh tài liệu tổng quan tại: https://tinyurl.com/thongtintieccuoi ạ! Anh/Chị cần em tư vấn thêm phần nào không ạ?`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Ưu đãi mùa cưới hiện nay có gì?",
          "Cho tôi xem ảnh không gian sảnh tiệc",
        ],
      });
    }

    // 5.4. Hotline, Số điện thoại liên hệ
    if (
      lower.includes("hotline") ||
      lower.includes("số điện thoại") ||
      lower.includes("so dien thoai") ||
      lower.includes("sđt") ||
      lower.includes("sdt") ||
      lower.includes("liên hệ") ||
      lower.includes("lien he") ||
      lower.includes("gọi")
    ) {
      return NextResponse.json({
        success: true,
        reply: `Dạ Quý khách có thể liên hệ trực tiếp qua Hotline: 0228 6595 959 hoặc truy cập website https://goldenpalacenamdinh.com. Đội ngũ quản lý tiệc Golden Palace luôn sẵn sàng giải đáp 24/7 ạ!`,
        suggestedQuestions: [
          "Địa chỉ nhà hàng ở đâu?",
          "Nhà hàng đón khách lúc mấy giờ?",
          "Cho tôi hẹn xem sảnh vào cuối tuần",
        ],
      });
    }

    // 5.5. Giờ đón khách, giờ mở cửa
    if (
      lower.includes("đón khách") ||
      lower.includes("don khach") ||
      lower.includes("mấy giờ") ||
      lower.includes("may gio") ||
      lower.includes("giờ mở cửa") ||
      lower.includes("gio mo cua") ||
      lower.includes("khung giờ")
    ) {
      return NextResponse.json({
        success: true,
        reply: `Dạ Golden Palace đón khách tham quan, tư vấn và thử món từ 8:00 đến 10:30 sáng hằng ngày. Quý khách muốn đặt lịch vào ngày nào để bên em chuẩn bị bàn trà tiếp đón riêng chu đáo nhất ạ?`,
        suggestedQuestions: [
          "Cho tôi hẹn xem sảnh vào cuối tuần",
          "Địa chỉ nhà hàng ở đâu?",
          "Cho tôi xem ảnh không gian sảnh tiệc",
        ],
      });
    }

    // 6. Đối chiếu tri thức FAQ (Knowledge Base)
    for (const item of knowledgeBase) {
      const qLower = item.question.toLowerCase();
      const aText = item.answer;

      // Thực đơn / Giá bàn
      if (
        lower.includes("thực đơn") ||
        lower.includes("thuc don") ||
        lower.includes("bao nhiêu một bàn") ||
        lower.includes("bn 1 ban") ||
        lower.includes("giá bàn")
      ) {
        if (item.category === "thuc_don" || qLower.includes("thực đơn") || qLower.includes("bàn")) {
          return NextResponse.json({
            success: true,
            reply: aText,
            suggestedQuestions: [
              "Ưu đãi mùa cưới hiện nay có gì?",
              "Sảnh tiệc bên mình chứa được bao nhiêu khách?",
              "Cho tôi hẹn xem sảnh vào cuối tuần",
            ],
          });
        }
      }

      // Sảnh tiệc / Sức chứa
      if (
        lower.includes("sảnh") ||
        lower.includes("sanh") ||
        lower.includes("sức chứa") ||
        lower.includes("bao nhiêu khách") ||
        lower.includes("khách")
      ) {
        if (item.category === "sanh_tiec" || qLower.includes("sảnh") || qLower.includes("khách")) {
          return NextResponse.json({
            success: true,
            reply: aText,
            suggestedQuestions: [
              "Cho tôi xem ảnh không gian sảnh tiệc",
              "Thực đơn tiệc cưới bao nhiêu một bàn?",
              "Cho tôi hẹn xem sảnh vào cuối tuần",
            ],
          });
        }
      }

      // Ưu đãi / Khuyến mãi
      if (
        lower.includes("ưu đãi") ||
        lower.includes("uu dai") ||
        lower.includes("khuyến mãi") ||
        lower.includes("giảm giá")
      ) {
        if (item.category === "uu_dai" || qLower.includes("ưu đãi")) {
          return NextResponse.json({
            success: true,
            reply: aText,
            suggestedQuestions: [
              "Thực đơn tiệc cưới bao nhiêu một bàn?",
              "Đặt cọc giữ sảnh bao nhiêu?",
              "Cho tôi hẹn xem sảnh vào cuối tuần",
            ],
          });
        }
      }

      // Đặt cọc
      if (lower.includes("cọc") || lower.includes("coc") || lower.includes("đặt cọc")) {
        if (item.category === "dat_coc" || qLower.includes("cọc")) {
          return NextResponse.json({
            success: true,
            reply: aText,
            suggestedQuestions: [
              "Thực đơn tiệc cưới bao nhiêu một bàn?",
              "Địa chỉ nhà hàng ở đâu?",
              "Cho tôi hẹn xem sảnh vào cuối tuần",
            ],
          });
        }
      }

      // Trang trí
      if (lower.includes("trang trí") || lower.includes("trang tri") || lower.includes("hoa tươi")) {
        return NextResponse.json({
          success: true,
          reply: `Dạ ${brandName} cung cấp dịch vụ trang trí sảnh cưới trọn gói từ hoa tươi nhập khẩu, backdrop chụp ảnh, bàn gallery, lối đi sân khấu và hệ thống ánh sáng lung linh. Đặc biệt đang có gói tặng 100% trang trí tiêu chuẩn cho tiệc cưới mùa này ạ!`,
          suggestedQuestions: [
            "Cho tôi xem ảnh không gian sảnh tiệc",
            "Ưu đãi mùa cưới hiện nay có gì?",
            "Cho tôi hẹn xem sảnh vào cuối tuần",
          ],
        });
      }
    }

    // 7. Trả lời mặc định theo Persona
    return NextResponse.json({
      success: true,
      reply: `Dạ em là trợ lý tư vấn tại ${brandName}! Quý khách đang quan tâm đến tiệc cưới, hội nghị công ty hay cần tư vấn thực đơn và xem sảnh trực tiếp ạ?`,
      suggestedQuestions: [
        "Thực đơn tiệc cưới bao nhiêu một bàn?",
        "Cho tôi xem ảnh không gian sảnh tiệc",
        "Địa chỉ nhà hàng ở đâu?",
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

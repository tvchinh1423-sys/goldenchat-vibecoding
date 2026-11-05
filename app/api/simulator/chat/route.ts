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
        reply: `Dạ ${brandName} rất hân hạnh được đón tiếp Quý khách vào cuối tuần này ạ! Để ban quản lý chuẩn bị phòng tiếp đón và chuyên viên tư vấn riêng, Quý khách cho em xin Tên và Số điện thoại nhé!`,
        appointmentIntent: true,
      });
    }

    // 5. Đối chiếu tri thức FAQ (Knowledge Base)
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
          return NextResponse.json({ success: true, reply: aText });
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
          return NextResponse.json({ success: true, reply: aText });
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
          return NextResponse.json({ success: true, reply: aText });
        }
      }

      // Đặt cọc
      if (lower.includes("cọc") || lower.includes("coc") || lower.includes("đặt cọc")) {
        if (item.category === "dat_coc" || qLower.includes("cọc")) {
          return NextResponse.json({ success: true, reply: aText });
        }
      }

      // Trang trí
      if (lower.includes("trang trí") || lower.includes("trang tri") || lower.includes("hoa tươi")) {
        return NextResponse.json({
          success: true,
          reply: `Dạ ${brandName} cung cấp dịch vụ trang trí sảnh cưới trọn gói từ hoa tươi nhập khẩu, backdrop chụp ảnh, bàn gallery, lối đi sân khấu và hệ thống ánh sáng lung linh. Đặc biệt đang có gói tặng 100% trang trí tiêu chuẩn cho tiệc cưới mùa này ạ!`,
        });
      }
    }

    // 6. Trả lời mặc định theo Persona
    return NextResponse.json({
      success: true,
      reply: `Dạ em là trợ lý tư vấn tại ${brandName}! Quý khách đang quan tâm đến tiệc cưới, hội nghị công ty hay cần tư vấn thực đơn và xem sảnh trực tiếp ạ?`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

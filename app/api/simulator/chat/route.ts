import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_KNOWLEDGE_BASE } from "@/lib/mock-service";

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      channel = "zalo",
      isWorkingHours = true,
      persona = "",
      outOfHoursMessage = "Ngoài giờ tư vấn viên sẽ gọi lại vào 8h30 sáng mai nhé",
      guardrails = [],
      knowledgeBase = DEFAULT_KNOWLEDGE_BASE,
    } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Tin nhắn trống" }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    const lower = trimmedMsg.toLowerCase();

    // 1. Nếu ngoài giờ
    if (!isWorkingHours) {
      return NextResponse.json({
        success: true,
        reply: outOfHoursMessage,
        triggeredRule: "out_of_hours",
      });
    }

    // 2. Kiểm tra Guardrails (Bộ nguyên tắc an toàn)
    // - Cấm hứa hẹn giảm giá sai (ví dụ đòi giảm 50%)
    if (
      lower.includes("giảm 50%") ||
      lower.includes("giam 50%") ||
      lower.includes("miễn phí 100%") ||
      lower.includes("xác nhận đi")
    ) {
      return NextResponse.json({
        success: true,
        reply:
          "Dạ Kstudy hiện áp dụng chính sách ưu đãi giảm học phí chuẩn từ 15.000.000đ xuống 12.500.000đ khi đăng ký sớm trong tháng. Học viện không có chính sách giảm 50% ạ. Bạn có muốn em bảo lưu mức ưu đãi 12.500.000đ này không ạ?",
        triggeredRule: "guardrail_pricing_violation",
        guardrailWarning: "Phát hiện câu hỏi vượt quá chính sách giảm giá!",
      });
    }

    // - Khách so sánh bên khác rẻ hơn
    if (lower.includes("bên kia rẻ hơn") || lower.includes("ben kia re hon")) {
      return NextResponse.json({
        success: true,
        reply:
          "Dạ Kstudy hiểu sự cân nhắc của bạn! Khóa ENTD01 nổi bật với 100% thời lượng thực hành đồ án thực tế và đào tạo ứng dụng AI tự động hóa Marketing độc quyền. Ngoài ra Kstudy có chính sách học thử 1-1 miễn phí để bạn trải nghiệm chất lượng trước khi quyết định nhé!",
        triggeredRule: "guardrail_competitor_comparison",
      });
    }

    // - Hỏi việc làm / học tới đâu
    if (lower.includes("con tôi học tới đâu") || lower.includes("con toi hoc toi dau")) {
      return NextResponse.json({
        success: true,
        reply:
          "Dạ vấn đề tiến độ học tập của học viên cần được tra cứu từ hệ thống quản lý học tập. Em xin phép chuyển thông tin cho Cố vấn học tập Kstudy liên hệ hỗ trợ phụ huynh ngay ạ!",
        triggeredRule: "handover_to_human",
      });
    }

    // 3. Nhận diện SĐT để kích hoạt bóc tách lead
    const phoneRegex = /(0[3|5|7|8|9][0-9]{8})\b/;
    const phoneMatch = trimmedMsg.match(phoneRegex);
    if (phoneMatch) {
      return NextResponse.json({
        success: true,
        reply: `Dạ em đã ghi nhận số điện thoại ${phoneMatch[0]} của bạn. Bộ phận đào tạo Kstudy sẽ liên hệ gửi tài liệu chi tiết và xếp lịch học thử 1-1 cho bạn ngay nhé!`,
        leadExtracted: {
          phone: phoneMatch[0],
          status: "N1_LEAD_THO",
        },
      });
    }

    // 4. Đối chiếu tri thức FAQ
    for (const item of knowledgeBase) {
      const qLower = item.question.toLowerCase();
      // Khớp chính xác hoặc khớp từ khóa quan trọng
      if (
        lower.includes("học phí") || lower.includes("hoc phi") || lower.includes("bao nhiêu") || lower.includes("hoc fi")
      ) {
        if (qLower.includes("học phí") || item.category === "hoc_phi") {
          return NextResponse.json({ success: true, reply: item.answer });
        }
      }

      if (lower.includes("học gì") || lower.includes("làm được gì") || lower.includes("nội dung")) {
        if (qLower.includes("học gì") || item.category === "noi_dung_hoc") {
          return NextResponse.json({ success: true, reply: item.answer });
        }
      }

      if (lower.includes("khai giảng") || lower.includes("lịch học") || lower.includes("khi nào")) {
        if (qLower.includes("khai giảng") || item.category === "lich_hoc") {
          return NextResponse.json({ success: true, reply: item.answer });
        }
      }

      if (lower.includes("giảm giá") || lower.includes("ưu đãi")) {
        if (qLower.includes("học phí") || item.category === "hoc_phi") {
          return NextResponse.json({ success: true, reply: item.answer });
        }
      }

      if (lower.includes("trả góp") || lower.includes("tra gop")) {
        return NextResponse.json({
          success: true,
          reply:
            "Dạ Kstudy có hỗ trợ trả góp học phí 0% lãi suất linh hoạt qua thẻ tín dụng từ 3 đến 12 tháng giúp bạn an tâm học tập ạ!",
        });
      }

      if (lower.includes("chứng chỉ") || lower.includes("chung chi")) {
        if (qLower.includes("chứng chỉ") || item.category === "chung_chi") {
          return NextResponse.json({ success: true, reply: item.answer });
        }
      }

      if (lower.includes("học thử") || lower.includes("hoc thu")) {
        if (qLower.includes("học thử") || item.category === "hoc_thu") {
          return NextResponse.json({ success: true, reply: item.answer });
        }
      }
    }

    // 5. Trả lời mặc định theo Persona
    return NextResponse.json({
      success: true,
      reply:
        "Dạ em là Kstudy Bot! Bạn đang quan tâm đến khóa học Digital Marketing & AI thực chiến hay cần đăng ký buổi học thử và định hướng nghề nghiệp 1-1 miễn phí ạ?",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { suggestedQuestions, visitIntent } from "@/lib/chat/follow-ups";
import { DEFAULT_KNOWLEDGE_BASE } from "@/lib/mock-service";
import { extractBookingDetails, type BookingDraftInfo } from "@/lib/chat/booking-extractor";

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
      bookingDraftContext,
    } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Tin nhắn trống" }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    const lower = trimmedMsg.toLowerCase();
    const brandName = businessProfile?.name || "Golden Palace";

    const respond = <T extends { success: true; suggestedQuestions?: string[] }>(data: T) =>
      NextResponse.json({
        ...data,
        suggestedQuestions: suggestedQuestions(trimmedMsg, /golden palace/i.test(brandName), data.suggestedQuestions),
      });

    // 1. Chế độ ngoài giờ
    if (!isWorkingHours) {
      return respond({
        success: true,
        reply: outOfHoursMessage,
        triggeredRule: "out_of_hours",
      });
    }

    // 2.2. Chào hỏi thân thiện (Ngắn gọn, không lặp lại câu giới thiệu 'em là trợ lý tư vấn')
    if (
      lower === "chào" ||
      lower === "chao" ||
      lower === "hi" ||
      lower === "hello" ||
      lower === "alo" ||
      lower === "ad" ||
      lower === "ad ơi" ||
      lower.startsWith("chào") ||
      lower.startsWith("chao") ||
      lower.startsWith("xin chào")
    ) {
      return respond({
        success: true,
        reply: `Dạ chào Quý khách! Quý khách cần thông tin cụ thể về thực đơn, giá bàn, hình ảnh sảnh tiệc hay đặt lịch ghé xem trực tiếp tại 98 Đông A ạ?`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Cho tôi xem ảnh không gian sảnh tiệc",
          "Địa chỉ nhà hàng ở đâu?",
        ],
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
      return respond({
        success: true,
        reply: `Dạ ${brandName} xin phép làm rõ ạ: Nhà hàng áp dụng các gói ưu đãi theo chính sách hiện hành của trung tâm và không có chính sách chiết khấu tiền mặt 30% trên thực đơn. Quý khách vui lòng liên hệ Hotline 0228 6595 959 hoặc để lại số lượng bàn dự kiến để chuyên viên gửi thông tin chi tiết nhất nhé!`,
        triggeredRule: "guardrail_pricing_violation",
        guardrailWarning: "Phát hiện câu hỏi vượt quá hạn mức ưu đãi giá của trung tâm!",
      });
    }

    // - Giữ sảnh mà chưa cọc
    if (lower.includes("giữ sảnh giúp tôi không cần cọc") || lower.includes("giu sanh khong coc")) {
      return respond({
        success: true,
        reply: `Dạ để đảm bảo quyền lợi và tính bảo mật ngày đẹp cho Quý khách, ${brandName} chỉ giữ sảnh chính thức sau khi hoàn tất thủ tục đặt cọc và hợp đồng. Quý khách có thể ghé trực tiếp 98 Đông A xem sảnh hoặc liên hệ Hotline 0228 6595 959 để được hỗ trợ chu đáo nhé!`,
        triggeredRule: "guardrail_hold_room_without_deposit",
      });
    }

    // - Khách so sánh đối thủ rẻ hơn
    if (lower.includes("bên kia rẻ hơn") || lower.includes("ben kia re hon") || lower.includes("bên khác rẻ hơn")) {
      return respond({
        success: true,
        reply: `Dạ ${brandName} rất thấu hiểu sự cân nhắc ngân sách của Quý khách! Điểm nổi bật tại GOLDEN PALACE là không gian sảnh tiệc sang trọng, dịch vụ chuyên nghiệp và chất lượng món ăn được chăm chút kỹ lưỡng. Quý khách có thể xem hình ảnh tại https://goldenpalacenamdinh.com/khong-gian hoặc ghé trực tiếp 98 Đông A để trải nghiệm thực tế nhé!`,
        triggeredRule: "guardrail_competitor_comparison",
      });
    }

    // 3. Phân tích chi tiết Đặt lịch thông minh (NLP Smart Booking Extraction)
    const bookingDetails = extractBookingDetails(trimmedMsg, bookingDraftContext);
    const hasBookingKeywords =
      Boolean(visitIntent(trimmedMsg)) ||
      /\b(đặt lịch|dat lich|muốn đặt|đặt hẹn|dat hen|hẹn lịch|hen lich|hẹn|xem sảnh|thử món|qua xem|ghé xem|đến xem|tư vấn trực tiếp|tư vấn)\b/i.test(lower);

    // Tiếp nối nếu trước đó đang có booking draft chờ bổ sung SĐT hoặc Tên
    const isContinuingDraft = Boolean(
      bookingDraftContext &&
      (bookingDraftContext.fullName || bookingDraftContext.dateTimeIso) &&
      (bookingDetails.phone || bookingDetails.fullName)
    );

    const isDepositQuestion = /\b(cọc|coc|giữ sảnh|giu sanh)\b/i.test(lower) && !/\b(lịch|hẹn|booking|qua xem|đến xem)\b/i.test(lower);

    if ((hasBookingKeywords || isContinuingDraft) && !isDepositQuestion) {
      // 3.1. ĐÃ ĐẦY ĐỦ THÔNG TIN (Tên + SĐT + Ngày Giờ) -> TỰ ĐỘNG CHỐT LỊCH HẸN
      if (bookingDetails.isComplete) {
        return respond({
          success: true,
          reply: `✅ Đã xác nhận lịch hẹn ${bookingDetails.eventTypeName.toLowerCase()} cho Quý khách ${bookingDetails.fullName} vào ${bookingDetails.timeStr} ngày ${bookingDetails.dateStr} tại 98 Đông A. Nhà hàng sẽ liên hệ qua số ${bookingDetails.phone} để đón tiếp chu đáo ạ!`,
          appointmentIntent: true,
          autoBooked: true,
          bookingDraft: bookingDetails,
          visitType: bookingDetails.eventType,
          suggestedQuestions: [
            "Xem menu thực đơn tiệc cưới",
            "Mở chỉ đường Google Maps",
            "Hotline hỗ trợ: 0228 6595 959",
          ],
        });
      }

      // 3.2. ĐÃ CÓ TÊN & NGÀY GIỜ, THIẾU SĐT (Ví dụ: "chị muốn đặt lịch tư vấn trực tiếp ngày 9/11 lúc 10h , c tên vân")
      if (bookingDetails.fullName && bookingDetails.dateTimeIso && !bookingDetails.phone) {
        return respond({
          success: true,
          reply: `Dạ em đã ghi nhận lịch của chị ${bookingDetails.fullName} vào ${bookingDetails.timeStr} ngày ${bookingDetails.dateStr}. Chị cho em xin Số điện thoại để chốt lịch nhé ạ!`,
          appointmentIntent: true,
          autoBooked: false,
          bookingDraft: bookingDetails,
          visitType: bookingDetails.eventType,
          promptFor: "phone",
          suggestedQuestions: [
            "Số điện thoại của em là: 0912 345 678",
            "Đổi thời gian khác",
            "Hotline tư vấn: 0228 6595 959",
          ],
        });
      }

      // 3.3. ĐÃ CÓ NGÀY GIỜ NHƯNG THIẾU TÊN VÀ SĐT (Ví dụ: "mai tôi qua xem sảnh lúc 10h")
      if (bookingDetails.dateTimeIso && (!bookingDetails.fullName || !bookingDetails.phone)) {
        return respond({
          success: true,
          reply: `Dạ em đã ghi nhận lịch hẹn lúc ${bookingDetails.timeStr} ngày ${bookingDetails.dateStr}. Anh/chị cho em xin Tên và Số điện thoại để hoàn tất phiếu hẹn nhé ạ!`,
          appointmentIntent: true,
          autoBooked: false,
          bookingDraft: bookingDetails,
          visitType: bookingDetails.eventType,
          promptFor: !bookingDetails.fullName ? "fullName" : "phone",
          suggestedQuestions: [
            "Tôi tên Dũng, SĐT 0987654321",
            "Đổi sang giờ khác",
            "Hotline hỗ trợ",
          ],
        });
      }

      // 3.4. CHỈ NÓI ĐẶT LỊCH CHUNG CHUNG (Ví dụ: "chị muốn đặt lịch xem sảnh" - Chưa có cả thời gian lẫn tên/SĐT)
      return respond({
        success: true,
        reply: `Dạ chị muốn ghé xem sảnh vào ngày giờ nào (nhà hàng đón tiếp 8:00 đến 10:30 sáng), và em xin Tên cùng Số điện thoại của chị nhé ạ?`,
        appointmentIntent: true,
        autoBooked: false,
        bookingDraft: null, // KHÔNG BỊA THỜI GIAN ẢO!
        visitType: bookingDetails.eventType,
        suggestedQuestions: [
          "Mai tôi qua lúc 9h sáng",
          "Tôi muốn hẹn thử món cuối tuần",
          "Hotline liên hệ trực tiếp",
        ],
      });
    }

    // 4. Nhận diện SĐT để tự động bóc tách Lead độc lập (khi không trong luồng đặt lịch)
    const phoneRegex = /(0[3|5|7|8|9][0-9]{8})\b/;
    const phoneMatch = trimmedMsg.match(phoneRegex);
    if (phoneMatch) {
      return respond({
        success: true,
        reply: `Dạ ${brandName} đã ghi nhận số điện thoại ${phoneMatch[0]} của Quý khách. Chuyên viên quản lý tiệc sẽ liên hệ gửi menu chi tiết và xếp lịch đón tiếp Quý khách chu đáo nhất ạ!`,
        leadExtracted: {
          phone: phoneMatch[0],
          status: "N1_LEAD_THO",
          service: businessProfile?.serviceTypeName || "Gói tiệc & Sảnh cưới",
        },
      });
    }

    // 5. Kiểm tra các câu hỏi thực tế theo BỘ TRI THỨC GOLDEN PALACE (Phiên bản v1.2)
    // 5.1. Dịch vụ Photobooth (máy chụp ảnh in lấy ngay - BÁO GIÁ TRỰC TIẾP)
    if (
      lower.includes("photobooth") ||
      lower.includes("photo booth") ||
      lower.includes("chụp ảnh lấy ngay") ||
      lower.includes("in ảnh lấy ngay") ||
      lower.includes("máy chụp ảnh")
    ) {
      return respond({
        success: true,
        reply: `Dạ bảng giá máy chụp ảnh Photobooth in ảnh lấy ngay tại sảnh gồm 3 gói:\n• Gói 1.5h: 3.400.000 VNĐ (in 200 ảnh nhỏ / 100 ảnh to)\n• Gói 2h: 4.000.000 VNĐ (in không giới hạn)\n• Gói 3h: 5.000.000 VNĐ (in không giới hạn)\nCác gói đều đã gồm kỹ thuật viên trực máy, file gốc và phụ kiện check-in ạ!`,
        suggestedQuestions: [
          "Thuê MC, ca sĩ và ban nhạc giá bao nhiêu?",
          "Nghi thức rót gạo, laser và flycam trao nhẫn giá bao nhiêu?",
          "Lập dự toán chi phí tiệc cưới trọn gói",
        ],
      });
    }

    // 5.2. Nhân sự biểu diễn & Ban nhạc (MC, Ca sĩ, Keyboard, Saxophone, Tứ tấu - BÁO GIÁ TRỰC TIẾP)
    if (
      lower.includes("mc") ||
      lower.includes("người dẫn chương trình") ||
      lower.includes("ca sĩ") ||
      lower.includes("ca si") ||
      lower.includes("ban nhạc") ||
      lower.includes("ban nhac") ||
      lower.includes("saxophone") ||
      lower.includes("tứ tấu") ||
      lower.includes("tu tau") ||
      lower.includes("keyboard") ||
      lower.includes("organ") ||
      lower.includes("thiên thần")
    ) {
      return respond({
        success: true,
        reply: `Dạ bảng giá nhân sự biểu diễn niêm yết tại Golden Palace:\n• MC tiệc cưới chuyên nghiệp: 800.000 VNĐ / người\n• Ca sĩ biểu diễn (3 bài): 800.000 VNĐ / ca sĩ\n• Nhạc công Keyboard: 800.000 VNĐ / người\n• Cặp thiên thần dẫn dâu: 1.000.000 VNĐ / cặp\n• Ban nhạc Saxophone đón khách: 5.000.000 VNĐ / ban\n• Ban nhạc Tứ tấu cổ điển: 14.000.000 VNĐ / ban\nQuý khách có thể xem và tính dự toán tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!`,
        suggestedQuestions: [
          "Bảng giá dịch vụ Photobooth chụp ảnh lấy ngay?",
          "Nghi thức rót gạo, laser và flycam trao nhẫn giá bao nhiêu?",
          "Thực đơn tiệc cưới bao nhiêu một mâm?",
        ],
      });
    }

    // 5.3. Nghi thức cưới & Hiệu ứng đặc biệt (Rót gạo, Vòng laser, Flycam, Bướm bay, Tưới cây, Bóng bay)
    if (
      lower.includes("rót gạo") ||
      lower.includes("rot gao") ||
      lower.includes("tranh cát") ||
      lower.includes("tranh cat") ||
      lower.includes("laser") ||
      lower.includes("vòng laser") ||
      lower.includes("flycam") ||
      lower.includes("bướm bay") ||
      lower.includes("buom bay") ||
      lower.includes("tưới cây") ||
      lower.includes("tuoi cay") ||
      lower.includes("bóng bay kích nổ") ||
      lower.includes("bong bay kich no")
    ) {
      return respond({
        success: true,
        reply: `Dạ bảng giá hiệu ứng nghi thức cưới tại Golden Palace:\n• Rót gạo / Tranh cát: 800.000 VNĐ / hộp\n• Vòng laser trao nhẫn: 700.000 VNĐ (🎁 TẶNG MIỄN PHÍ cho tiệc từ 400 khách)\n• Flycam trao nhẫn cưới: 1.000.000 VNĐ / lần\n• Bướm bay dẫn đường: 3.000.000 VNĐ / con\n• Tưới cây hạnh phúc: 500.000 VNĐ / lần\n• Bóng bay kích nổ: 900.000 VNĐ / quả (từ 4 quả)\nChi tiết tại: https://goldenpalacenamdinh.com/dich-vu ạ!`,
        suggestedQuestions: [
          "Bảng giá dịch vụ Photobooth chụp ảnh lấy ngay?",
          "Thuê MC, ca sĩ và ban nhạc giá bao nhiêu?",
          "Tiệc 500 khách nên chọn sảnh hội trường nào?",
        ],
      });
    }

    // 5.4. Chính sách Thuế VAT & Nguyên tắc tính Bill
    if (
      lower.includes("vat") ||
      lower.includes("thuế") ||
      lower.includes("thue") ||
      lower.includes("hóa đơn") ||
      lower.includes("hoa don") ||
      lower.includes("xuất hóa đơn")
    ) {
      return respond({
        success: true,
        reply: `Dạ giá thực đơn và dịch vụ chưa bao gồm VAT. Khi xuất hóa đơn:\n• 8% VAT: Áp dụng cho Đồ ăn, Phí Hội trường và Nước lọc.\n• 10% VAT: Áp dụng cho Đồ uống (Nước ngọt, Bia, Rượu).\nQuý khách có thể tự tính dự toán tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một mâm?",
          "Có được mang rượu bia từ ngoài vào không?",
          "Quy trình đặt cọc tiệc cưới như thế nào?",
        ],
      });
    }

    // 5.5. Ăn thử mâm cỗ / Thử món
    if (
      lower.includes("thử món") ||
      lower.includes("thu mon") ||
      lower.includes("ăn thử") ||
      lower.includes("an thu") ||
      lower.includes("mâm thử") ||
      lower.includes("mam thu")
    ) {
      return respond({
        success: true,
        reply: `Dạ Golden Palace không phục vụ mâm ăn thử do đặc thù tiệc lớn. Quý khách có thể xem menu chi tiết các món tại: https://goldenpalacenamdinh.com/thuc-don?tab=SET_TIEC hoặc ghé nhà hàng để chuyên viên tư vấn trực tiếp nhé ạ!`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một mâm?",
          "Cho tôi xem ảnh không gian sảnh tiệc",
          "Địa chỉ nhà hàng và chỗ đỗ xe ô tô?",
        ],
      });
    }

    // 5.6. Bãi đỗ xe ô tô / xe máy
    if (
      lower.includes("đỗ xe") ||
      lower.includes("do xe") ||
      lower.includes("gửi xe") ||
      lower.includes("gui xe") ||
      lower.includes("bãi xe") ||
      lower.includes("bai xe") ||
      lower.includes("ô tô") ||
      lower.includes("o to")
    ) {
      return respond({
        success: true,
        reply: `Dạ Golden Palace có bãi đỗ xe ô tô và xe máy rộng rãi ngay trước sảnh (98 Đông A), bảo vệ điều phối chu đáo và MIỄN PHÍ 100% cho toàn bộ khách tham dự tiệc ạ!`,
        suggestedQuestions: [
          "Địa chỉ nhà hàng ở đâu?",
          "Nhà hàng đón khách tham quan sảnh lúc mấy giờ?",
          "Sảnh tiệc bên mình chứa được bao nhiêu khách?",
        ],
      });
    }

    // 5.7. Chính sách đồ uống mang vào / Phí nút chai
    if (
      lower.includes("mang rượu") ||
      lower.includes("mang bia") ||
      lower.includes("phí nút chai") ||
      lower.includes("phi nut chai") ||
      lower.includes("rượu ngoài") ||
      lower.includes("đồ uống mang vào")
    ) {
      return respond({
        success: true,
        reply: `Dạ nhà hàng cho phép mang đồ uống từ ngoài vào và chỉ thu phí phục vụ (phí nút chai, đá lạnh, ly cốc). Nếu dùng đồ uống của nhà hàng thì dùng bao nhiêu tính bấy nhiêu sau tiệc ạ. Xem chi tiết tại: https://goldenpalacenamdinh.com/thuc-don?tab=DO_UONG ạ!`,
        suggestedQuestions: [
          "Báo giá đã gồm thuế VAT chưa?",
          "Thực đơn tiệc cưới bao nhiêu một mâm?",
          "Quy trình đặt cọc tiệc cưới như thế nào?",
        ],
      });
    }

    // 5.8. Đề xuất sảnh theo quy mô khách & số bàn/mâm linh hoạt
    const parseCapacity = (text: string) => {
      const t = text.toLowerCase().trim();

      // 1. Số bàn / số mâm (VD: '30 bàn', '35 mâm', 'khoảng 30 mâm')
      const tableMatch = t.match(/(\d+)\s*(?:bàn|mâm|ban|mam)/);
      if (tableMatch) {
        const tables = parseInt(tableMatch[1], 10);
        return { tables, guests: tables * 10 };
      }

      // 2. Số khách / số người / pax (VD: '300 khách', '300 người', '300 pax')
      const guestMatch = t.match(/(\d+)\s*(?:khách|khach|người|nguoi|pax|bạn|slot)/);
      if (guestMatch) {
        const guests = parseInt(guestMatch[1], 10);
        return { guests, tables: Math.round(guests / 10) };
      }

      // 3. Số độc lập khi khách chỉ trả lời con số (VD: '300', '350', '50', 'tầm 300')
      const pureNumMatch = t.match(/(?:khoảng|tầm|tam|khoang|du kien|dự kiến)?\s*(\d{2,4})\s*$/);
      if (pureNumMatch) {
        const num = parseInt(pureNumMatch[1], 10);
        if (num <= 80) {
          return { tables: num, guests: num * 10 };
        } else {
          return { guests: num, tables: Math.round(num / 10) };
        }
      }

      return null;
    };

    const cap = parseCapacity(lower);
    if (cap) {
      const { guests, tables } = cap;

      // 1. Dưới 50 khách (Phòng VIP)
      if (guests <= 50) {
        return respond({
          success: true,
          reply: `Dạ với quy mô ${guests} khách (khoảng ${tables} mâm), lựa chọn hoàn hảo nhất là hệ thống Phòng VIP (10 – 50 khách) mang đẳng cấp riêng tư tuyệt đối, nội thất gỗ và mạ vàng hoàng gia: https://goldenpalacenamdinh.com/khong-gian/phong-vip . Quý khách muốn ghé xem trực tiếp không gian phòng VIP không ạ?`,
          suggestedQuestions: [
            "Cho tôi xem ảnh không gian sảnh tiệc",
            "Thực đơn tiệc cưới bao nhiêu một mâm?",
            "Địa chỉ nhà hàng ở đâu?",
          ],
        });
      }

      // 2. 51 - 100 khách (Quầy Bar Lounge hoặc Tầng 4)
      if (guests <= 100) {
        return respond({
          success: true,
          reply: `Dạ với quy mô ${guests} khách (khoảng ${tables} mâm), Golden Palace gợi ý:\n🍸 Quầy Bar Lounge Tầng 1 (50 – 100 khách) — Phong cách hiện đại, sành điệu: https://goldenpalacenamdinh.com/khong-gian/quay-bar\n🏛️ Hội trường Tầng 4 (100 – 300 khách) — Không gian trang nhã, ấm cúng: https://goldenpalacenamdinh.com/khong-gian/tang-4\nQuý khách muốn ghé xem trực tiếp không gian nào ạ?`,
          suggestedQuestions: [
            "Thực đơn tiệc cưới bao nhiêu một mâm?",
            "Cho tôi xem ảnh không gian sảnh tiệc",
            "Cho tôi hẹn xem sảnh vào cuối tuần",
          ],
        });
      }

      // 3. 101 - 280 khách (Hội trường Tầng 4)
      if (guests < 290) {
        return respond({
          success: true,
          reply: `Dạ với quy mô ${guests} khách (khoảng ${tables} mâm), lựa chọn hoàn hảo nhất là Hội trường Tầng 4 (100 – 300 khách) ạ:\n• Không gian ấm cúng, sang trọng, riêng tư.\n• Trang bị sẵn màn hình LED 10m², âm thanh biểu diễn chuẩn và hoa lụa sân khấu lãng mạn.\n📸 Xem chi tiết: https://goldenpalacenamdinh.com/khong-gian/tang-4\n📝 Tính dự toán: https://goldenpalacenamdinh.com/du-toan-chi-phi`,
          suggestedQuestions: [
            "Thực đơn tiệc cưới bao nhiêu một mâm?",
            "Đặt cọc giữ sảnh bao nhiêu?",
            "Cho tôi hẹn xem sảnh vào cuối tuần",
          ],
        });
      }

      // 4. 290 - 350 khách (Bao gồm đúng 300 khách - Gợi ý cả Tầng 3 và Tầng 4)
      if (guests <= 350) {
        return respond({
          success: true,
          reply: `Dạ với quy mô ${guests} khách (khoảng ${tables} mâm), Golden Palace trân trọng gợi ý 2 lựa chọn phù hợp nhất:\n🏛️ Hội trường Tầng 3 (300 – 650 khách) — Giàn đèn bướm nghệ thuật rực rỡ, màn LED 30m², không gian rộng rãi rất thoải mái khi phát sinh thêm khách: https://goldenpalacenamdinh.com/khong-gian/tang-3\n🏛️ Hội trường Tầng 4 (100 – 300 khách) — Không gian ấm cúng, trang nhã, vừa vặn cho tiệc ${tables} mâm: https://goldenpalacenamdinh.com/khong-gian/tang-4\nAnh/chị muốn ghé tham quan trực tiếp sảnh Tầng 3 hay Tầng 4 ạ?`,
          suggestedQuestions: [
            "Hội trường Tầng 3 có gì đặc biệt?",
            "Hội trường Tầng 4 có gì đặc biệt?",
            "Cho tôi hẹn xem sảnh vào cuối tuần",
          ],
        });
      }

      // 5. 351 - 650 khách (Tầng 3 hoặc Tầng 2)
      if (guests <= 650) {
        return respond({
          success: true,
          reply: `Dạ với quy mô ${guests} khách (khoảng ${tables} mâm), em trân trọng gợi ý Quý khách:\n🏛️ Hội trường Tầng 3 (300 – 650 khách) — Phong cách hoàng gia lộng lẫy, giàn đèn bướm nghệ thuật rực rỡ, màn LED 30m²: https://goldenpalacenamdinh.com/khong-gian/tang-3\n🏛️ Hội trường Tầng 2 (350 – 750 khách) — Đại cung điện trần cao 7m hoàn toàn không có cột chắn, đèn pha lê hoàng gia hoành tráng: https://goldenpalacenamdinh.com/khong-gian/tang-2\nQuý khách muốn ghé xem trực tiếp sảnh nào ạ?`,
          suggestedQuestions: [
            "Hội trường Tầng 2 có gì đặc biệt?",
            "Hội trường Tầng 3 có gì đặc biệt?",
            "Cho tôi hẹn xem sảnh vào cuối tuần",
          ],
        });
      }

      // 6. Trên 650 khách (Tầng 2 Đại cung điện)
      return respond({
        success: true,
        reply: `Dạ với quy mô đại lễ trên ${guests} khách (khoảng ${tables} mâm), Hội trường Tầng 2 là sự lựa chọn duy nhất và hoàn hảo nhất tại Nam Định:\n• Sức chứa tối đa lên tới 750 khách (75 mâm).\n• Không gian trần cao 7m hoàn toàn không có cột, màn hình LED cỡ lớn 30m² đảm bảo tầm nhìn tuyệt đối.\n📸 Xem chi tiết: https://goldenpalacenamdinh.com/khong-gian/tang-2\n📞 Liên hệ Hotline 0228 659 5959 để kiểm tra lịch sảnh trống ngày đẹp ạ!`,
        suggestedQuestions: [
          "Bảng giá dịch vụ Photobooth chụp ảnh lấy ngay?",
          "Địa chỉ nhà hàng ở đâu?",
          "Cho tôi hẹn xem sảnh vào cuối tuần",
        ],
      });
    }

    // 5.9. Hình ảnh không gian sảnh tiệc
    if (
      lower.includes("không gian") ||
      lower.includes("khong gian") ||
      lower.includes("hình ảnh") ||
      lower.includes("hinh anh") ||
      lower.includes("xem ảnh") ||
      lower.includes("xem anh") ||
      lower.includes("ảnh sảnh")
    ) {
      return respond({
        success: true,
        reply: `Dạ kính mời Quý khách tham khảo toàn bộ hình ảnh thực tế không gian 5 sảnh hội trường tráng lệ của Golden Palace tại đây: https://goldenpalacenamdinh.com/khong-gian . Anh/chị đang dự kiến tiệc bao nhiêu bàn để em tư vấn sảnh phù hợp nhất ạ?`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một mâm?",
          "Tiệc 500 khách nên chọn sảnh hội trường nào?",
          "Địa chỉ nhà hàng ở đâu?",
        ],
      });
    }

    // 5.10. Địa chỉ, vị trí, Google Maps
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
      return respond({
        success: true,
        reply: `Dạ Golden Palace tọa lạc tại 98 Đông A, KĐT Hòa Vượng, TP Nam Định. Giờ đón tiếp Quý khách tham quan trực tiếp các sảnh tiệc từ 8h00 – 21h00 tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và ngày Lễ) ạ! Quý khách xem chỉ đường Google Maps tại: https://maps.app.goo.gl/GrYDqNTLNmqQ1nH76?g_st=ic`,
        suggestedQuestions: [
          "Nhà hàng có chỗ đỗ xe ô tô không?",
          "Hotline liên hệ trực tiếp",
          "Thực đơn tiệc cưới bao nhiêu một mâm?",
        ],
      });
    }

    // 5.11. Hotline
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
      return respond({
        success: true,
        reply: `Dạ Quý khách có thể liên hệ trực tiếp qua Hotline: 0228 659 5959 hoặc truy cập website https://goldenpalacenamdinh.com. Đội ngũ quản lý tiệc Golden Palace luôn sẵn sàng hỗ trợ chu đáo 24/7 ạ!`,
        suggestedQuestions: [
          "Địa chỉ nhà hàng ở đâu?",
          "Bảng giá dịch vụ Photobooth chụp ảnh lấy ngay?",
          "Cho tôi hẹn xem sảnh vào cuối tuần",
        ],
      });
    }

    // 6. Đối chiếu tri thức FAQ (Knowledge Base)

    // 6.1. ĐẶT CỌC & GIỮ SẢNH (Ưu tiên xử lý chính xác khi khách hỏi cọc / giữ sảnh)
    if (
      lower.includes("cọc") ||
      lower.includes("coc") ||
      lower.includes("đặt cọc") ||
      lower.includes("tiền cọc") ||
      lower.includes("giữ sảnh") ||
      lower.includes("giu sanh") ||
      lower.includes("quy trình đặt tiệc") ||
      lower.includes("quy trinh dat tiec")
    ) {
      const datCocItem = knowledgeBase.find((k: any) => k.category === "dat_coc");
      return respond({
        success: true,
        reply:
          datCocItem?.answer ||
          `Dạ mức cọc giữ sảnh lần 1 là 5.000.000 VNĐ (cấn trừ trực tiếp khi ký hợp đồng và chốt thực đơn). Quy trình gồm 3 bước:\n• Bước 1: Khảo sát sảnh & cọc lần 1 là 5.000.000 VNĐ giữ ngày đẹp.\n• Bước 2: Ký hợp đồng, chốt thực đơn & dịch vụ (cọc 50%).\n• Bước 3: Bàn giao kịch bản và chạy thử trước ngày tiệc.\nQuý khách cần hỗ trợ thêm vui lòng liên hệ Hotline 0228 659 5959 hoặc ghé 98 Đông A nhé ạ!`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Cho tôi xem ảnh không gian sảnh tiệc",
          "Địa chỉ nhà hàng ở đâu?",
        ],
      });
    }

    // 6.2. THỰC ĐƠN / GIÁ BÀN / MENU
    if (
      lower.includes("thực đơn") ||
      lower.includes("thuc don") ||
      lower.includes("menu") ||
      lower.includes("món ăn") ||
      lower.includes("mon an") ||
      lower.includes("bao nhiêu một bàn") ||
      lower.includes("bn 1 ban") ||
      lower.includes("giá bàn") ||
      lower.includes("mâm cỗ")
    ) {
      const thucDonItem = knowledgeBase.find((k: any) => k.category === "thuc_don");
      return respond({
        success: true,
        reply:
          thucDonItem?.answer ||
          `Dạ thực đơn tiệc cưới tại Golden Palace được thiết kế linh hoạt theo từng set món. Quý khách xem danh sách món ăn tại: https://goldenpalacenamdinh.com/thuc-don hoặc tự tính dự toán trọn gói tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!`,
        suggestedQuestions: [
          "Ưu đãi mùa cưới hiện nay có gì?",
          "Đặt cọc giữ sảnh bao nhiêu?",
          "Cho tôi hẹn xem sảnh vào cuối tuần",
        ],
      });
    }

    // 6.3. ƯU ĐÃI / KHUYẾN MÃI
    if (
      lower.includes("ưu đãi") ||
      lower.includes("uu dai") ||
      lower.includes("khuyến mãi") ||
      lower.includes("khuyen mai") ||
      lower.includes("giảm giá")
    ) {
      const uuDaiItem = knowledgeBase.find((k: any) => k.category === "uu_dai");
      return respond({
        success: true,
        reply:
          uuDaiItem?.answer ||
          `Dạ Golden Palace luôn có chính sách ưu đãi hấp dẫn theo mùa. Đặc biệt tiệc từ 400 khách trở lên được TẶNG MIỄN PHÍ Vòng ánh sáng Laser trao nhẫn cưới độc đáo. Quý khách liên hệ Hotline 0228 659 5959 để được tư vấn gói ưu đãi chi tiết ạ!`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Đặt cọc giữ sảnh bao nhiêu?",
          "Cho tôi hẹn xem sảnh vào cuối tuần",
        ],
      });
    }

    // 6.4. TRANG TRÍ & DECOR
    if (
      lower.includes("trang trí") ||
      lower.includes("trang tri") ||
      lower.includes("decor")
    ) {
      const decorItem = knowledgeBase.find((k: any) => k.category === "decor_ngoai");
      return respond({
        success: true,
        reply:
          decorItem?.answer ||
          `Dạ Quý khách hoàn toàn có thể mời đơn vị trang trí (decor) riêng từ bên ngoài vào hoặc chọn các gói decor của sảnh. Xem hình ảnh trang trí thực tế tại: https://goldenpalacenamdinh.com/khong-gian . Hotline tư vấn: 0228 659 5959.`,
        suggestedQuestions: [
          "Cho tôi xem ảnh không gian sảnh tiệc",
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Đặt cọc giữ sảnh bao nhiêu?",
        ],
      });
    }

    // 6.5. CÔNG NGHỆ SỐ / THIỆP CƯỚI ONLINE / PHÔNG LED
    if (
      lower.includes("thiệp cưới") ||
      lower.includes("thiep cuoi") ||
      lower.includes("phông led") ||
      lower.includes("phong led") ||
      lower.includes("cá nhân hóa")
    ) {
      const techItem = knowledgeBase.find((k: any) => k.category === "cong_nghe_so");
      return respond({
        success: true,
        reply:
          techItem?.answer ||
          `Dạ Golden Palace có tính năng tạo Thiệp cưới online và Video phông LED sân khấu cá nhân hóa miễn phí cho dâu rể tại: https://goldenpalacenamdinh.com/ca-nhan-hoa ạ!`,
        suggestedQuestions: [
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Cho tôi xem ảnh không gian sảnh tiệc",
          "Đặt cọc giữ sảnh bao nhiêu?",
        ],
      });
    }

    // 6.6. SẢNH TIỆC / SỨC CHỨA (Chỉ khi khách hỏi về quy mô, số khách, sức chứa sảnh)
    if (
      lower.includes("sức chứa") ||
      lower.includes("suc chua") ||
      lower.includes("chứa được bao nhiêu") ||
      lower.includes("chua duoc bao nhieu") ||
      lower.includes("có bao nhiêu sảnh") ||
      lower.includes("các sảnh") ||
      (lower.includes("sảnh") && (lower.includes("bao nhiêu") || lower.includes("quy mô")))
    ) {
      return respond({
        success: true,
        reply: `Dạ Golden Palace có 5 sảnh hội trường với sức chứa linh hoạt từ 10 đến 750 khách (1 – 75 mâm): Hội trường Tầng 2 (350–750 khách), Tầng 3 (300–650 khách), Tầng 4 (100–300 khách), Quầy Bar Lounge (50–100 khách) và Phòng VIP (10–50 khách). Quý khách xem ảnh chi tiết tại: https://goldenpalacenamdinh.com/khong-gian ạ!`,
        suggestedQuestions: [
          "Cho tôi xem ảnh không gian sảnh tiệc",
          "Thực đơn tiệc cưới bao nhiêu một bàn?",
          "Đặt cọc giữ sảnh bao nhiêu?",
        ],
      });
    }

    // 6.7. TÌM KIẾM ĐỐI CHIẾU THEO TỪ KHÓA TRONG KNOWLEDGE BASE (FALLBACK PHÙ HỢP NHẤT)
    for (const item of knowledgeBase) {
      const qLower = item.question.toLowerCase();
      const keywords = qLower.split(" ").filter((w: string) => w.length > 3);
      const matchCount = keywords.filter((w: string) => lower.includes(w)).length;
      if (matchCount >= 2) {
        return respond({
          success: true,
          reply: item.answer,
          suggestedQuestions: [
            "Thực đơn tiệc cưới bao nhiêu một bàn?",
            "Cho tôi xem ảnh không gian sảnh tiệc",
            "Đặt cọc giữ sảnh bao nhiêu?",
          ],
        });
      }
    }

    // 7. Trả lời mặc định (Ngắn gọn, không lặp lại giới thiệu trợ lý tư vấn)
    return respond({
      success: true,
      reply: `Dạ Quý khách cần hỗ trợ thêm thông tin cụ thể về thực đơn, giá bàn, hình ảnh sảnh tiệc hay đặt lịch ghé xem trực tiếp tại 98 Đông A ạ?`,
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

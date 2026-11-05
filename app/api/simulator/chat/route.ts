import { NextRequest, NextResponse } from "next/server";
import { suggestedQuestions, visitIntent } from "@/lib/chat/follow-ups";
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

    // 3. Nhận diện SĐT để tự động bóc tách Lead
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

    // 4. Khách hẹn lịch xem sảnh / thử món / trải nghiệm dịch vụ
    const visit = visitIntent(trimmedMsg);
    if (visit) {
      return respond({
        success: true,
        reply: `Dạ ${brandName} đón khách tham quan sảnh và thử món từ 8:00 đến 10:30 sáng hằng ngày tại 98 Đông A, TP. Nam Định. Để ban quản lý chuẩn bị phòng tiếp đón và chuyên viên tư vấn riêng, Quý khách cho em xin Tên và Số điện thoại nhé!`,
        appointmentIntent: true,
        visitType: visit,
        suggestedQuestions: [
          "Địa chỉ nhà hàng ở đâu?",
          "Hotline liên hệ trực tiếp",
          "Cho tôi xem ảnh không gian sảnh tiệc",
        ],
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
        reply: `Dạ Golden Palace có cung cấp dịch vụ máy chụp ảnh Photobooth in lấy ngay tại sảnh tiệc với 3 gói lựa chọn tiện lợi:\n📸 Gói 1 (1.5 giờ): 3.400.000 VNĐ (In 200 ảnh nhỏ hoặc 100 ảnh to).\n📸 Gói 2 (2 giờ): 4.000.000 VNĐ (KHÔNG GIỚI HẠN số lượng ảnh chụp & in).\n📸 Gói 3 (3 giờ): 5.000.000 VNĐ (KHÔNG GIỚI HẠN số lượng ảnh chụp & in).\n🎁 Tất cả các gói đều đã bao gồm 01 kỹ thuật viên trực máy, bàn giao toàn bộ file mềm gốc, phụ kiện check-in vui nhộn và sổ ký tên lưu giữ lời chúc cho dâu rể ạ!`,
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
        reply: `Dạ Golden Palace cung cấp đội ngũ nhân sự biểu diễn chuyên nghiệp với bảng giá niêm yết:\n🎤 MC tiệc cưới chuyên nghiệp: 800.000 VNĐ / người\n🎶 Ca sĩ biểu diễn (hát 3 bài): 800.000 VNĐ / ca sĩ\n🎹 Nhạc công Keyboard: 800.000 VNĐ / người\n👼 Thiên thần dẫn lối cô dâu (1 cặp): 1.000.000 VNĐ / cặp\n🎷 Ban nhạc Saxophone đón khách: 5.000.000 VNĐ / ban\n🎻 Ban nhạc Tứ tấu cổ điển hoàng gia: 14.000.000 VNĐ / ban\nQuý khách có thể tích chọn khi tính Dự toán Chi phí tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!`,
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
        reply: `Dạ nhà hàng có các gói nghi thức và hiệu ứng trao nhẫn cưới độc đáo với giá niêm yết:\n🌾 Rót gạo / Tranh cát thiêng liêng: 800.000 VNĐ / Hộp\n💍 Vòng laser trao nhẫn: 700.000 VNĐ / lần (🎁 TẶNG MIỄN PHÍ cho tiệc từ 400 khách trở lên)\n🛸 Flycam trao nhẫn cưới: 1.000.000 VNĐ / lần\n🦋 Bướm bay dẫn đường: 3.000.000 VNĐ / con\n🌳 Tưới cây hạnh phúc: 500.000 VNĐ / lần\n🎈 Bóng bay kích nổ: 900.000 VNĐ / quả (từ 4 quả)\nChi tiết tại: https://goldenpalacenamdinh.com/dich-vu ạ!`,
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
        reply: `Dạ các báo giá thực đơn và dịch vụ hiện tại của Golden Palace là GIÁ CHƯA BAO GỒM VAT ạ.\nKhi tính tổng bill hoặc xuất hóa đơn, thuế VAT được bóc tách theo quy định:\n• Thuế 8% VAT: Áp dụng cho Đồ ăn + Phí Hội trường (phí HT) + Nước lọc.\n• Thuế 10% VAT: Áp dụng cho Đồ uống (Nước ngọt + Bia + Rượu).\nQuý khách có thể tự tính dự toán tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!`,
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
        reply: `Dạ để đảm bảo tính đồng bộ và chất lượng phục vụ tiêu chuẩn yến tiệc số lượng lớn, hiện tại Golden Palace không áp dụng dịch vụ mâm thử món ạ.\nToàn bộ các món ăn đều do các đầu bếp chuyên nghiệp nhiều năm kinh nghiệm chế biến chuẩn vị tiệc cưới truyền thống và hiện đại, đã được hàng ngàn cặp đôi tại Nam Định tin chọn và đánh giá rất cao. Quý khách xem danh sách món ăn tại: https://goldenpalacenamdinh.com/thuc-don?tab=SET_TIEC ạ!`,
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
        reply: `Dạ Golden Palace có bãi đỗ xe ô tô và xe máy vô cùng rộng rãi ngay trước khuôn viên nhà hàng, có nhân viên bảo vệ điều phối chu đáo và HOÀN TOÀN MIỄN PHÍ 100% cho toàn bộ khách tham dự tiệc ạ! Quý khách xem thêm khuôn viên tại: https://goldenpalacenamdinh.com/khong-gian`,
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
        reply: `Dạ chính sách đồ uống tại Golden Palace rất minh bạch và linh hoạt:\n1. Đồ uống nhà hàng: Kiểm đếm số lượng thực tế sử dụng sau tiệc (uống bao nhiêu tính tiền bấy nhiêu).\n2. Đồ uống mang từ ngoài vào: Quý khách ĐƯỢC PHÉP mang rượu, bia từ ngoài vào, nhà hàng áp dụng mức phí phục vụ (phí nút chai, đá lạnh, ly cốc niêm yết theo quy định). Quý khách xem chi tiết tại: https://goldenpalacenamdinh.com/thuc-don?tab=DO_UONG ạ!`,
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
          `Dạ để giữ ngày đẹp và sảnh ưng ý, Quý khách đặt cọc lần 1 là 5.000.000 VNĐ ạ. Khoản cọc này được cấn trừ trực tiếp khi ký hợp đồng và chốt thực đơn chính thức. Quy trình gồm 3 giai đoạn:\n• GĐ 1: Khảo sát sảnh & Đặt cọc lần 1 là 5.000.000 VNĐ giữ ngày đẹp.\n• GĐ 2: Ký hợp đồng chính thức, chốt thực đơn & dịch vụ bổ sung (Đặt cọc 50%).\n• GĐ 3: Bàn giao kịch bản tiệc và chạy thử trước ngày diễn ra.\nQuý khách liên hệ Hotline 0228 659 5959 hoặc ghé 98 Đông A để được hỗ trợ chu đáo nhé!`,
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
          `Dạ thực đơn tiệc cưới được thiết kế phong phú theo từng set món. Quý khách xem chi tiết menu tại: https://goldenpalacenamdinh.com/thuc-don hoặc tính dự toán trọn gói tại: https://goldenpalacenamdinh.com/du-toan-chi-phi ạ!`,
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
          `Dạ Golden Palace luôn có chính sách ưu đãi dành riêng cho tiệc cưới theo từng thời điểm. Đặc biệt tiệc từ 400 khách trở lên được TẶNG MIỄN PHÍ Vòng ánh sáng Laser trao nhẫn cưới độc đáo. Quý khách liên hệ Hotline 0228 659 5959 để được tư vấn gói ưu đãi chi tiết ạ!`,
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

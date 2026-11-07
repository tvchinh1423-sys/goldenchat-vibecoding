/**
 * lib/chat/booking-extractor.ts
 * Bộ trích xuất thông tin đặt lịch thông minh (Smart Booking NLP Parser)
 * Tự động bóc tách: Họ tên, Ngày hẹn, Giờ hẹn, Số điện thoại, Loại sự kiện từ tin nhắn tự nhiên của khách.
 */

export interface BookingDraftInfo {
  fullName: string | null;
  phone: string | null;
  dateStr: string | null;      // "09/11/2026"
  timeStr: string | null;      // "10:00"
  dateTimeIso: string | null;  // "2026-11-09T10:00"
  eventType: "xem_sanh" | "thu_mon" | "tu_van_su_kien";
  eventTypeName: string;
  guestsCount: number;
  notes: string;
  isComplete: boolean;
  missingFields: ("fullName" | "phone" | "dateTime")[];
  awaitingInfo?: boolean;
  isInvalidDate?: boolean;
  dateInvalidReason?: string | null;
  isInvalidTime?: boolean;
  timeInvalidReason?: string | null;
}

// Chuẩn hóa tên (Viết hoa chữ cái đầu: "vân" -> "Vân")
function capitalizeWords(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}

/**
 * Trích xuất chi tiết đặt lịch từ tin nhắn khách hàng
 * Hỗ trợ các câu tự nhiên như:
 * - "chị muốn đặt lịch tư vấn trực tiếp ngày 9/11 lúc 10h , c tên vân"
 * - "mai tôi qua xem sảnh lúc 9h sáng, tên Dũng, sđt 0987654321"
 * - "chị tên Trang 0912345678 muốn hẹn thử món cuối tuần này"
 */
export function extractBookingDetails(
  text: string,
  existingContext?: Partial<BookingDraftInfo> | null
): BookingDraftInfo {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Trích xuất Số điện thoại (Phone) trước
  // Hỗ trợ số điện thoại 9 - 11 chữ số, có tiền tố 'sđt', 'số điện thoại', 'phone', 'tel', hoặc icon [📞📱☎️📲]
  let extractedPhone = existingContext?.phone || null;

  // 1.1. Có tiền tố chỉ định: "số điện thoại", "sđt", "phone", "tel", "call", icon [📞📱☎️📲]
  const explicitPhoneMatch = clean.match(
    /(?:số\s*điện\s*thoại|sđt|sdt|đt|phone|tel|call|[📞📱☎️📲])\s*[:=]?\s*([0-9\s.-]{8,15})/i
  );
  if (explicitPhoneMatch) {
    const raw = explicitPhoneMatch[1].replace(/[\s.-]/g, "");
    if (/^0?[0-9]{8,11}$/.test(raw)) {
      extractedPhone = raw.startsWith("0") ? raw : "0" + raw;
    }
  }

  // 1.2. Nhận diện số điện thoại tự nhiên trong câu (bắt đầu bằng 0, +84, hoặc 84, độ dài 9-11 số)
  if (!extractedPhone) {
    const phoneMatches = clean.match(/(?:(?:\+84|84|0)[1-9][0-9\s.-]{7,11})/g);
    if (phoneMatches) {
      for (const m of phoneMatches) {
        let raw = m.replace(/[\s.-]/g, "");
        if (raw.startsWith("+84")) raw = "0" + raw.slice(3);
        else if (raw.startsWith("84")) raw = "0" + raw.slice(2);
        if (/^0[1-9][0-9]{7,10}$/.test(raw)) {
          extractedPhone = raw;
          break;
        }
      }
    }
  }

  // 2. Làm sạch văn bản để bóc tách Tên (loại bỏ phần SĐT và icon điện thoại)
  let textWithoutPhone = clean;
  if (extractedPhone) {
    textWithoutPhone = textWithoutPhone
      .replace(/(?:số\s*điện\s*thoại|sđt|sdt|đt|phone|tel|call|[📞📱☎️📲])\s*[:=]?\s*[0-9\s.-]{8,15}/gi, " ")
      .replace(new RegExp(extractedPhone, "g"), " ")
      .replace(/[📞📱☎️📲]/g, " ")
      .replace(/[-–—,:;]/g, " ")
      .trim();
  }

  // 3. Trích xuất Tên (Name)
  let extractedName = existingContext?.fullName || null;

  // 3.1. Có từ khóa chỉ định tên: "tên Chi", "tên: Chi", "tên là Chi", "tôi tên Chinh", "c tên vân", "chị tên Trang"
  const nameKeywordPattern =
    /(?:(?:c|chị|em|anh|mình|tôi|bác|chú|cô)\s+(?:tên(?:\s*là)?|la)|tên\s*(?:của\s*)?(?:chị|em|anh|mình|tôi)?\s*(?:là|:)?)\s+([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]{2,30})/iu;

  const matchKw = textWithoutPhone.match(nameKeywordPattern) || clean.match(nameKeywordPattern);
  if (matchKw && matchKw[1]) {
    const rawName = matchKw[1].trim();
    if (!/^(đặt lịch|tư vấn|xem sảnh|thực đơn|nhà hàng|golden palace|bàn|khách|tiệc|menu)$/i.test(rawName)) {
      extractedName = capitalizeWords(rawName);
    }
  }

  // 3.2. Mẫu "chị Vân", "anh Dũng" khi đứng đầu câu hoặc sau dấu phẩy
  if (!extractedName) {
    const pronounMatch = textWithoutPhone.match(/(?:^|[,;]\s*)(?:chị|anh|em|c|a)\s+([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]{2,15})(?=[,.;!\n]|$|\s)/iu);
    if (pronounMatch && pronounMatch[1]) {
      const rawName = pronounMatch[1].trim();
      if (!/^(đặt lịch|tư vấn|xem sảnh|thực đơn|nhà hàng|golden palace|bàn|khách|tiệc|menu|cho|hỏi|muốn|cần|qua|đến)$/i.test(rawName)) {
        extractedName = capitalizeWords(rawName);
      }
    }
  }

  // 3.3. Khách chỉ nhắn gọn Tên (1 đến 4 từ chữ cái) sau khi đã tách SĐT (ví dụ: "Chi", "Chi 0933847772", "Trần Vân Chinh")
  if (!extractedName) {
    const cleanedWords = textWithoutPhone.trim().split(/\s+/).filter(Boolean);
    if (cleanedWords.length >= 1 && cleanedWords.length <= 4) {
      const candidate = cleanedWords.join(" ");
      if (/^[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]{2,30}$/iu.test(candidate)) {
        if (!/^(đặt lịch|tư vấn|xem sảnh|thực đơn|nhà hàng|golden palace|bàn|khách|tiệc|menu|mai|hôm nay|cuối tuần|sáng|chiều|tối|alo|dạ|vâng|ok|oke|okie|sđt|sdt|phone|tôi|chị|anh|em|mình)$/i.test(candidate)) {
          extractedName = capitalizeWords(candidate);
        }
      }
    }
  }

  // 3. Trích xuất Loại sự kiện (Event Type)
  let eventType: "xem_sanh" | "thu_mon" | "tu_van_su_kien" =
    existingContext?.eventType || "xem_sanh";

  if (/(?:thử món|nếm món|ăn thử|menu thử)/i.test(lower)) {
    eventType = "thu_mon";
  } else if (/(?:tư vấn trực tiếp|tư vấn sự kiện|tiệc công ty|hội nghị|tiệc sinh nhật|báo hỷ|sự kiện)/i.test(lower)) {
    eventType = "tu_van_su_kien";
  } else if (/(?:xem sảnh|tham quan|khảo sát sảnh|hội trường|coi sảnh)/i.test(lower)) {
    eventType = "xem_sanh";
  }

  const eventTypeNames = {
    xem_sanh: "Tham quan & Xem sảnh tiệc",
    thu_mon: "Thử món & Tư vấn thực đơn",
    tu_van_su_kien: "Tư vấn trực tiếp tại nhà hàng",
  };

  // 4. Trích xuất Ngày hẹn (Date)
  let targetYear = 2026;
  let targetMonth: number | null = null;
  let targetDay: number | null = null;

  // 4.1. Nhận diện dạng số: "9/11", "09/11", "ngày 9/11", "9-11-2026"
  const dateMatch = clean.match(/(?:ngày\s*)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/i);
  if (dateMatch) {
    targetDay = parseInt(dateMatch[1], 10);
    targetMonth = parseInt(dateMatch[2], 10);
    if (dateMatch[3]) targetYear = parseInt(dateMatch[3], 10);
  } else if (/(?:hôm nay|toi nay|chieu nay)/i.test(lower)) {
    const now = new Date();
    targetDay = now.getDate();
    targetMonth = now.getMonth() + 1;
    targetYear = now.getFullYear();
  } else if (/(?:ngày mai|sáng mai|chiều mai|toi mai|mai)/i.test(lower)) {
    const tmr = new Date(Date.now() + 86400000);
    targetDay = tmr.getDate();
    targetMonth = tmr.getMonth() + 1;
    targetYear = tmr.getFullYear();
  } else if (/(?:thứ 7|thu 7|thứ bảy)/i.test(lower)) {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    targetDay = d.getDate();
    targetMonth = d.getMonth() + 1;
    targetYear = d.getFullYear();
  } else if (/(?:chủ nhật|chu nhat|cuối tuần|cuoi tuan)/i.test(lower)) {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSunday);
    targetDay = d.getDate();
    targetMonth = d.getMonth() + 1;
    targetYear = d.getFullYear();
  }

  // 5. Trích xuất Giờ hẹn (Time)
  // Các mẫu: "lúc 10h", "10:00", "10h sáng", "8h30", "14h", "2h chiều", "10 giờ"
  let targetHour = 9;   // mặc định khi khách chỉ nói ngày
  let targetMinute = 0;
  let hasExplicitTime = false;

  const timeMatch = clean.match(/(?:lúc|vào|khoảng)?\s*(\d{1,2})(?:h| giờ|:)(\d{2})?\s*(sáng|chiều|tối)?/i);
  if (timeMatch) {
    hasExplicitTime = true;
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3]?.toLowerCase();

    if (period === "chiều" || period === "tối") {
      if (hour < 12) hour += 12;
    }
    targetHour = hour;
    targetMinute = minute;
  } else if (/(?:sáng mai|buổi sáng)/i.test(lower)) {
    hasExplicitTime = true;
    targetHour = 9;
    targetMinute = 0;
  } else if (/(?:chiều mai|buổi chiều)/i.test(lower)) {
    hasExplicitTime = true;
    targetHour = 14;
    targetMinute = 30;
  }

  // 6. Xây dựng Chuỗi Ngày Giờ và DateTime ISO
  let dateStr: string | null = null;
  let timeStr: string | null = null;
  let dateTimeIso: string | null = null;
  let isInvalidDate = false;
  let dateInvalidReason: string | null = null;
  let isInvalidTime = false;
  let timeInvalidReason: string | null = null;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (targetDay !== null && targetMonth !== null) {
    dateStr = `${pad(targetDay)}/${pad(targetMonth)}/${targetYear}`;
    timeStr = `${pad(targetHour)}:${pad(targetMinute)}`;

    // 6.1. Kiểm tra tính hợp lệ của ngày trong lịch (Gregorian Calendar)
    if (targetMonth < 1 || targetMonth > 12 || targetDay < 1 || targetDay > 31) {
      isInvalidDate = true;
      dateInvalidReason = `Ngày ${dateStr} không hợp lệ.`;
    } else {
      const checkDate = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay));
      if (
        checkDate.getUTCFullYear() !== targetYear ||
        checkDate.getUTCMonth() !== targetMonth - 1 ||
        checkDate.getUTCDate() !== targetDay
      ) {
        isInvalidDate = true;
        const daysInMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
        dateInvalidReason = `Tháng ${targetMonth} chỉ có ${daysInMonth} ngày (không có ngày ${pad(targetDay)}/${pad(targetMonth)}).`;
      }
    }

    if (!isInvalidDate) {
      dateTimeIso = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}T${timeStr}`;
    }
  } else if (hasExplicitTime) {
    // Khách có nói giờ rõ ràng (ví dụ: "lúc 10h") nhưng chưa nói ngày -> mặc định lấy ngày mai
    const tmr = new Date(Date.now() + 86400000);
    dateStr = `${pad(tmr.getDate())}/${pad(tmr.getMonth() + 1)}/${tmr.getFullYear()}`;
    timeStr = `${pad(targetHour)}:${pad(targetMinute)}`;
    dateTimeIso = `${tmr.getFullYear()}-${pad(tmr.getMonth() + 1)}-${pad(tmr.getDate())}T${timeStr}`;
  } else if (existingContext?.dateTimeIso) {
    dateTimeIso = existingContext.dateTimeIso;
    dateStr = existingContext.dateStr || null;
    timeStr = existingContext.timeStr || null;
  } else {
    // KHÁCH CHƯA NÓI GÌ VỀ THỜI GIAN -> TUYỆT ĐỐI ĐỂ NULL, KHÔNG TỰ BỊA THỜI GIAN ẢO!
    dateStr = null;
    timeStr = null;
    dateTimeIso = null;
  }

  // 6.2. Kiểm tra khung giờ đón tiếp chuyên viên tư vấn / xem sảnh (08:00 - 10:30 sáng)
  if (hasExplicitTime) {
    const minutes = targetHour * 60 + targetMinute;
    const minMinutes = 8 * 60;        // 08:00
    const maxMinutes = 10 * 60 + 30;  // 10:30
    if (minutes < minMinutes || minutes > maxMinutes) {
      isInvalidTime = true;
      timeInvalidReason = `Khung giờ chuyên viên đón tiếp tư vấn trực tiếp và xem sảnh tại Golden Palace là từ 8:00 đến 10:30 sáng hàng ngày (thời gian ${pad(targetHour)}:${pad(targetMinute)} hiện nằm ngoài khung giờ này).`;
      dateTimeIso = null;
    }
  }

  // 7. Trích xuất số khách / bàn nếu có
  let guestsCount = existingContext?.guestsCount || 2;
  const guestMatch = clean.match(/(\d{1,3})\s*(?:người|khách|pax)/i);
  if (guestMatch) {
    guestsCount = parseInt(guestMatch[1], 10);
  }

  // 8. Đánh giá trường còn thiếu
  const missingFields: ("fullName" | "phone" | "dateTime")[] = [];
  if (!extractedName) missingFields.push("fullName");
  if (!extractedPhone) missingFields.push("phone");
  if (!dateTimeIso || isInvalidDate || isInvalidTime) missingFields.push("dateTime");

  const isComplete = Boolean(
    extractedName &&
    extractedPhone &&
    dateTimeIso &&
    !isInvalidDate &&
    !isInvalidTime
  );

  return {
    fullName: extractedName,
    phone: extractedPhone,
    dateStr,
    timeStr,
    dateTimeIso,
    eventType,
    eventTypeName: eventTypeNames[eventType],
    guestsCount,
    notes: existingContext?.notes || clean,
    isComplete,
    missingFields,
    isInvalidDate,
    dateInvalidReason,
    isInvalidTime,
    timeInvalidReason,
  };
}

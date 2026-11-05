import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_BOT_CONFIG, DEFAULT_KNOWLEDGE_BASE } from "@/lib/mock-service";

// Verification token cho Botcake (có thể cấu hình trong .env hoặc mặc định)
const BOTCAKE_VERIFY_TOKEN =
  process.env.BOTCAKE_VERIFY_TOKEN || "omnichat_kstudy_vibecoding_2026";

/**
 * GET: Dùng để xác thực Webhook khi cấu hình trên Dashboard Botcake / Pancake
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode") || searchParams.get("mode");
  const token = searchParams.get("hub.verify_token") || searchParams.get("verify_token");
  const challenge = searchParams.get("hub.challenge") || searchParams.get("challenge");

  if (mode === "subscribe" && token === BOTCAKE_VERIFY_TOKEN) {
    console.log("✅ Botcake Webhook verified successfully!");
    return new NextResponse(challenge || "VERIFIED", { status: 200 });
  }

  // Nếu không khớp token hoặc query test
  if (token === BOTCAKE_VERIFY_TOKEN) {
    return NextResponse.json({ success: true, message: "Webhook is alive and ready!" });
  }

  return NextResponse.json(
    {
      status: "ready",
      message: "OmniChat Botcake Webhook Endpoint is running",
      instructions: "Set Webhook URL to this endpoint and verify token to BOTCAKE_VERIFY_TOKEN",
    },
    { status: 200 }
  );
}

/**
 * POST: Nhận sự kiện tin nhắn từ Facebook Page và Zalo cá nhân qua Botcake
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📩 [Botcake Webhook Payload]:", JSON.stringify(body, null, 2));

    // 1. Phân giải cấu trúc payload linh hoạt (Hỗ trợ cấu trúc Pancake/Botcake)
    let platform: "facebook" | "zalo" | "web" = "facebook";
    let externalThreadId = "";
    let customerName = "Khách hàng";
    let customerPhone = "";
    let customerAvatar = "";
    let messageText = "";

    // Phân tích nền tảng
    if (body.platform) {
      platform = body.platform.toLowerCase().includes("zalo") ? "zalo" : "facebook";
    } else if (body.type && body.type.toLowerCase().includes("zalo")) {
      platform = "zalo";
    } else if (body.page_id && String(body.page_id).startsWith("zalo")) {
      platform = "zalo";
    }

    // Cấu trúc Pancake/Botcake tiêu chuẩn: entry[].changes[].value...
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.messaging && Array.isArray(entry.messaging)) {
          for (const msgEvent of entry.messaging) {
            externalThreadId = msgEvent.sender?.id || msgEvent.recipient?.id || "";
            customerName = msgEvent.sender?.name || `Khách hàng ${externalThreadId.slice(-4)}`;
            messageText = msgEvent.message?.text || "";
          }
        }
      }
    }
    // Cấu trúc webhook trực tiếp từ Botcake custom webhook
    else if (body.sender || body.customer || body.message) {
      externalThreadId =
        body.conversation_id ||
        body.thread_id ||
        body.sender?.id ||
        body.customer?.id ||
        `botcake-${Date.now()}`;

      customerName =
        body.customer?.name ||
        body.sender?.name ||
        body.customer_name ||
        `Khách hàng ${externalThreadId.slice(-4)}`;

      customerPhone =
        body.customer?.phone || body.sender?.phone || body.phone || "";

      customerAvatar =
        body.customer?.avatar || body.sender?.avatar || body.avatar || "";

      messageText =
        body.message?.text ||
        body.message?.content ||
        body.text ||
        body.content ||
        "";
    }

    if (!messageText) {
      return NextResponse.json({
        success: true,
        note: "Đã nhận webhook nhưng không có nội dung tin nhắn văn bản để xử lý",
      });
    }

    // 2. Bóc tách nhanh SĐT & Email từ tin nhắn (Regex)
    const phoneRegex = /(0[3|5|7|8|9][0-9]{8})\b/g;
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

    const matchedPhones = messageText.match(phoneRegex);
    const matchedEmails = messageText.match(emailRegex);

    if (matchedPhones && matchedPhones.length > 0 && !customerPhone) {
      customerPhone = matchedPhones[0];
    }
    const detectedEmail = matchedEmails ? matchedEmails[0] : undefined;

    // 3. Tìm hoặc Tạo Cuộc hội thoại trong Supabase
    let conversationId = "";
    let isAiEnabled = true;

    try {
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id, is_ai_enabled")
        .eq("external_thread_id", externalThreadId)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
        isAiEnabled = existingConv.is_ai_enabled;

        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            customer_phone: customerPhone || undefined,
          })
          .eq("id", conversationId);
      } else {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            platform,
            external_thread_id: externalThreadId,
            customer_name: customerName,
            customer_avatar: customerAvatar,
            customer_phone: customerPhone,
            is_ai_enabled: true,
            status: "active",
            last_message_at: new Date().toISOString(),
          })
          .select("id, is_ai_enabled")
          .single();

        if (newConv) {
          conversationId = newConv.id;
          isAiEnabled = newConv.is_ai_enabled;
        }
      }

      // Lưu tin nhắn của khách
      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_type: "customer",
          content: messageText,
          created_at: new Date().toISOString(),
        });
      }

      // Tự động tạo / cập nhật Lead N1 nếu khách để lại SĐT
      if (customerPhone) {
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .eq("phone", customerPhone)
          .maybeSingle();

        if (!existingLead) {
          await supabase.from("leads").insert({
            full_name: customerName,
            phone: customerPhone,
            email: detectedEmail,
            course_interest: "Gói tiệc & Sảnh sự kiện Golden Palace",
            stage: "N1", // Bậc N1: Lead thô
            source: platform,
            conversation_id: conversationId || undefined,
            notes: `Lead đa kênh Botcake [${platform.toUpperCase()}]: "${messageText}"`,
          });
          console.log(`🎯 Đã tạo Lead N1 mới cho SĐT ${customerPhone}`);

          // Gửi cảnh báo Telegram tức thì cho Quản lý tiệc
          const tgToken = process.env.TELEGRAM_BOT_TOKEN;
          const tgChatId = process.env.TELEGRAM_CHAT_ID;
          if (tgToken && tgChatId) {
            try {
              fetch("https://api.telegram.org/bot" + tgToken + "/sendMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: tgChatId,
                  text: `🎯 *[OMNICHAT] LEAD N1 MỚI!*\n━━━━━━━━━━━━━━━━━━\n👤 *Khách:* ${customerName}\n📞 *SĐT:* \`${customerPhone}\`\n🌐 *Kênh:* #${platform.toUpperCase()}\n💬 *Tin nhắn:* _"${messageText}"_\n🏛️ *Dịch vụ:* Gói tiệc & Sảnh cưới Golden Palace`,
                  parse_mode: "Markdown",
                }),
              }).catch(() => {});
            } catch (e) {}
          }
        }
      }
    } catch (dbError) {
      console.warn("Lưu trữ Supabase gặp lỗi (chạy ở chế độ standalone):", dbError);
    }

    // 4. Xử lý phản hồi tự động của Bot nếu AI được bật
    let botReplyText = "";
    if (isAiEnabled) {
      // Kiểm tra giờ trực (Working hours)
      const now = new Date();
      const currentHour = now.getHours();
      const startHour = DEFAULT_BOT_CONFIG.workingHours.start;
      const endHour = DEFAULT_BOT_CONFIG.workingHours.end;

      const isWorkingHour = currentHour >= startHour && currentHour < endHour;

      if (!isWorkingHour) {
        botReplyText = DEFAULT_BOT_CONFIG.outOfHoursMessage;
      } else {
        const lowerMsg = messageText.toLowerCase();

        // Đối chiếu FAQ
        const matchedFaq = DEFAULT_KNOWLEDGE_BASE.find(
          (faq) =>
            lowerMsg.includes(faq.category) ||
            faq.tags?.some((t) => lowerMsg.includes(t)) ||
            (faq.question &&
              faq.question
                .toLowerCase()
                .split(" ")
                .filter((w) => w.length > 3)
                .some((kw) => lowerMsg.includes(kw)))
        );

        if (matchedFaq) {
          botReplyText = matchedFaq.answer;
        } else if (customerPhone) {
          botReplyText = `Dạ Golden Palace đã ghi nhận số điện thoại ${customerPhone} của Quý khách. Chuyên viên tư vấn tiệc sẽ liên hệ gửi menu chi tiết và xếp lịch đón tiếp anh/chị ngay nhé!`;
        } else {
          botReplyText =
            "Dạ Golden Palace xin chào Quý khách! Quý khách đang quan tâm đến tiệc cưới, tiệc hội nghị hay cần tư vấn thực đơn và xem sảnh trực tiếp ạ?";
        }
      }

      // Lưu tin nhắn Bot vào Supabase nếu có conversationId
      if (conversationId && botReplyText) {
        try {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            sender_type: "bot",
            content: botReplyText,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          // ignore
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        platform,
        externalThreadId,
        customerName,
        customerPhone,
        messageReceived: messageText,
        aiReplied: Boolean(botReplyText),
        botReply: botReplyText,
      },
    });
  } catch (error: any) {
    console.error("Lỗi xử lý webhook Botcake:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

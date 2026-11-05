import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      botToken = process.env.TELEGRAM_BOT_TOKEN,
      chatId = process.env.TELEGRAM_CHAT_ID,
      type = "lead",
      data = {},
    } = body;

    if (!botToken || !chatId) {
      return NextResponse.json(
        {
          success: false,
          error: "Chưa cấu hình Telegram Bot Token hoặc Chat ID",
        },
        { status: 400 }
      );
    }

    let messageText = "";
    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    if (type === "lead") {
      messageText = `🎯 *[OMNICHAT AI] PHÁT HIỆN LEAD MỚI!*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Khách hàng:* ${data.name || "Khách chưa định danh"}\n` +
        `📞 *Số điện thoại:* \`${data.phone || "Chưa có"}\`\n` +
        `🏛️ *Quan tâm:* ${data.interest || "Gói tiệc & Sảnh cưới Golden Palace"}\n` +
        `🌐 *Kênh nguồn:* #${data.platform || "Facebook/Zalo"}\n` +
        `💬 *Nội dung chat:* _"${data.message || ""}"_\n` +
        `⏰ *Thời gian:* ${now}\n` +
        `👉 _Hãy mở Inbox OmniChat để liên hệ chăm sóc ngay!_`;
    } else if (type === "guardrail") {
      messageText = `🚨 *[OMNICHAT AI] CẢNH BÁO VI PHẠM GUARDRAIL!*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Khách:* ${data.name || "Khách hàng"}\n` +
        `⚠️ *Cảnh báo:* ${data.warning || "Yêu cầu chiết khấu giá ngoài chính sách"}\n` +
        `💬 *Nội dung vi phạm:* _"${data.message || ""}"_\n` +
        `🤖 *Bot đã xử lý:* Đã từ chối cam kết sai và chuyển tiếp Quản lý.\n` +
        `⏰ *Thời gian:* ${now}`;
    } else if (type === "appointment") {
      messageText = `📅 *[OMNICHAT AI] YÊU CẦU ĐẶT LỊCH HẸN MỚI!*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Khách hàng:* ${data.name || "Khách hàng"}\n` +
        `📞 *Số điện thoại:* \`${data.phone || "Chưa có"}\`\n` +
        `🤝 *Loại hẹn:* Xem sảnh tiệc & Thử món thực đơn\n` +
        `⏰ *Thời gian hẹn:* ${data.appointmentTime || "Cuối tuần này"}\n` +
        `🌐 *Kênh:* #${data.platform || "Botcake"}`;
    } else {
      // Test message
      messageText = `🔔 *[OMNICHAT AI] THÔNG BÁO TEST HỆ THỐNG*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ Kết nối Telegram Bot thành công!\n` +
        `🏢 Đơn vị: Trung tâm Tiệc cưới & Sự kiện Golden Palace\n` +
        `⏰ Thời gian: ${now}\n` +
        `Hệ thống sẵn sàng gửi thông báo Lead tự động 24/7.`;
    }

    // Gửi request đến Telegram Bot API
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(telegramApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "Markdown",
      }),
    });

    const result = await res.json();

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.description || "Lỗi khi gọi Telegram API",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã gửi thông báo Telegram thành công!",
      messageId: result.result?.message_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

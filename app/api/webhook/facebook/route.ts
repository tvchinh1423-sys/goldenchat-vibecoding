import { NextRequest, NextResponse } from "next/server";
import { loadCloudStore, updateCloudStore } from "@/lib/sync/store";
import {
  FB_VERIFY_TOKEN,
  FB_PAGE_ACCESS_TOKEN,
  sendFacebookMessage,
  fetchFacebookProfile,
} from "@/lib/facebook/client";
import { processChatRequest } from "@/app/api/simulator/chat/route";
import { extractLeadInfo } from "@/lib/lead-extractor";
import { supabase } from "@/lib/supabase";
import type { Message, Conversation } from "@/lib/inbox/types";
import type { CRMLead } from "@/lib/crm/model";

// Regex chuẩn hóa bắt số điện thoại và email Việt Nam linh hoạt
const PHONE_REGEX = /(?<![\w])(?:\+84|84|0)[\s.-]?[35789](?:[\s.-]?\d){8}(?!\d)/g;
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

/**
 * GET: Xác thực Webhook với Meta for Developers
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === FB_VERIFY_TOKEN) {
    console.log("✅ [Facebook Webhook] Đã xác thực thành công!");
    return new Response(challenge || "VERIFIED", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    {
      status: "ready",
      message: "Facebook Messenger Webhook is alive",
      verify_token: FB_VERIFY_TOKEN,
    },
    { status: 200 }
  );
}

/**
 * POST: Nhận tin nhắn từ Facebook Messenger và gửi câu trả lời tự động qua Graph API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== "page") {
      return NextResponse.json({ status: "IGNORED" }, { status: 200 });
    }

    // Duyệt qua tất cả entries
    for (const entry of body.entry || []) {
      for (const messagingEvent of entry.messaging || []) {
        // Bỏ qua tin nhắn do bot gửi (echo)
        if (messagingEvent.message?.is_echo) {
          continue;
        }

        const senderId = messagingEvent.sender?.id;
        const rawText = messagingEvent.message?.text?.trim();
        const hasAttachments = Array.isArray(messagingEvent.message?.attachments) && messagingEvent.message.attachments.length > 0;
        const userText = rawText || (hasAttachments ? "[Hình ảnh/Tệp đính kèm]" : "");

        if (!senderId || !userText) continue;

        console.log(`📩 [Facebook Webhook] Nhận tin từ PSID ${senderId}: "${userText}"`);

        const convId = `facebook-${senderId}`;
        const store = loadCloudStore();
        const existing = store.conversations.find((c) => c.id === convId);

        // Kiểm tra xem hội thoại này AI có đang bật không (nếu nhân viên tắt AI thì không tự động trả lời)
        const isAiEnabled = existing ? existing.aiEnabled !== false : true;

        let botReply = "";

        if (isAiEnabled) {
          botReply =
            "Dạ Golden Palace xin chào Quý khách! Em có thể hỗ trợ tư vấn thực đơn tiệc cưới, giá bàn hay đặt lịch xem sảnh tại 98 Đông A ạ?";
          try {
            const simRes = await processChatRequest({
              channel: "facebook",
              message: userText,
              sender_id: senderId,
            });
            const simData = await simRes.json();
            if (simData?.reply) {
              botReply = simData.reply;
            }
          } catch (e) {
            console.warn("Lỗi xử lý chatbot FAQ:", e);
          }

          // 1. Gửi tin nhắn trả lời ngược lại Facebook Messenger qua Meta Graph API
          try {
            await sendFacebookMessage(senderId, botReply);
            console.log(`📤 [Facebook Webhook] Đã gửi trả lời tự động cho PSID ${senderId}`);
          } catch (sendErr) {
            console.error("Lỗi gửi tin qua Meta Graph API:", sendErr);
          }
        } else {
          console.log(`ℹ️ [Facebook Webhook] AI đang tắt cho ${convId}, nhân viên tiếp quản thủ công.`);
        }

        // 2. Bóc tách thông tin Khách & Lead (Số điện thoại, Email, Số bàn, Ngày cưới)
        const matchedPhones = userText.match(PHONE_REGEX);
        const matchedEmails = userText.match(EMAIL_REGEX);
        const customerPhone = matchedPhones
          ? matchedPhones[0].replace(/[\s.-]/g, "").replace(/^\+?84/, "0")
          : "";
        const customerEmail = matchedEmails ? matchedEmails[0] : "";
        const leadInfo = extractLeadInfo(userText);

        // Lấy họ tên khách hàng thật từ Facebook Graph API nếu chưa có
        let customerName = existing?.name;
        if (!customerName || customerName.includes("Khách Facebook")) {
          try {
            const profile = await fetchFacebookProfile(senderId);
            if (profile?.name) {
              customerName = profile.name;
            }
          } catch {}
        }
        if (!customerName) {
          customerName =
            leadInfo.fullName || `Khách Facebook (${senderId.slice(-4)})`;
        }

        // 3. Đồng bộ tin nhắn và Lead vào Cloud Store
        try {
          const nowIso = new Date().toISOString();
          const custMsg: Message = {
            id: `msg-fb-c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender: "customer",
            content: userText,
            createdAt: nowIso,
          };

          const newMessages: Message[] = [custMsg];
          if (isAiEnabled && botReply) {
            newMessages.push({
              id: `msg-fb-b-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
              sender: "bot",
              content: botReply,
              createdAt: new Date(Date.now() + 500).toISOString(),
            });
          }

          let targetConv: Conversation;
          if (existing) {
            existing.name = customerName;
            existing.messages.push(...newMessages);
            existing.unread = (existing.unread || 0) + 1;
            existing.status = "active";
            targetConv = existing;
          } else {
            targetConv = {
              id: convId,
              name: customerName,
              channel: "facebook",
              avatarColor: "sky",
              status: "active",
              aiEnabled: isAiEnabled,
              assignedTo: "unassigned",
              unread: 1,
              note: "Hội thoại Fanpage Messenger trực tiếp",
              messages: newMessages,
            };
            store.conversations.unshift(targetConv);
          }

          // 4. ĐẢM BẢO 100% GHI NHẬN VÀO LEAD CRM KHI CÓ SỐ ĐIỆN THOẠI
          let leadsToUpdate: CRMLead[] = [];
          if (customerPhone) {
            targetConv.lead = {
              id: `lead-${customerPhone}`,
              conversation_id: convId,
              full_name: customerName,
              phone: customerPhone,
              email: customerEmail || "",
              demand_notes: userText,
              source: "facebook",
              status: "new",
              created_at: targetConv.lead?.created_at || nowIso,
            };

            const newCrmLead: CRMLead = {
              id: targetConv.lead.id,
              inbox_reference: convId,
              full_name: customerName,
              phone: customerPhone,
              email: customerEmail || "",
              notes: `Lead từ Facebook Messenger: "${userText}"`,
              source: "facebook",
              stage: leadInfo.tableCount || leadInfo.eventDate ? "N2" : "N1",
              assigned_to: "Ngọc Khánh",
              event_date: leadInfo.eventDate || "",
              table_count: leadInfo.tableCount || null,
              created_at: nowIso,
              last_touched_at: nowIso,
            };
            leadsToUpdate.push(newCrmLead);
            console.log(`🎯 [Facebook Webhook] Đã tạo Lead CRM cho SĐT ${customerPhone} (${customerName})`);

            // Gửi cảnh báo Telegram Alert tức thì cho Quản lý tiệc
            const tgToken = process.env.TELEGRAM_BOT_TOKEN;
            const tgChatId = process.env.TELEGRAM_CHAT_ID;
            if (tgToken && tgChatId) {
              try {
                fetch("https://api.telegram.org/bot" + tgToken + "/sendMessage", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: tgChatId,
                    text: `🎯 *[OMNICHAT] LEAD FACEBOOK MỚI!*\n━━━━━━━━━━━━━━━━━━\n👤 *Khách:* ${customerName}\n📞 *SĐT:* \`${customerPhone}\`\n🌐 *Kênh:* #FACEBOOK\n💬 *Tin nhắn:* _"${userText}"_\n🏛️ *Dịch vụ:* Gói tiệc & Sảnh cưới Golden Palace`,
                    parse_mode: "Markdown",
                  }),
                }).catch(() => {});
              } catch {}
            }

            // Lưu Lead vào Supabase nếu có kết nối
            try {
              await supabase.from("leads").upsert(
                {
                  full_name: customerName,
                  phone: customerPhone,
                  email: customerEmail || undefined,
                  course_interest: "Gói tiệc & Sảnh sự kiện Golden Palace",
                  stage: newCrmLead.stage,
                  source: "facebook",
                  conversation_id: convId,
                  notes: `Lead Facebook Messenger: "${userText}"`,
                },
                { onConflict: "phone" }
              );
            } catch (dbErr) {
              // ignore db error in standalone mode
            }
          }

          updateCloudStore({
            conversations: store.conversations,
            crm: leadsToUpdate.length > 0 ? { leads: leadsToUpdate } : undefined,
          });
        } catch (syncErr) {
          console.warn("Lỗi đồng bộ Cloud Store từ FB Webhook:", syncErr);
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Lỗi xử lý Facebook Webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

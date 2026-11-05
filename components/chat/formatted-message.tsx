"use client";

import React from "react";
import {
  ExternalLink,
  MapPin,
  Utensils,
  Building2,
  Calculator,
  Gift,
  FileText,
  Sparkles,
  Globe,
  PhoneCall,
} from "lucide-react";

interface FormattedMessageProps {
  text: string;
  isUser?: boolean;
  showActionChips?: boolean;
  className?: string;
}

interface Segment {
  type: "text" | "link" | "phone";
  content?: string;
  label?: string;
  url?: string;
  phone?: string;
}

interface ActionMeta {
  url: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  isPhone?: boolean;
}

// Hàm làm sạch URL khỏi dấu câu dính kèm ở cuối như .,!?:)
function cleanUrl(raw: string): { clean: string; trailing: string } {
  const match = raw.match(/[.,;!?):>]+$/);
  if (!match) return { clean: raw, trailing: "" };
  const trailing = match[0];
  const clean = raw.slice(0, raw.length - trailing.length);
  return { clean, trailing };
}

// Phân tích văn bản thành các đoạn text, link markdown, raw URL và SĐT
function parseSegments(text: string): Segment[] {
  if (!text) return [];

  // 1: Markdown link [label](url)
  // 4: Raw URL https?://...
  // 5: Phone 0228..., 09...
  const regex =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s]+)|(\b0[2-9](?:\d{1,2}[\s.-]?\d{3}[\s.-]?\d{3,4}|\d{8,9})\b)/g;

  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // Markdown link
      segments.push({
        type: "link",
        label: match[2],
        url: match[3],
      });
    } else if (match[4]) {
      // Raw URL
      const { clean, trailing } = cleanUrl(match[4]);
      segments.push({
        type: "link",
        label: clean,
        url: clean,
      });
      if (trailing) {
        segments.push({ type: "text", content: trailing });
      }
    } else if (match[5]) {
      // Phone number
      const phoneText = match[5];
      const cleanPhone = phoneText.replace(/[\s.-]/g, "");
      segments.push({
        type: "phone",
        label: phoneText,
        phone: cleanPhone,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  return segments;
}

// Nhận diện loại liên kết và tạo nút bấm 1-chạm mở ngay
function getActionMeta(url: string): ActionMeta {
  const u = url.toLowerCase();

  if (u.includes("maps.app.goo.gl") || u.includes("google.com/maps")) {
    return {
      url,
      label: "Mở Google Maps Chỉ Đường",
      icon: MapPin,
      colorClass:
        "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/90",
    };
  }

  if (u.includes("thuc-don")) {
    return {
      url,
      label: "Xem Menu Thực Đơn",
      icon: Utensils,
      colorClass:
        "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/90",
    };
  }

  if (u.includes("khong-gian/tang-2")) {
    return {
      url,
      label: "Xem Sảnh Tầng 2 (750 khách)",
      icon: Building2,
      colorClass:
        "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90",
    };
  }

  if (u.includes("khong-gian/tang-3")) {
    return {
      url,
      label: "Xem Sảnh Tầng 3 (650 khách)",
      icon: Building2,
      colorClass:
        "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90",
    };
  }

  if (u.includes("khong-gian/tang-4")) {
    return {
      url,
      label: "Xem Sảnh Tầng 4 (300 khách)",
      icon: Building2,
      colorClass:
        "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90",
    };
  }

  if (u.includes("khong-gian/quay-bar")) {
    return {
      url,
      label: "Xem Quầy Bar Tầng 1",
      icon: Building2,
      colorClass:
        "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90",
    };
  }

  if (u.includes("khong-gian/phong-vip")) {
    return {
      url,
      label: "Xem Không Gian Phòng VIP",
      icon: Building2,
      colorClass:
        "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90",
    };
  }

  if (u.includes("khong-gian")) {
    return {
      url,
      label: "Xem Ảnh Không Gian Sảnh",
      icon: Building2,
      colorClass:
        "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90",
    };
  }

  if (u.includes("du-toan-chi-phi")) {
    return {
      url,
      label: "Tính Dự Toán Chi Phí",
      icon: Calculator,
      colorClass:
        "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/90",
    };
  }

  if (u.includes("dich-vu")) {
    return {
      url,
      label: "Bảng Giá Dịch Vụ Cưới",
      icon: Gift,
      colorClass:
        "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200/90",
    };
  }

  if (u.includes("tinyurl.com/thongtintieccuoi") || u.includes("brochure")) {
    return {
      url,
      label: "Xem Brochure Tiệc Cưới",
      icon: FileText,
      colorClass:
        "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/90",
    };
  }

  if (u.includes("ca-nhan-hoa")) {
    return {
      url,
      label: "Thiệp Cưới Online & Phông LED",
      icon: Sparkles,
      colorClass:
        "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200/90",
    };
  }

  if (u.includes("goldenpalacenamdinh.com")) {
    return {
      url,
      label: "Truy Cập Website",
      icon: Globe,
      colorClass:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300/80",
    };
  }

  return {
    url,
    label: "Mở Liên Kết Trực Tiếp",
    icon: ExternalLink,
    colorClass:
      "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/90",
  };
}

export function FormattedMessage({
  text,
  isUser = false,
  showActionChips = true,
  className = "",
}: FormattedMessageProps) {
  const segments = React.useMemo(() => parseSegments(text), [text]);

  // Trích xuất danh sách link và SĐT duy nhất để tạo Nút hành động nhanh
  const actionItems = React.useMemo(() => {
    if (!showActionChips || isUser) return [];

    const uniqueUrls = new Set<string>();
    const actions: ActionMeta[] = [];

    // Tìm các SĐT Hotline chính thức
    const phones = segments.filter((s) => s.type === "phone" && s.phone);
    for (const p of phones) {
      if (p.phone && !uniqueUrls.has(p.phone)) {
        uniqueUrls.add(p.phone);
        actions.push({
          url: `tel:${p.phone}`,
          label: `Gọi Hotline ${p.label || p.phone}`,
          icon: PhoneCall,
          colorClass:
            "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/90",
          isPhone: true,
        });
      }
    }

    // Tìm các URL
    const links = segments.filter((s) => s.type === "link" && s.url);
    for (const l of links) {
      if (l.url && !uniqueUrls.has(l.url)) {
        uniqueUrls.add(l.url);
        actions.push(getActionMeta(l.url));
      }
    }

    return actions;
  }, [segments, showActionChips, isUser]);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* VĂN BẢN VỚI INLINE LINK CLICKABLE 100% */}
      <p className="whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]">
        {segments.map((seg, idx) => {
          if (seg.type === "text") {
            return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
          }

          if (seg.type === "link" && seg.url) {
            return (
              <a
                key={idx}
                href={seg.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-0.5 font-medium underline underline-offset-2 transition-colors duration-150 ${
                  isUser
                    ? "text-white hover:text-blue-100 decoration-white/60 hover:decoration-white"
                    : "text-blue-600 hover:text-blue-800 decoration-blue-300 hover:decoration-blue-600"
                }`}
                title={`Mở trang: ${seg.url}`}
              >
                <span>{seg.label || seg.url}</span>
                <ExternalLink className="inline-block w-3 h-3 ml-0.5 opacity-70 shrink-0" />
              </a>
            );
          }

          if (seg.type === "phone" && seg.phone) {
            return (
              <a
                key={idx}
                href={`tel:${seg.phone}`}
                className={`inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 transition-colors duration-150 ${
                  isUser
                    ? "text-white hover:text-rose-100 decoration-white/60"
                    : "text-rose-600 hover:text-rose-700 decoration-rose-300 hover:decoration-rose-600"
                }`}
                title={`Chạm để gọi ngay: ${seg.label}`}
              >
                <PhoneCall className="inline-block w-3 h-3 mr-0.5 opacity-80 shrink-0" />
                <span>{seg.label}</span>
              </a>
            );
          }

          return null;
        })}
      </p>

      {/* NÚT BẤM 1-CHẠM MỞ NGAY (QUICK ACTION BUTTONS) */}
      {actionItems.length > 0 && (
        <div className="pt-2 border-t border-slate-100/80 flex flex-wrap gap-1.5">
          {actionItems.map((action, i) => {
            const Icon = action.icon;
            return (
              <a
                key={i}
                href={action.url}
                target={action.isPhone ? undefined : "_blank"}
                rel={action.isPhone ? undefined : "noopener noreferrer"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-150 border shadow-2xs hover:shadow-xs active:scale-95 ${action.colorClass}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{action.label}</span>
                {!action.isPhone && (
                  <ExternalLink className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

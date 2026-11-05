import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { KnowledgeItem } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const { sheetUrl } = await req.json();

    if (!sheetUrl || !sheetUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đường link Google Sheet" },
        { status: 400 }
      );
    }

    let csvExportUrl = sheetUrl.trim();

    // 1. Tự động chuyển đổi các dạng URL Google Sheets sang URL xuất CSV
    const match = csvExportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      // Lấy gid nếu có (ví dụ: #gid=123456)
      const gidMatch = csvExportUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : "0";
      csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    console.log("📥 Đang tải dữ liệu từ Google Sheets:", csvExportUrl);

    // 2. Tải file CSV từ Google Sheets
    const response = await fetch(csvExportUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OmniChat/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không thể truy cập Google Sheet. Hãy đảm bảo bạn đã mở quyền 'Bất kỳ ai có liên kết đều có thể xem' (Anyone with the link can view) trên Google Drive.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Đọc dữ liệu bằng XLSX
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Google Sheet không có dữ liệu" },
        { status: 400 }
      );
    }

    // 4. Chuẩn hóa các cột
    const parsedItems: KnowledgeItem[] = [];

    rawRows.forEach((row, idx) => {
      const qKey = Object.keys(row).find((k) =>
        /câu\s*hỏi|cau\s*hoi|question|faq|tiêu\s*đề/i.test(k.trim())
      );
      const aKey = Object.keys(row).find((k) =>
        /câu\s*trả\s*lời|cau\s*tra\s*loi|trả\s*lời|answer|đáp|nội\s*dung|content/i.test(
          k.trim()
        )
      );
      const cKey = Object.keys(row).find((k) =>
        /danh\s*mục|danh\s*muc|category|chủ\s*đề|nhóm/i.test(k.trim())
      );
      const tKey = Object.keys(row).find((k) =>
        /tags|từ\s*khóa|tu\s*khoa/i.test(k.trim())
      );

      const question = qKey ? String(row[qKey]).trim() : "";
      const answer = aKey ? String(row[aKey]).trim() : "";
      const category = cKey ? String(row[cKey]).trim() : "thuc_don";
      const tagsRaw = tKey ? String(row[tKey]).trim() : "";

      if (question && answer) {
        const tags = tagsRaw
          ? tagsRaw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
          : [];

        parsedItems.push({
          id: `gsheet-${Date.now()}-${idx}`,
          question,
          answer,
          category,
          tags,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    });

    if (parsedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không tìm thấy cột 'Câu hỏi' và 'Câu trả lời' trong Google Sheet.",
        },
        { status: 400 }
      );
    }

    // Lưu vào Supabase nếu có
    try {
      await supabase.from("knowledge_base").insert(
        parsedItems.map(({ id, ...rest }) => rest)
      );
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ thành công ${parsedItems.length} câu hỏi FAQ từ Google Sheet!`,
      count: parsedItems.length,
      items: parsedItems,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi đồng bộ Google Sheet: " + (err.message || "Không xác định"),
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { KnowledgeItem } from "@/types/database";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn file Excel hoặc CSV" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Đọc file Excel bằng thư viện XLSX
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Chuyển sheet sang dạng JSON
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "File Excel không có dữ liệu" },
        { status: 400 }
      );
    }

    // Chuẩn hóa và map các cột linh hoạt
    const parsedItems: Omit<KnowledgeItem, "id">[] = [];

    for (const row of rawRows) {
      // Tìm key cho câu hỏi
      const qKey = Object.keys(row).find((k) =>
        /câu\s*hỏi|cau\s*hoi|question|faq|tiêu\s*đề/i.test(k.trim())
      );
      // Tìm key cho câu trả lời
      const aKey = Object.keys(row).find((k) =>
        /câu\s*trả\s*lời|cau\s*tra\s*loi|trả\s*lời|answer|đáp|dap|nội\s*dung|content/i.test(
          k.trim()
        )
      );
      // Tìm key cho danh mục
      const cKey = Object.keys(row).find((k) =>
        /danh\s*mục|danh\s*muc|category|chủ\s*đề|nhóm/i.test(k.trim())
      );
      // Tìm key cho tags
      const tKey = Object.keys(row).find((k) =>
        /tags|từ\s*khóa|tu\s*khoa/i.test(k.trim())
      );

      const question = qKey ? String(row[qKey]).trim() : "";
      const answer = aKey ? String(row[aKey]).trim() : "";
      const category = cKey ? String(row[cKey]).trim() : "faq";
      const tagsRaw = tKey ? String(row[tKey]).trim() : "";

      if (question && answer) {
        const tags = tagsRaw
          ? tagsRaw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
          : [];

        parsedItems.push({
          question,
          answer,
          category: category || "faq",
          tags,
          is_active: true,
        });
      }
    }

    if (parsedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không tìm thấy cột hợp lệ. Cột cần có tên chứa 'Câu hỏi' và 'Câu trả lời'.",
        },
        { status: 400 }
      );
    }

    // Thử lưu vào Supabase (nếu có kết nối)
    let savedToDatabase = false;
    let savedData: KnowledgeItem[] = [];

    try {
      const { data, error } = await supabase
        .from("knowledge_base")
        .insert(parsedItems)
        .select();

      if (!error && data) {
        savedToDatabase = true;
        savedData = data as KnowledgeItem[];
      }
    } catch (dbErr) {
      console.warn("Chưa kết nối Supabase, fallback trả về parsed rows:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Đã nạp thành công ${parsedItems.length} câu hỏi FAQ từ file Excel!`,
      count: parsedItems.length,
      savedToDatabase,
      items: savedToDatabase
        ? savedData
        : parsedItems.map((item, idx) => ({
            ...item,
            id: `excel-${Date.now()}-${idx}`,
            created_at: new Date().toISOString(),
          })),
    });
  } catch (err: any) {
    console.error("Lỗi khi xử lý file Excel:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể đọc file: " + (err.message || "Định dạng không hỗ trợ"),
      },
      { status: 500 }
    );
  }
}

// Endpoint GET trả về file Excel mẫu
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isTemplate = searchParams.get("template") === "true";

  if (isTemplate) {
    const sampleData = [
      {
        "Danh mục": "Học phí",
        "Câu hỏi": "Học phí khóa Digital Marketing & AI (ENTD01) là bao nhiêu?",
        "Câu trả lời":
          "Dạ học phí chuẩn khóa ENTD01 là 15.000.000đ. Đang có ưu đãi đăng ký sớm trong tháng giảm còn 12.500.000đ, hỗ trợ trả góp 0% lãi suất.",
        "Từ khóa": "học phí, ưu đãi, trả góp",
      },
      {
        "Danh mục": "Lịch học",
        "Câu hỏi": "Khi nào khai giảng khóa mới?",
        "Câu trả lời":
          "Khóa ENTD01 gần nhất khai giảng vào ngày 15 hàng tháng. Lịch học lớp Tối 2-4-6 hoặc Cuối tuần.",
        "Từ khóa": "lịch học, khai giảng",
      },
      {
        "Danh mục": "Học thử",
        "Câu hỏi": "Tôi có được học thử trước không?",
        "Câu trả lời":
          "Dạ có ạ! Kstudy có 01 buổi học thử và định hướng 1-1 miễn phí. Bạn để lại SĐT để ban đào tạo xếp lịch nhé!",
        "Từ khóa": "học thử, tư vấn 1-1",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FAQ_Kstudy");

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="FAQ_Mau_OmniChat.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  }

  // Lấy danh sách FAQ hiện có
  try {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, items: data });
    }
  } catch (e) {
    // fallback
  }

  return NextResponse.json({ success: true, items: [] });
}

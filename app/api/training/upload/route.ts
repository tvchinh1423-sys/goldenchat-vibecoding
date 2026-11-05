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
      const qKey = Object.keys(row).find((k) =>
        /câu\s*hỏi|cau\s*hoi|question|faq|tiêu\s*đề/i.test(k.trim())
      );
      const aKey = Object.keys(row).find((k) =>
        /câu\s*trả\s*lời|cau\s*tra\s*loi|trả\s*lời|answer|đáp|dap|nội\s*dung|content/i.test(
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
        "Danh mục": "Thực đơn bàn tiệc",
        "Câu hỏi": "Thực đơn tiệc cưới bao nhiêu một bàn?",
        "Câu trả lời":
          "Dạ thực đơn tiệc cưới tại Golden Palace dao động từ 2.800.000đ - 6.500.000đ/bàn 10 khách với hơn 150 món ăn Á - Âu tinh hoa. Tặng kèm gói đồ uống suốt tiệc cho hợp đồng từ 30 bàn trở lên ạ!",
        "Từ khóa": "thực đơn, giá bàn, đồ uống",
      },
      {
        "Danh mục": "Sảnh tiệc & Sức chứa",
        "Câu hỏi": "Sảnh tiệc bên mình chứa được bao nhiêu khách?",
        "Câu trả lời":
          "Dạ Golden Palace sở hữu hệ thống đại sảnh sức chứa từ 150 đến hơn 1.200 khách, trần cao không cột cùng màn hình LED 4K hiện đại bậc nhất.",
        "Từ khóa": "sảnh tiệc, sức chứa, quy mô",
      },
      {
        "Danh mục": "Chương trình ưu đãi",
        "Câu hỏi": "Hiện có chương trình ưu đãi gì cho mùa cưới không?",
        "Câu trả lời":
          "Dạ Golden Palace đang triển khai gói 'Khởi Sắc Tình Yêu': Tặng 100% gói trang trí sảnh cưới hoa tươi cao cấp, tặng MC chuyên nghiệp, vũ đoàn khai tiệc và hỗ trợ tặng bàn tiệc theo số lượng thực tế ạ!",
        "Từ khóa": "ưu đãi, khuyến mãi, hoa tươi",
      },
      {
        "Danh mục": "Đặt cọc & Hợp đồng",
        "Câu hỏi": "Đặt cọc và giữ sảnh tiệc như thế nào?",
        "Câu trả lời":
          "Dạ để giữ ngày đẹp và sảnh ưng ý, Quý khách đặt cọc lần 1 là 5.000.000 VNĐ ạ. Khoản cọc này được cấn trừ trực tiếp khi ký hợp đồng và chốt thực đơn chính thức.",
        "Từ khóa": "đặt cọc, hợp đồng, giữ sảnh",
      },
      {
        "Danh mục": "Khảo sát sảnh & Thử món",
        "Câu hỏi": "Tôi muốn đặt lịch đến xem sảnh và thử món trực tiếp được không?",
        "Câu trả lời":
          "Dạ hoàn toàn được ạ! Đội ngũ tư vấn tiệc Golden Palace luôn sẵn sàng đón tiếp Quý khách từ 8h00 đến 21h00 mỗi ngày. Quý khách cho em xin SĐT và ngày dự kiến ghé qua để bên em chuẩn bị chu đáo nhất nhé!",
        "Từ khóa": "xem sảnh, thử món, hẹn lịch",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FAQ_GoldenPalace");

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="FAQ_Mau_GoldenPalace.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  }

  return NextResponse.json({ success: true, items: [] });
}

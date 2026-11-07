import { NextRequest, NextResponse } from "next/server";
import { loadCloudStore, updateCloudStore } from "@/lib/sync/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const store = loadCloudStore();
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get("since") || "0", 10);

    if (since > 0 && since >= store.revision) {
      return NextResponse.json({
        modified: false,
        revision: store.revision,
      });
    }

    return NextResponse.json({
      modified: true,
      revision: store.revision,
      lastUpdated: store.lastUpdated,
      crm: store.crm,
      conversations: store.conversations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi đọc dữ liệu đồng bộ" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateCloudStore(body);

    return NextResponse.json({
      success: true,
      revision: updated.revision,
      lastUpdated: updated.lastUpdated,
      crm: updated.crm,
      conversations: updated.conversations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi lưu dữ liệu đồng bộ" },
      { status: 500 },
    );
  }
}

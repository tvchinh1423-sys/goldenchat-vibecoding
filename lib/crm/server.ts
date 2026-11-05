import { createClient } from "@supabase/supabase-js";
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  CRMError,
  type CRMSnapshot,
  type CRMLead,
  type CRMBooking,
} from "./model";

export const CRM_COOKIE = "omnichat_crm_session";
const SESSION_SECONDS = 8 * 60 * 60;
export function crmMode(): "demo" | "supabase" {
  const mode = process.env.CRM_MODE || "demo";
  if (mode !== "demo" && mode !== "supabase")
    throw new CRMError("CRM_MODE phải là demo hoặc supabase.", 503);
  return mode;
}
function password() {
  const value = process.env.CRM_ACCESS_PASSWORD;
  if (!value || value.length < 24)
    throw new CRMError(
      "Cần cấu hình mật khẩu CRM ít nhất 24 ký tự trên máy chủ.",
      503,
    );
  return value;
}
export function equalSecret(a: string, b: string) {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}
export function issueSession(now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${createHmac("sha256", password()).update(payload).digest("hex")}`;
}
export function validSession(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    !/^\d+$/.test(parts[0]) ||
    Number(parts[0]) <= now / 1000 ||
    Number(parts[0]) > now / 1000 + SESSION_SECONDS
  )
    return false;
  return equalSecret(
    parts[2],
    createHmac("sha256", password())
      .update(parts.slice(0, 2).join("."))
      .digest("hex"),
  );
}
export function requireSameOrigin(req: NextRequest) {
  // Next can use localhost internally even when the browser opened 127.0.0.1.
  // Compare with the incoming Host, retaining the protocol supplied by Next.
  const url = new URL(req.url);
  const host = req.headers.get("host") ?? url.host;
  const proto =
    req.headers.get("x-forwarded-proto") ?? url.protocol.slice(0, -1);
  if (
    req.headers.get("origin") !== `${proto}://${host}` ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new CRMError("Yêu cầu phải được gửi từ ứng dụng này.", 403);
}
export function requireCRM(req: NextRequest) {
  password();
  if (!validSession(req.cookies.get(CRM_COOKIE)?.value))
    throw new CRMError("Đăng nhập để mở CRM dùng chung.", 401);
}
export function crmDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || url.includes("your-project.supabase.co") || !key)
    throw new CRMError("Chưa cấu hình Supabase phía máy chủ cho CRM.", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  });
}
export function databaseError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new CRMError(
      "Số điện thoại hoặc hội thoại đã có khách hàng trong CRM.",
      409,
    );
  if (error.code === "23P01")
    throw new CRMError(
      "Nhân viên đã có lịch trong khung 60 phút này. Hãy chọn giờ hoặc người phụ trách khác.",
      409,
    );
  if (error.code === "P0002")
    throw new CRMError("Không tìm thấy khách hàng hoặc lịch hẹn.", 404);
  if (error.code === "22023")
    throw new CRMError(
      "Lịch hẹn đã qua hoặc không hợp lệ. Hãy đổi sang thời gian mới trước khi xác nhận.",
    );
  throw new CRMError(
    "Không truy cập được CRM. Kiểm tra kết nối và migration Supabase; dữ liệu chưa được xác nhận lưu.",
    503,
  );
}
export async function databaseSnapshot(): Promise<CRMSnapshot> {
  const db = crmDatabase();
  async function rows(table: string) {
    const result: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from(table)
        .select("*")
        .order("created_at")
        .order("id")
        .range(offset, offset + 499);
      databaseError(error);
      result.push(...(data ?? []));
      if (!data || data.length < 500) return result;
    }
  }
  const [leads, bookings] = await Promise.all([
    rows("leads"),
    rows("bookings"),
  ]);
  return {
    leads: leads.map((l) => ({
      ...l,
      inbox_reference: l.inbox_reference ?? null,
      email: l.email ?? "",
      notes: l.notes ?? "",
      assigned_to: l.assigned_to ?? "",
      event_date: l.event_date ?? "",
      table_count: l.table_count ?? null,
    })) as unknown as CRMLead[],
    bookings: bookings as unknown as CRMBooking[],
  };
}
export function crmJSON(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function crmHandler(
  req: NextRequest,
  action: () => Promise<unknown>,
) {
  try {
    if (req.method !== "GET") requireSameOrigin(req);
    if (crmMode() === "demo") return crmJSON({ mode: "demo" });
    requireCRM(req);
    const result = await action();
    return crmJSON(
      result ?? { mode: "supabase", ...(await databaseSnapshot()) },
    );
  } catch (error) {
    const known = error instanceof CRMError;
    return crmJSON(
      {
        error: known
          ? error.message
          : "Không truy cập được CRM. Vui lòng thử lại.",
        code: known && error.status === 401 ? "AUTH_REQUIRED" : "CRM_ERROR",
      },
      known ? error.status : 503,
    );
  }
}
export async function readBody(req: NextRequest): Promise<unknown> {
  if (Number(req.headers.get("content-length")) > 16000)
    throw new CRMError("Thông tin gửi lên quá dài.", 413);
  const raw = await req.text();
  if (raw.length > 16000) throw new CRMError("Thông tin gửi lên quá dài.", 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new CRMError("Nội dung yêu cầu không hợp lệ.");
  }
}
export function requireUUID(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new CRMError("Mã hồ sơ không hợp lệ.");
}
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/crm",
  maxAge: SESSION_SECONDS,
};
export function checkPassword(value: unknown) {
  return (
    typeof value === "string" &&
    value.length <= 256 &&
    equalSecret(value, password())
  );
}

import { NextRequest } from "next/server";
import { CRMError, isRecord } from "@/lib/crm/model";
import {
  CRM_COOKIE,
  checkPassword,
  crmJSON,
  crmMode,
  issueSession,
  readBody,
  requireSameOrigin,
  sessionCookieOptions,
} from "@/lib/crm/server";
export const dynamic = "force-dynamic";
// Bound repeated guesses within a server instance. Use SSO/rate limiting at the
// gateway before deploying this single-workspace showcase to a wider audience.
let attempts = 0;
let windowEnds = 0;
export async function POST(req: NextRequest) {
  try {
    requireSameOrigin(req);
    if (Date.now() > windowEnds) {
      attempts = 0;
      windowEnds = Date.now() + 15 * 60 * 1000;
    }
    if (attempts >= 10)
      throw new CRMError(
        "Đã thử đăng nhập nhiều lần. Vui lòng thử lại sau 15 phút.",
        429,
      );
    const body = await readBody(req);
    attempts++;
    if (!isRecord(body) || typeof body.password !== "string")
      throw new CRMError("Vui lòng nhập mật khẩu quản trị.", 400);

    const isDemo = crmMode() === "demo";
    let valid = false;
    if (isDemo) {
      valid =
        body.password === (process.env.CRM_ACCESS_PASSWORD || "goldenpalace2026") ||
        body.password === "admin123" ||
        body.password === "goldenpalace";
    } else {
      valid = checkPassword(body.password);
    }

    if (!valid)
      throw new CRMError("Mật khẩu quản trị chưa đúng.", 401);

    attempts = 0;
    const response = crmJSON({ success: true, mode: isDemo ? "demo" : "supabase" });
    if (!isDemo) {
      response.cookies.set(CRM_COOKIE, issueSession(), sessionCookieOptions);
    }
    return response;
  } catch (e) {
    return crmJSON(
      { error: e instanceof CRMError ? e.message : "Chưa đăng nhập được CRM." },
      e instanceof CRMError ? e.status : 503,
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    requireSameOrigin(req);
    const response = crmJSON({ success: true });
    response.cookies.set(CRM_COOKIE, "", {
      ...sessionCookieOptions,
      maxAge: 0,
    });
    return response;
  } catch {
    return crmJSON({ error: "Yêu cầu không hợp lệ." }, 403);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

const PUBLIC_PATHS = ["/access", "/api/auth/verify", "/api/admin/login", "/api/admin/logout"];
const ADMIN_PAGE = "/admin";
const ADMIN_API = "/api/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公開パス
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // admin ページ: セッション不問でページ自体は表示（ページ内でログイン処理）
  if (pathname === ADMIN_PAGE) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session")?.value;
  let session: Record<string, unknown> | null = null;
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, secret());
      session = payload as Record<string, unknown>;
    } catch {
      // invalid session
    }
  }

  // admin API: admin ロール必須
  if (pathname.startsWith(ADMIN_API)) {
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // その他: 何らかのセッションが必要
  if (!session) {
    return NextResponse.redirect(new URL("/access", req.url));
  }

  // guest セッション: DB で revoked / expires_at を再チェック（#1 revoke即時反映）
  if (session.role === "guest" && session.tokenId) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("access_tokens")
      .select("revoked, expires_at")
      .eq("id", session.tokenId)
      .single();

    if (!data || data.revoked || new Date(data.expires_at) < new Date()) {
      const res = NextResponse.redirect(new URL("/access?error=revoked", req.url));
      res.cookies.set("session", "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).)"],
};

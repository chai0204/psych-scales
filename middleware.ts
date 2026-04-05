import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

const PUBLIC_PATHS = ["/access", "/api/auth/verify"];
const ADMIN_PAGE = "/admin";
const ADMIN_API = "/api/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 静的ファイルはスキップ
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

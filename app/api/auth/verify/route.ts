import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const tokenSecret = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (!tokenSecret) {
    return NextResponse.redirect(new URL("/access?error=invalid", req.url));
  }

  // Vercel環境向けに信頼性の高いIPを取得
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "unknown";

  // #3: アトミックなRPCでTOCTOU競合を防止（検証・カウントアップを1トランザクションで）
  // まず token_secret でトークンIDを取得
  const { data: tokenRow, error: lookupError } = await supabase
    .from("access_tokens")
    .select("id")
    .eq("token_secret", tokenSecret)
    .single();

  if (lookupError || !tokenRow) {
    return NextResponse.redirect(new URL("/access?error=invalid", req.url));
  }

  const { data: result, error: rpcError } = await supabase
    .rpc("consume_access_token", { p_token_id: tokenRow.id, p_ip: ip });

  if (rpcError || !result) {
    return NextResponse.redirect(new URL("/access?error=invalid", req.url));
  }

  if (!result.success) {
    return NextResponse.redirect(new URL(`/access?error=${result.error}`, req.url));
  }

  // JWT/cookie の有効期限をトークンの expires_at に合わせる
  const expiresAt = new Date(result.expires_at);
  const maxAgeSec = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  const session = await signSession({ role: "guest", tokenId: tokenRow.id }, `${maxAgeSec}s`);

  const res = NextResponse.redirect(new URL("/", baseUrl));
  res.cookies.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeSec,
    path: "/",
  });
  return res;
}

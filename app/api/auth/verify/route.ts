import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const tokenId = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (!tokenId) {
    return NextResponse.redirect(new URL("/access?error=invalid", req.url));
  }

  const { data: token, error } = await supabase
    .from("access_tokens")
    .select("*")
    .eq("id", tokenId)
    .single();

  if (error || !token) {
    return NextResponse.redirect(new URL("/access?error=invalid", req.url));
  }

  if (token.revoked) {
    return NextResponse.redirect(new URL("/access?error=revoked", req.url));
  }

  if (new Date(token.expires_at) < new Date()) {
    return NextResponse.redirect(new URL("/access?error=expired", req.url));
  }

  if (token.use_count >= token.max_uses) {
    return NextResponse.redirect(new URL("/access?error=limit", req.url));
  }

  // Vercel環境向けに信頼性の高いIPを取得（#7）
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "unknown";

  const newUses = [...(token.uses ?? []), { at: new Date().toISOString(), ip }];

  await supabase
    .from("access_tokens")
    .update({ use_count: token.use_count + 1, uses: newUses })
    .eq("id", tokenId);

  // JWT/cookie の有効期限をトークンの expires_at に合わせる（#4）
  const expiresAt = new Date(token.expires_at);
  const nowMs = Date.now();
  const maxAgeSec = Math.max(0, Math.floor((expiresAt.getTime() - nowMs) / 1000));
  const expiresInSec = `${maxAgeSec}s`;

  const session = await signSession({ role: "guest", tokenId }, expiresInSec);

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

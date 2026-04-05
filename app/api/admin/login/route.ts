import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { checkOrigin } from "@/lib/csrf";

const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7日
const RATE_LIMIT_WINDOW_MS = 60 * 1000;  // 1分
const RATE_LIMIT_MAX = 10;               // 10回/分

export async function POST(req: NextRequest) {
  // #11: CSRF Origin検証
  const csrfError = checkOrigin(req);
  if (csrfError) return csrfError;

  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "unknown";

  // #2: レート制限（Supabaseで失敗試行を記録・チェック）
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("attempted_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { password } = await req.json();

  // タイミング攻撃対策
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const valid =
    typeof password === "string" &&
    password.length === expected.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expected));

  if (!valid) {
    // 失敗を記録
    await supabase.from("login_attempts").insert({ ip });
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // 成功時は該当IPの失敗記録を削除
  await supabase.from("login_attempts").delete().eq("ip", ip);

  const token = await signSession({ role: "admin" }, "7d");

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_MAX_AGE,
    path: "/",
  });
  return res;
}

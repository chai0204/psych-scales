import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signSession } from "@/lib/session";

const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7日

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  // タイミング攻撃対策: timingSafeEqual で比較（#9）
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const valid =
    password?.length === expected.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expected));

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // JWT とcookieの有効期限を一致させる（#4）
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

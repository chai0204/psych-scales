import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";
import { checkOrigin } from "@/lib/csrf";

// GET: トークン一覧
export async function GET() {
  const { data, error } = await supabase
    .from("access_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: トークン発行（アクセスURLをレスポンスに含めて返す）
export async function POST(req: NextRequest) {
  const csrfError = checkOrigin(req);
  if (csrfError) return csrfError;

  const { email, note, max_uses, expires_in_days } = await req.json();

  if (!email || !expires_in_days) {
    return NextResponse.json({ error: "email and expires_in_days are required" }, { status: 400 });
  }

  const expires_at = new Date(
    Date.now() + expires_in_days * 24 * 60 * 60 * 1000
  ).toISOString();

  const token_secret = randomBytes(32).toString("hex");

  const { data: token, error } = await supabase
    .from("access_tokens")
    .insert({
      email,
      note: note || null,
      max_uses: max_uses ?? 3,
      expires_at,
      token_secret,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const access_url = `${baseUrl}/access?token=${token_secret}`;

  // アクセスURLをレスポンスに含めて返す（管理画面でコピペして共有）
  return NextResponse.json({ ...token, access_url });
}

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET: トークン一覧
export async function GET() {
  const { data, error } = await supabase
    .from("access_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: トークン発行 + メール送信
export async function POST(req: NextRequest) {
  const { email, note, max_uses, expires_in_days } = await req.json();

  if (!email || !expires_in_days) {
    return NextResponse.json({ error: "email and expires_in_days are required" }, { status: 400 });
  }

  const expires_at = new Date(
    Date.now() + expires_in_days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: token, error } = await supabase
    .from("access_tokens")
    .insert({
      email,
      note: note || null,
      max_uses: max_uses ?? 3,
      expires_at,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const accessUrl = `${baseUrl}/access?token=${token.id}`;

  const expiresLabel =
    expires_in_days === 1 ? "1日" :
    expires_in_days === 7 ? "1週間" : "1ヶ月";

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "心理尺度サイトへのアクセスリンク",
    html: `
      <p>以下のリンクからアクセスしてください。</p>
      <p><a href="${accessUrl}">${accessUrl}</a></p>
      <p>有効期限: ${expiresLabel}（${max_uses ?? 3}回まで使用可能）</p>
      <p style="color:#888;font-size:12px;">このメールに心当たりがない場合は無視してください。</p>
    `,
  });

  return NextResponse.json(token);
}

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";
import { checkOrigin } from "@/lib/csrf";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
  const accessUrl = `${baseUrl}/access?token=${token_secret}`;

  const expiresLabel =
    expires_in_days === 1 ? "1日" :
    expires_in_days === 7 ? "1週間" : "1ヶ月";

  try {
    await transporter.sendMail({
      from: `心理尺度サイト <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "心理尺度サイトへのアクセスリンク",
      html: `
        <p>以下のリンクからアクセスしてください。</p>
        <p><a href="${accessUrl}">${accessUrl}</a></p>
        <p>有効期限: ${expiresLabel}（${max_uses ?? 3}回まで使用可能）</p>
        <p style="color:#888;font-size:12px;">このメールに心当たりがない場合は無視してください。</p>
      `,
    });
  } catch (mailError) {
    console.error("[mail error]", mailError);
    return NextResponse.json(
      { error: "メール送信に失敗しました", detail: String(mailError) },
      { status: 500 }
    );
  }

  return NextResponse.json(token);
}

import { NextRequest, NextResponse } from "next/server";

export function checkOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null; // same-origin リクエストはOriginヘッダーなし（許可）

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const allowed = [baseUrl, "http://localhost:3000", "http://localhost:3001", "http://localhost:3003"];

  if (!allowed.includes(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

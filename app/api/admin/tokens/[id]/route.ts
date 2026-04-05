import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE: トークン失効
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("access_tokens")
    .update({ revoked: true })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

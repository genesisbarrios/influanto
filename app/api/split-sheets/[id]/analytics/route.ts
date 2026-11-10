import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

// GET /api/split-sheets/<id>/analytics: delivery status per recipient plus the
// event history. Owner only; signing tokens are never returned.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sheet } = await supabase
    .from("split_sheets")
    .select("id, title, status, last_sent_at, created_at, updated_at")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!sheet) return NextResponse.json({ error: "Only the owner of this split sheet can see its analytics." }, { status: 404 });

  const [{ data: signers }, { data: events }] = await Promise.all([
    supabase
      .from("split_sheet_signers")
      .select("id, contributor_name, contributor_email, created_at, last_sent_at, opened_at, clicked_at, viewed_at, edited_at, signed_at")
      .eq("split_sheet_id", sheet.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("split_sheet_events")
      .select("id, signer_id, type, created_at")
      .eq("split_sheet_id", sheet.id)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  return NextResponse.json({ sheet, signers: signers ?? [], events: events ?? [] });
}

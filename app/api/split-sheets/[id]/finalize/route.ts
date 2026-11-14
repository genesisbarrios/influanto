import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { isFullySigned } from "@/libs/splitSheetSplits";
import { finalizeSplitSheet } from "@/libs/splitSheetFinalize";

// POST /api/split-sheets/<id>/finalize: owner (re)sends the fully signed PDF
// to everyone. Used from Analytics, e.g. for sheets completed before the
// final email included the owner.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sheet } = await supabase
    .from("split_sheets")
    .select("id, contributors")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isFullySigned(sheet.contributors ?? [])) {
    return NextResponse.json({ error: "Not everyone has signed yet" }, { status: 400 });
  }

  const result = await finalizeSplitSheet(sheet.id, { force: true });
  if (!result.emailed.length) return NextResponse.json({ error: "The emails couldn't be sent. Try again." }, { status: 502 });
  return NextResponse.json({ emailed: result.emailed });
}

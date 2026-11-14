import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { contributorEmails, isFullySigned, signatureProgress } from "@/libs/splitSheetSplits";
import { finalRecipients } from "@/libs/splitSheetFinalize";

export const dynamic = "force-dynamic";

// GET /api/split-sheets/<id>/analytics: delivery status per recipient, every
// contributor's signature (the owner's included), and the event history.
// Owner only; signing tokens and signature images are never returned.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // final_sent_at may not exist before the migration; fall back without it.
  const load = (cols: string) =>
    supabase.from("split_sheets").select(cols).eq("id", params.id).eq("user_id", session.user.id).maybeSingle();
  let { data: sheet, error } = await load("id, user_id, title, status, last_sent_at, final_sent_at, created_at, updated_at, contributors");
  if (error) ({ data: sheet } = await load("id, user_id, title, status, last_sent_at, created_at, updated_at, contributors"));
  if (!sheet) return NextResponse.json({ error: "Only the owner of this split sheet can see its analytics." }, { status: 404 });
  const s = sheet as any;

  const [{ data: signers }, { data: events }, { data: owner }] = await Promise.all([
    supabase
      .from("split_sheet_signers")
      .select("id, contributor_name, contributor_email, created_at, last_sent_at, opened_at, clicked_at, viewed_at, edited_at, signed_at")
      .eq("split_sheet_id", s.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("split_sheet_events")
      .select("id, signer_id, type, created_at")
      .eq("split_sheet_id", s.id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("users").select("name, email").eq("id", s.user_id).maybeSingle(),
  ]);

  // Every contributor's signature status. A contributor counts as "you" when
  // their contact is your email (or, failing that, their name is yours).
  const ownerEmail = String(owner?.email ?? "").toLowerCase();
  const ownerName = String(owner?.name ?? "").trim().toLowerCase();
  const contributors = ((s.contributors ?? []) as any[])
    .filter((c) => String(c?.name ?? "").trim())
    .map((c) => {
      const emails = contributorEmails([c]);
      return {
        name: String(c.name).trim(),
        signed: !!c.signature,
        signatureDate: c.signatureDate || null,
        isOwner: (!!ownerEmail && emails.includes(ownerEmail)) || (!!ownerName && String(c.name).trim().toLowerCase() === ownerName),
      };
    });

  const fullySigned = isFullySigned(s.contributors ?? []);
  const sheetOut = {
    id: s.id, title: s.title, status: s.status, last_sent_at: s.last_sent_at, final_sent_at: s.final_sent_at ?? null,
    created_at: s.created_at, updated_at: s.updated_at,
  };
  return NextResponse.json({
    sheet: sheetOut,
    signers: signers ?? [],
    events: events ?? [],
    contributors,
    signatures: signatureProgress(s.contributors ?? []),
    fullySigned,
    finalRecipients: fullySigned ? await finalRecipients(s) : [],
  });
}

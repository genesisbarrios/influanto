import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

// ── GET — public, fetch split sheet + signer details by token ────────────────
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const { data: signer, error } = await supabase
    .from("split_sheet_signers")
    .select("*, split_sheets(*)")
    .eq("token", params.token)
    .single();

  if (error || !signer) {
    return NextResponse.json({ error: "Invalid or expired signing link" }, { status: 404 });
  }

  const sheet = signer.split_sheets as any;

  return NextResponse.json({
    signer: {
      id: signer.id,
      name: signer.contributor_name,
      email: signer.contributor_email,
      signedAt: signer.signed_at,
      signatureData: signer.signature_data,
    },
    sheet: {
      id: sheet.id,
      title: sheet.title,
      date: sheet.date,
      artists: sheet.artists,
      stateCountry: sheet.state_country,
      contributors: sheet.contributors ?? [],
      publishing: sheet.publishing ?? [],
    },
  });
}

// ── POST — public, submit signature (and, optionally, the signer's own
// updated contributor/publishing details) ───────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { signatureData, contributor, publishing } = await req.json();
  if (!signatureData) {
    return NextResponse.json({ error: "Signature data is required" }, { status: 400 });
  }

  // Fetch signer record
  const { data: signer, error: signerErr } = await supabase
    .from("split_sheet_signers")
    .select("*, split_sheets(*)")
    .eq("token", params.token)
    .single();

  if (signerErr || !signer) {
    return NextResponse.json({ error: "Invalid or expired signing link" }, { status: 404 });
  }

  const signedAt = new Date().toISOString();

  // 1. Update the signer record
  await supabase
    .from("split_sheet_signers")
    .update({ signature_data: signatureData, signed_at: signedAt })
    .eq("token", params.token);

  // 2. Patch the matching contributor in split_sheets.contributors JSONB.
  // Always locate "this signer's" row using the STABLE identity captured on
  // the signer record (name/email as of when the link was sent) — never the
  // possibly-just-edited name — so a signer correcting their own name can't
  // accidentally desync from their own row.
  const sheet = signer.split_sheets as any;
  const contributors: any[] = sheet.contributors ?? [];
  const signerName = (signer.contributor_name ?? "").toLowerCase();
  const signerEmail = (signer.contributor_email ?? "").toLowerCase();
  const isMe = (c: any) => {
    const nameMatch = (c.name ?? "").toLowerCase() === signerName;
    const contactMatch = (c.contact ?? "").toLowerCase().includes(signerEmail);
    return nameMatch || contactMatch;
  };

  // Captured during the map below — isMe() matches against the ORIGINAL
  // name, so it can no longer find the row once that same pass has renamed
  // it; track the new name directly instead of re-deriving it afterward.
  let finalContributorName = signer.contributor_name || "";

  const updatedContributors = contributors.map((c: any) => {
    if (!isMe(c)) return c;
    const updated = {
      ...c,
      // Signers may only edit their own row's editable fields — name, role,
      // ownership, and contact — everything else (signature bookkeeping)
      // stays server-controlled.
      ...(contributor && typeof contributor === "object"
        ? {
            name: String(contributor.name ?? c.name ?? "").trim() || c.name,
            role: String(contributor.role ?? c.role ?? "").trim(),
            ownership: String(contributor.ownership ?? c.ownership ?? "").trim(),
            contact: String(contributor.contact ?? c.contact ?? "").trim(),
          }
        : {}),
      signature: signatureData,
      signatureDate: new Date().toLocaleDateString("en-US"),
    };
    finalContributorName = updated.name;
    return updated;
  });

  // 3. Replace this signer's own publishing row(s) wholesale with whatever
  // they submitted (they may add, edit, or remove their own rows) — every
  // other contributor's publishing rows are left untouched.
  const existingPublishing: any[] = sheet.publishing ?? [];
  const otherPublishing = existingPublishing.filter(
    (p: any) => (p.contributorName ?? "").toLowerCase() !== signerName
  );
  const myPublishing = Array.isArray(publishing)
    ? publishing
        .filter((p: any) => (p?.publisher ?? "").trim() || (p?.percent ?? "").toString().trim())
        .map((p: any) => ({
          contributorName: finalContributorName,
          publisher: String(p.publisher ?? "").trim(),
          percent: String(p.percent ?? "").trim(),
        }))
    : existingPublishing.filter((p: any) => (p.contributorName ?? "").toLowerCase() === signerName);
  const updatedPublishing = [...otherPublishing, ...myPublishing];

  await supabase
    .from("split_sheets")
    .update({ contributors: updatedContributors, publishing: updatedPublishing })
    .eq("id", sheet.id);

  // 3. If the signer is logged in, save a copy of the sheet under their account
  //    (so it appears in their own Split Sheets dashboard) and report premium status.
  let premium = false;
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const { data: u } = await supabase
      .from("users")
      .select("has_access")
      .eq("id", session.user.id)
      .single();
    premium = !!u?.has_access;

    // Dedupe: only copy once per signer for this sheet (best-effort by title+date+artists)
    const { data: existing } = await supabase
      .from("split_sheets")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("title", sheet.title ?? "")
      .eq("date", sheet.date ?? "")
      .eq("artists", sheet.artists ?? "")
      .limit(1);

    if (!existing?.length) {
      await supabase.from("split_sheets").insert({
        user_id: session.user.id,
        title: sheet.title ?? "",
        date: sheet.date ?? "",
        artists: sheet.artists ?? "",
        state_country: sheet.state_country ?? "",
        contributors: updatedContributors,
        publishing: updatedPublishing,
        status: "completed",
      });
    }
  }

  return NextResponse.json({ success: true, signedAt, premium });
}

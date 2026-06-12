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

// ── POST — public, submit signature ─────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { signatureData } = await req.json();
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

  // 2. Patch the matching contributor in split_sheets.contributors JSONB
  const sheet = signer.split_sheets as any;
  const contributors: any[] = sheet.contributors ?? [];
  const signerName = (signer.contributor_name ?? "").toLowerCase();
  const signerEmail = (signer.contributor_email ?? "").toLowerCase();

  const updatedContributors = contributors.map((c: any) => {
    const nameMatch = (c.name ?? "").toLowerCase() === signerName;
    const contactMatch = (c.contact ?? "").toLowerCase().includes(signerEmail);
    if (nameMatch || contactMatch) {
      return {
        ...c,
        signature: signatureData,
        signatureDate: new Date().toLocaleDateString("en-US"),
      };
    }
    return c;
  });

  await supabase
    .from("split_sheets")
    .update({ contributors: updatedContributors })
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
        publishing: sheet.publishing ?? [],
        status: "completed",
      });
    }
  }

  return NextResponse.json({ success: true, signedAt, premium });
}

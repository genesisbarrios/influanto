import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import { buildSplitSheetPdf, splitSheetPdfFilename } from "@/libs/splitSheetPdf";
import config from "@/config";

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

  // 3. Email the signer their own copy right away ("just in case" they never
  // click Download on the confirmation screen) — and, once every invited
  // signer has now signed, email the final fully-executed PDF to everyone
  // else too. Never let an email hiccup fail the signing request itself.
  try {
    const pdfSheet = {
      title: sheet.title ?? "",
      date: sheet.date ?? "",
      artists: sheet.artists ?? "",
      stateCountry: sheet.state_country ?? "",
      contributors: updatedContributors,
      publishing: updatedPublishing,
    };
    const pdfBuffer = Buffer.from(buildSplitSheetPdf(pdfSheet).output("arraybuffer"));
    const filename = splitSheetPdfFilename(pdfSheet);

    const { data: allSigners } = await supabase
      .from("split_sheet_signers")
      .select("contributor_email, signed_at")
      .eq("split_sheet_id", sheet.id);

    const fullySigned = !!allSigners?.length && allSigners.every((s) => !!s.signed_at);

    if (signer.contributor_email) {
      await sendEmail({
        to: signer.contributor_email,
        subject: `✍️ Your signed copy: "${sheet.title}"`,
        text: `Attached is your copy of the split sheet for "${sheet.title}".`,
        html: `<p>Hi ${finalContributorName || signer.contributor_name || ""},</p><p>Attached is your copy of the split sheet for "<strong>${sheet.title}</strong>". Keep it for your records${fullySigned ? "" : " — once every contributor has signed, everyone will get the final version too"}.</p><p style="color:#9ca3af;font-size:12px;">Powered by <a href="https://influanto.com">Influanto</a></p>`,
        replyTo: config.mailgun.supportEmail || "noreply@influanto.com",
        attachments: [{ filename, content: pdfBuffer }],
      });
    }

    if (fullySigned) {
      const others = (allSigners ?? []).filter(
        (s) => (s.contributor_email ?? "").toLowerCase() !== signerEmail
      );
      await Promise.all(
        others
          .filter((s) => s.contributor_email)
          .map((s) =>
            sendEmail({
              to: s.contributor_email as string,
              subject: `🎉 Fully signed: "${sheet.title}"`,
              text: `Everyone has now signed the split sheet for "${sheet.title}". Attached is the final signed copy.`,
              html: `<p>Great news — everyone has now signed the split sheet for "<strong>${sheet.title}</strong>". Attached is the final, fully-executed copy for your records.</p><p style="color:#9ca3af;font-size:12px;">Powered by <a href="https://influanto.com">Influanto</a></p>`,
              replyTo: config.mailgun.supportEmail || "noreply@influanto.com",
              attachments: [{ filename, content: pdfBuffer }],
            })
          )
      );
    }
  } catch (e) {
    console.error("Failed to email split sheet PDF:", e);
  }

  // 4. If the signer is logged in, save a copy of the sheet under their account
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

// When every contributor on a split sheet has signed (the owner included),
// mark it completed and email the final PDF to everyone: the owner, every
// invited signer, and any contributor whose contact is an email address.
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import { buildSplitSheetPdf, splitSheetPdfFilename } from "@/libs/splitSheetPdf";
import { contributorEmails, isFullySigned } from "@/libs/splitSheetSplits";
import { escapeHtml } from "@/libs/publishing";
import config from "@/config";

export interface FinalizeResult {
  fullySigned: boolean;
  emailed: string[]; // recipients this call emailed
  alreadySent: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Everyone who should get the fully signed copy, deduplicated. */
export async function finalRecipients(sheet: { id: string; user_id: string; contributors: any[] }): Promise<string[]> {
  const [{ data: owner }, { data: signers }] = await Promise.all([
    supabase.from("users").select("email").eq("id", sheet.user_id).maybeSingle(),
    supabase.from("split_sheet_signers").select("contributor_email").eq("split_sheet_id", sheet.id),
  ]);
  const all = [
    owner?.email,
    ...(signers ?? []).map((s: any) => s.contributor_email),
    ...contributorEmails(sheet.contributors ?? []),
  ]
    .map((e) => String(e ?? "").trim().toLowerCase())
    .filter((e) => EMAIL_RE.test(e));
  return Array.from(new Set(all));
}

/**
 * Sends the final copy once (claimed through split_sheets.final_sent_at).
 * `force` resends even if it already went out (owner's "send final copy").
 */
export async function finalizeSplitSheet(sheetId: string, { force = false } = {}): Promise<FinalizeResult> {
  const { data: sheet } = await supabase.from("split_sheets").select("*").eq("id", sheetId).maybeSingle();
  if (!sheet || !isFullySigned(sheet.contributors ?? [])) return { fullySigned: false, emailed: [], alreadySent: false };

  const now = new Date().toISOString();
  if (!force) {
    // Atomic claim: only one request (concurrent signers, owner save) sends it.
    const { data: claimed, error } = await supabase
      .from("split_sheets")
      .update({ final_sent_at: now, status: "completed" })
      .eq("id", sheetId)
      .is("final_sent_at", null)
      .select("id");
    if (error) {
      // final_sent_at not migrated yet: fall back to the status, so a sheet
      // already marked completed isn't emailed again on every save.
      console.error("finalize: claim failed (run migrations?):", error.message);
      if (sheet.status === "completed") return { fullySigned: true, emailed: [], alreadySent: true };
      await supabase.from("split_sheets").update({ status: "completed" }).eq("id", sheetId);
    } else if (!claimed?.length) {
      return { fullySigned: true, emailed: [], alreadySent: true };
    }
  } else {
    const { error } = await supabase.from("split_sheets").update({ final_sent_at: now, status: "completed" }).eq("id", sheetId);
    if (error) await supabase.from("split_sheets").update({ status: "completed" }).eq("id", sheetId);
  }

  const pdfSheet = {
    title: sheet.title ?? "",
    date: sheet.date ?? "",
    artists: sheet.artists ?? "",
    stateCountry: sheet.state_country ?? "",
    contributors: sheet.contributors ?? [],
    publishing: sheet.publishing ?? [],
  };
  const pdf = Buffer.from(buildSplitSheetPdf(pdfSheet).output("arraybuffer"));
  const filename = splitSheetPdfFilename(pdfSheet);
  const title = escapeHtml(sheet.title || "Untitled");
  const recipients = await finalRecipients(sheet);

  const emailed: string[] = [];
  await Promise.all(
    recipients.map(async (to) => {
      try {
        await sendEmail({
          to,
          subject: `🎉 Fully signed: "${sheet.title}"`,
          text: `Everyone has signed the split sheet for "${sheet.title}". The final signed copy is attached.`,
          html: `<p>Everyone has signed the split sheet for "<strong>${title}</strong>". The final, fully signed copy is attached for your records.</p><p style="color:#9ca3af;font-size:12px;">Powered by <a href="https://influanto.com">Influanto</a></p>`,
          replyTo: config.mailgun.supportEmail || "noreply@influanto.com",
          attachments: [{ filename, content: pdf }],
        });
        emailed.push(to);
      } catch (e: any) {
        console.error(`finalize: email to ${to} failed:`, e?.message);
      }
    })
  );
  // Nothing got through: release the claim so a later save or the resend
  // button can try again.
  if (recipients.length && !emailed.length && !force) {
    await supabase.from("split_sheets").update({ final_sent_at: null }).eq("id", sheetId);
  }
  return { fullySigned: true, emailed, alreadySent: false };
}

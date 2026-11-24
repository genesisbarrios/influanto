// Documents: any PDF an account sends out for e-signature. The original is
// kept as uploaded (private storage bucket). When everyone has signed, a copy
// is made with a signature certificate page at the end (each signer's name,
// email, drawn signature, typed name, time and IP, plus the original file's
// SHA-256) and emailed to the owner and every signer.
import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

export const DOCUMENT_BUCKET = "documents";
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const MAX_SIGNERS = 10;
export const FREE_DOCUMENT_LIMIT = 5;
export const APP_URL = `https://${config.domainName}`;

export const CONSENT_TEXT =
  "I agree to sign this document electronically. My electronic signature is the legal equivalent of my handwritten signature.";

export async function ensureBucket() {
  // private: files are only reachable through short-lived signed URLs
  await supabase.storage.createBucket(DOCUMENT_BUCKET, { public: false, fileSizeLimit: MAX_DOCUMENT_BYTES, allowedMimeTypes: ["application/pdf"] }).catch(() => {});
}

export async function signedFileUrl(path: string, seconds = 60 * 10, download?: string) {
  const { data } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(path, seconds, download ? { download } : undefined);
  return data?.signedUrl ?? null;
}

export async function downloadFile(path: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message || "Could not read the file");
  return new Uint8Array(await data.arrayBuffer());
}

export const sha256 = (bytes: Uint8Array) => crypto.createHash("sha256").update(bytes).digest("hex");

export const safeFilename = (title: string, suffix = "") =>
  `${(title || "document").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "document"}${suffix}.pdf`;

export const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

export function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type Signer = {
  name: string;
  email: string;
  signature_data: string | null;
  typed_name: string | null;
  signed_at: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
};

/** The original PDF plus a signature certificate page (or pages) at the end. */
export async function buildSignedPdf(original: Uint8Array, doc: { id: string; title: string; file_hash: string }, signers: Signer[], ownerName: string) {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 612, H = 792, M = 54; // US Letter, 0.75" margins
  const grey = rgb(0.42, 0.45, 0.5), ink = rgb(0.07, 0.07, 0.07);
  // WinAnsi only: drop characters the standard fonts can't draw
  const clean = (s: unknown) =>
    String(s ?? "")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2026/g, "...")
      .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");

  let page = pdf.addPage([W, H]);
  let y = H - M;
  const text = (s: string, x: number, size = 10, f = font, color = ink) => page.drawText(clean(s), { x, y, size, font: f, color, maxWidth: W - M - x });

  text("Signature Certificate", M, 18, bold); y -= 24;
  text(doc.title || "Untitled document", M, 12, bold); y -= 16;
  text(`Sent by ${ownerName || "Influanto user"} through Influanto (${config.domainName})`, M, 9, font, grey); y -= 13;
  text(`Document ID: ${doc.id}`, M, 9, font, grey); y -= 13;
  text(`Original file SHA-256: ${doc.file_hash}`, M, 8, font, grey); y -= 13;
  text(`Completed: ${new Date().toUTCString()}`, M, 9, font, grey); y -= 22;

  for (const s of signers) {
    const block = 112;
    if (y - block < M) { page = pdf.addPage([W, H]); y = H - M; }
    page.drawRectangle({ x: M, y: y - block + 10, width: W - 2 * M, height: block, borderColor: rgb(0.86, 0.88, 0.9), borderWidth: 1 });
    const top = y;
    y -= 12;
    text(s.name || s.email, M + 12, 11, bold); y -= 14;
    text(s.email, M + 12, 9, font, grey); y -= 14;
    text(`Typed name: ${s.typed_name || "-"}`, M + 12, 9); y -= 13;
    text(`Signed: ${s.signed_at ? new Date(s.signed_at).toUTCString() : "-"}`, M + 12, 9); y -= 13;
    text(`IP address: ${s.signed_ip || "-"}`, M + 12, 9); y -= 13;
    text(`Device: ${(s.signed_user_agent || "-").slice(0, 70)}`, M + 12, 8, font, grey);
    if (s.signature_data?.startsWith("data:image/png;base64,")) {
      try {
        const png = await pdf.embedPng(Buffer.from(s.signature_data.split(",")[1], "base64"));
        const h = 60, w = Math.min(200, (png.width / png.height) * h);
        page.drawImage(png, { x: W - M - 12 - w, y: top - 12 - h, width: w, height: h });
        page.drawLine({ start: { x: W - M - 12 - 200, y: top - 76 }, end: { x: W - M - 12, y: top - 76 }, thickness: 0.6, color: grey });
      } catch { /* bad image: the typed name still stands */ }
    }
    y = top - block - 8;
  }

  if (y - 40 < M) { page = pdf.addPage([W, H]); y = H - M; }
  y -= 6;
  text(`Each signer agreed: "${CONSENT_TEXT}"`, M, 8, font, grey);
  return pdf.save();
}

/**
 * When every signer has signed: build the signed copy, save it, email it to
 * the owner and the signers, and mark the document completed. Runs once.
 */
export async function finalizeDocument(documentId: string, opts: { force?: boolean } = {}) {
  const { data: doc } = await supabase.from("documents").select("*").eq("id", documentId).single();
  if (!doc) return { emailed: [] as string[] };
  if (doc.status === "completed" && doc.signed_path && !opts.force) return { emailed: [] as string[] };

  const { data: signers } = await supabase.from("document_signers").select("*").eq("document_id", documentId).order("created_at");
  if (!signers?.length || signers.some((s: any) => !s.signed_at)) return { emailed: [] as string[] };

  const { data: owner } = await supabase.from("users").select("name, email").eq("id", doc.user_id).single();

  let bytes: Uint8Array;
  let signedPath = doc.signed_path as string | null;
  if (signedPath && opts.force) {
    bytes = await downloadFile(signedPath);
  } else {
    bytes = await buildSignedPdf(await downloadFile(doc.file_path), doc, signers as Signer[], owner?.name || "");
    signedPath = doc.file_path.replace(/\.pdf$/i, "") + "-signed.pdf";
    const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(signedPath, bytes, { contentType: "application/pdf", upsert: true });
    if (error) throw new Error(`Could not save the signed copy: ${error.message}`);
    await supabase.from("documents").update({ signed_path: signedPath, status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", documentId);
  }

  const filename = safeFilename(doc.title, "-signed");
  const recipients = Array.from(new Set([owner?.email, ...signers.map((s: any) => s.email)].filter(Boolean).map((e: any) => String(e).toLowerCase())));
  const emailed: string[] = [];
  for (const to of recipients) {
    try {
      await sendEmail({
        to,
        subject: `✅ Signed by everyone: "${doc.title}"`,
        text: `Everyone has signed "${doc.title}". The signed copy is attached, with a signature certificate on the last page.`,
        html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#111;"><p>Everyone has signed "<strong>${escapeHtml(doc.title)}</strong>".</p><p>The signed copy is attached, with a signature certificate on the last page.</p><p style="color:#9ca3af;font-size:12px;">Powered by <a href="https://influanto.com">Influanto</a></p></div>`,
        replyTo: owner?.email || config.mailgun.supportEmail || "noreply@influanto.com",
        attachments: [{ filename, content: Buffer.from(bytes) }],
      });
      emailed.push(to);
    } catch (e: any) {
      console.error("document final email failed:", to, e?.message);
    }
  }
  return { emailed };
}

export function clientIp(headers: Headers) {
  return (headers.get("x-forwarded-for") || "").split(",")[0].trim() || headers.get("x-real-ip") || "";
}

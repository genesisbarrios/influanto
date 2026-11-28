import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import { APP_URL, MAX_SIGNERS, escapeHtml, isEmail } from "@/libs/documents";
import { cleanFields } from "@/libs/documentFields";

export const dynamic = "force-dynamic";

// POST { signers: [{ name, email }], message?, fields? }: add these signers (if new)
// and email each of them their signing link. Sending to someone again resends
// the same link; people who already signed are skipped.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc } = await supabase.from("documents").select("*").eq("id", params.id).eq("user_id", session.user.id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.status === "completed") return NextResponse.json({ error: "Everyone has already signed this document" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const wanted = new Map<string, string>();
  for (const s of Array.isArray(body.signers) ? body.signers : []) {
    const email = String(s?.email || "").trim().toLowerCase();
    if (!isEmail(email)) return NextResponse.json({ error: `"${String(s?.email || "")}" isn't a valid email` }, { status: 400 });
    wanted.set(email, String(s?.name || "").trim().slice(0, 120));
  }
  if (!wanted.size) return NextResponse.json({ error: "Add at least one signer" }, { status: 400 });

  const { data: existing } = await supabase.from("document_signers").select("id, email, name, token, signed_at").eq("document_id", doc.id);
  const known = new Map((existing ?? []).map((s: any) => [s.email, s]));
  const total = new Set([...known.keys(), ...wanted.keys()]).size;
  if (total > MAX_SIGNERS) return NextResponse.json({ error: `A document can have up to ${MAX_SIGNERS} signers` }, { status: 400 });

  // signature and text fields placed on the pages (only until someone signs)
  let fields = null as ReturnType<typeof cleanFields> | null;
  if (Array.isArray(body.fields)) {
    if ((existing ?? []).some((s: any) => s.signed_at)) return NextResponse.json({ error: "Someone has already signed, so the fields can't be changed" }, { status: 400 });
    fields = cleanFields(body.fields, doc.page_count || 1, Array.from(new Set([...known.keys(), ...wanted.keys()])));
    if ("error" in fields) return NextResponse.json({ error: fields.error }, { status: 400 });
  }

  const newRows = [...wanted].filter(([email]) => !known.has(email)).map(([email, name]) => ({ document_id: doc.id, email, name }));
  if (newRows.length) {
    const { data: added, error } = await supabase.from("document_signers").insert(newRows).select("id, email, name, token, signed_at");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    (added ?? []).forEach((s: any) => known.set(s.email, s));
  }

  if (fields && "fields" in fields) {
    const { error } = await supabase.from("documents").update({ fields: fields.fields }).eq("id", doc.id);
    if (error) return NextResponse.json({ error: `Couldn't save the fields: ${error.message}` }, { status: 500 });
  }

  if (typeof body.message === "string") {
    doc.message = body.message.slice(0, 2000);
    await supabase.from("documents").update({ message: doc.message }).eq("id", doc.id);
  }

  const { data: sender } = await supabase.from("users").select("name, email").eq("id", session.user.id).single();
  const senderName = sender?.name || "Someone";
  const note = doc.message?.trim()
    ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:18px 0;white-space:pre-wrap;">${escapeHtml(doc.message)}</div>`
    : "";

  const errors: string[] = [];
  let sent = 0;
  for (const email of wanted.keys()) {
    const s: any = known.get(email);
    if (!s || s.signed_at) continue;
    const url = `${APP_URL}/sign-document/${s.token}`;
    try {
      await sendEmail({
        to: email,
        subject: `✍️ Please sign: "${doc.title}" from ${senderName}`,
        text: `${senderName} sent you "${doc.title}" to sign.${doc.message ? `\n\n${doc.message}` : ""}\n\nReview and sign: ${url}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;font-size:14px;line-height:1.6;">
          <p style="font-size:12px;color:#6b7280;">Powered by <a href="https://influanto.com" style="color:#4f46e5;">Influanto</a></p>
          <h1 style="font-size:20px;margin:0 0 6px;">${escapeHtml(doc.title)}</h1>
          <p style="color:#374151;">Hi ${escapeHtml(s.name || "there")}, <strong>${escapeHtml(senderName)}</strong> sent you this document to review and sign.</p>
          ${note}
          <p style="margin:24px 0;"><a href="${url}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">✍️ Review &amp; sign</a></p>
          <p style="font-size:12px;color:#9ca3af;">No account needed. This link is just for you, so please don't forward it.</p>
        </div>`,
        replyTo: sender?.email || "noreply@influanto.com",
      });
      await supabase.from("document_signers").update({ last_sent_at: new Date().toISOString() }).eq("id", s.id);
      sent++;
    } catch (e: any) {
      errors.push(`${email}: ${e?.message || "failed"}`);
    }
  }

  if (sent) await supabase.from("documents").update({ status: "sent", last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", doc.id);
  if (errors.length) return NextResponse.json({ message: `Sent to ${sent}`, errors }, { status: sent ? 207 : 502 });
  return NextResponse.json({ message: `Sent to ${sent} signer${sent === 1 ? "" : "s"}` });
}

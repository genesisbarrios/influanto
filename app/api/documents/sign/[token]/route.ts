import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import config from "@/config";
import { isBotUserAgent } from "@/libs/splitSheetEvents";
import { CONSENT_TEXT, clientIp, escapeHtml, finalizeDocument, signedFileUrl } from "@/libs/documents";

export const dynamic = "force-dynamic";
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

async function signerFor(token: string) {
  if (!isUuid(token)) return null;
  const { data } = await supabase.from("document_signers").select("*, documents(*)").eq("token", token).maybeSingle();
  return data;
}

// GET (public): the document and this signer, with a short-lived link to the PDF
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const signer: any = await signerFor(params.token);
  if (!signer?.documents) return NextResponse.json({ error: "This signing link is invalid or the document was deleted." }, { status: 404 });
  const doc = signer.documents;

  // first time the signer (not the owner previewing, not a link scanner) opens it
  if (!signer.viewed_at && !isBotUserAgent(req.headers.get("user-agent") || "")) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id !== doc.user_id) {
      await supabase.from("document_signers").update({ viewed_at: new Date().toISOString() }).eq("id", signer.id);
    }
  }

  const [{ data: owner }, { data: all }] = await Promise.all([
    supabase.from("users").select("name").eq("id", doc.user_id).single(),
    supabase.from("document_signers").select("signed_at").eq("document_id", doc.id),
  ]);
  const completed = doc.status === "completed" && !!doc.signed_path;
  return NextResponse.json({
    document: {
      title: doc.title,
      message: doc.message || "",
      pages: doc.page_count,
      from: owner?.name || "",
      fileUrl: await signedFileUrl(completed ? doc.signed_path : doc.file_path, 60 * 30),
      completed,
      signed: (all ?? []).filter((s: any) => s.signed_at).length,
      total: (all ?? []).length,
    },
    signer: { name: signer.name, email: signer.email, signedAt: signer.signed_at },
    consentText: CONSENT_TEXT,
  });
}

// POST (public) { signatureData, typedName, consent }: sign
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const signer: any = await signerFor(params.token);
  if (!signer?.documents) return NextResponse.json({ error: "This signing link is invalid or the document was deleted." }, { status: 404 });
  if (signer.signed_at) return NextResponse.json({ error: "You've already signed this document." }, { status: 409 });
  const doc = signer.documents;

  const { signatureData, typedName, consent } = await req.json().catch(() => ({}));
  if (consent !== true) return NextResponse.json({ error: "Please agree to sign electronically." }, { status: 400 });
  const name = String(typedName || "").trim().slice(0, 120);
  if (name.length < 2) return NextResponse.json({ error: "Type your full name." }, { status: 400 });
  const sig = String(signatureData || "");
  if (!sig.startsWith("data:image/png;base64,") || sig.length > 600_000) {
    return NextResponse.json({ error: "Draw your signature first." }, { status: 400 });
  }

  const signedAt = new Date().toISOString();
  const { error } = await supabase
    .from("document_signers")
    .update({
      signature_data: sig,
      typed_name: name,
      signed_at: signedAt,
      signed_ip: clientIp(req.headers).slice(0, 64),
      signed_user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
      ...(signer.name ? {} : { name }),
    })
    .eq("id", signer.id)
    .is("signed_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // everyone signed: the signed copy goes to everyone. Otherwise a receipt to this signer.
  let completed = false;
  try {
    const { data: all } = await supabase.from("document_signers").select("signed_at").eq("document_id", doc.id);
    completed = !!all?.length && all.every((s: any) => s.signed_at);
    if (completed) {
      await finalizeDocument(doc.id);
    } else {
      const left = (all ?? []).filter((s: any) => !s.signed_at).length;
      await sendEmail({
        to: signer.email,
        subject: `✍️ You signed "${doc.title}"`,
        text: `You signed "${doc.title}". ${left} more ${left === 1 ? "person needs" : "people need"} to sign; you'll get the signed copy by email once everyone has.`,
        html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#111;"><p>You signed "<strong>${escapeHtml(doc.title)}</strong>".</p><p>${left} more ${left === 1 ? "person needs" : "people need"} to sign. You'll get the signed copy by email once everyone has.</p><p style="color:#9ca3af;font-size:12px;">Powered by <a href="https://influanto.com">Influanto</a></p></div>`,
        replyTo: config.mailgun.supportEmail || "noreply@influanto.com",
      });
    }
  } catch (e: any) {
    console.error("document after-sign step failed:", e?.message);
  }

  return NextResponse.json({ success: true, signedAt, completed });
}

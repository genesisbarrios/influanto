import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import { unsubscribePageUrl, listUnsubscribeHeaders, isCuratorSuppressed, normalizeEmail } from "@/libs/unsubscribe";

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

function escapeHtml(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body } = await req.json();
  if (!isEmail(String(to ?? "").trim())) {
    return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 });
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  // Curators who opted out of pitches are never emailed again
  const recipient = String(to).trim();
  if (await isCuratorSuppressed(recipient)) {
    return NextResponse.json({ error: "This curator has opted out of receiving pitches through Influanto." }, { status: 409 });
  }

  // Sender (for reply-to) — replies go straight to the artist, not Influanto
  const { data: sender } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", session.user.id)
    .single();

  const replyTo = sender?.email || session.user.email || "noreply@influanto.com";
  const optOut = unsubscribePageUrl("curator", normalizeEmail(recipient));
  const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#111;white-space:pre-wrap;">${escapeHtml(body)}</div>
  <p style="font-family:sans-serif;font-size:11px;color:#888;margin-top:28px;">Sent through Influanto by an independent artist. Don't want pitches from Influanto artists? <a href="${optOut}" style="color:#888;">Unsubscribe</a></p>`;

  try {
    await sendEmail({
      to: recipient,
      subject: subject.trim(),
      text: `${body}\n\n—\nSent through Influanto by an independent artist. Unsubscribe from pitches: ${optOut}`,
      html,
      replyTo,
      headers: listUnsubscribeHeaders("curator", normalizeEmail(recipient)),
    });
    return NextResponse.json({ message: "Sent" });
  } catch (e: any) {
    console.error("Curator email error:", e);
    return NextResponse.json({ error: e?.message || "Failed to send" }, { status: 500 });
  }
}

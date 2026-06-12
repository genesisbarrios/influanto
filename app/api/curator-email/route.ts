import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";

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

  // Sender (for reply-to) — replies go straight to the artist, not Influanto
  const { data: sender } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", session.user.id)
    .single();

  const replyTo = sender?.email || session.user.email || "noreply@influanto.com";
  const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#111;white-space:pre-wrap;">${escapeHtml(body)}</div>`;

  try {
    await sendEmail({ to: String(to).trim(), subject: subject.trim(), text: body, html, replyTo });
    return NextResponse.json({ message: "Sent" });
  } catch (e: any) {
    console.error("Curator email error:", e);
    return NextResponse.json({ error: e?.message || "Failed to send" }, { status: 500 });
  }
}

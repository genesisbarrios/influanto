import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import { unsubscribePageUrl, listUnsubscribeHeaders, isCuratorSuppressed, normalizeEmail } from "@/libs/unsubscribe";

export const dynamic = "force-dynamic";

// Free accounts can send this many curator pitches in any 24 hours; Pro is unlimited
const FREE_DAILY_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

function escapeHtml(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Pitches sent in the last 24 hours, and whether this account is Pro. */
async function usage(userId: string) {
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const [{ count, error }, { data: account }] = await Promise.all([
    supabase.from("curator_emails").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
    supabase.from("users").select("has_access").eq("id", userId).single(),
  ]);
  if (error) console.error("curator_emails count error:", error.message);
  const pro = !!account?.has_access;
  return { sentToday: count ?? 0, limit: pro ? null : FREE_DAILY_LIMIT, pro };
}

// GET: the pitches you've sent (newest first) and today's usage
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data, error }, use] = await Promise.all([
    supabase
      .from("curator_emails")
      .select("id, curator_email, curator_name, playlist_name, playlist_url, track_link, subject, body, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    usage(session.user.id),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], ...use });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body, playlistName, playlistUrl, curatorName, trackLink } = await req.json();
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

  // Free plan: a few pitches a day (Pro is unlimited)
  const use = await usage(session.user.id);
  if (use.limit !== null && use.sentToday >= use.limit) {
    return NextResponse.json(
      { error: `Free accounts can send ${FREE_DAILY_LIMIT} curator emails a day. Try again tomorrow or upgrade to Pro for unlimited.`, upgrade: true, reason: "curator_emails", ...use },
      { status: 429 }
    );
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
    // keep a copy for the artist's history (and the daily limit)
    const { data: logged, error: logError } = await supabase
      .from("curator_emails")
      .insert({
        user_id: session.user.id,
        curator_email: normalizeEmail(recipient),
        curator_name: clip(curatorName, 200),
        playlist_name: clip(playlistName, 300),
        playlist_url: clip(playlistUrl, 1000),
        track_link: clip(trackLink, 1000),
        subject: clip(subject, 300),
        body: String(body).slice(0, 20000),
      })
      .select("id, curator_email, curator_name, playlist_name, playlist_url, track_link, subject, body, created_at")
      .single();
    if (logError) console.error("curator_emails insert error:", logError.message);
    return NextResponse.json({
      message: "Sent",
      sent: logged ?? null,
      sentToday: use.sentToday + 1,
      limit: use.limit,
      pro: use.pro,
    });
  } catch (e: any) {
    console.error("Curator email error:", e);
    return NextResponse.json({ error: e?.message || "Failed to send" }, { status: 500 });
  }
}

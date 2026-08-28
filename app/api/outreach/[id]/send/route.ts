import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapNewsletter, getNewsletterSenderInfo } from "@/libs/supabase";
import { renderNewsletterHtml, injectEmailTracking } from "@/libs/newsletter-html";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

const TRACK_BASE = `https://www.${config.domainName}`;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactIds } = await req.json();
  if (!contactIds?.length) {
    return NextResponse.json({ error: "No contacts selected" }, { status: 400 });
  }

  // Fetch newsletter (ownership check)
  const { data: row, error: nErr } = await supabase
    .from("newsletters")
    .select()
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (nErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch selected contacts
  const { data: contacts } = await supabase
    .from("outreach_contacts")
    .select()
    .eq("user_id", session.user.id)
    .in("id", contactIds);

  if (!contacts?.length) return NextResponse.json({ error: "Contacts not found" }, { status: 404 });

  const { senderName, senderEmail, socials, artistImage, username } = await getNewsletterSenderInfo(session.user.id);
  const newsletter = mapNewsletter(row)!;
  const baseHtml = renderNewsletterHtml(newsletter, { senderName, socials, artistImage, username });
  const subject = newsletter.subject || newsletter.title || `News from ${senderName}`;
  const text = `${newsletter.title || ""}\n\n${newsletter.description || ""}`.trim();

  const errors: string[] = [];
  const sentEvents: any[] = [];
  for (const contact of contacts) {
    if (!contact.email) continue;
    try {
      // Per-recipient open pixel + click-wrapped links so we can attribute analytics.
      const html = injectEmailTracking(baseHtml, {
        base: TRACK_BASE,
        newsletterId: params.id,
        contactId: contact.id,
      });
      await sendEmail({
        to: contact.email,
        subject,
        text,
        html,
        replyTo: senderEmail || "noreply@influanto.com",
        fromName: senderName,
      });
      sentEvents.push({
        newsletter_id: params.id,
        user_id: session.user.id,
        contact_id: contact.id,
        email: contact.email,
        type: "send",
      });
    } catch (e: any) {
      errors.push(`${contact.email}: ${e.message}`);
    }
  }

  // Log a 'send' event per successful recipient + bump the lifetime sent count.
  if (sentEvents.length) {
    await supabase.from("newsletter_events").insert(sentEvents);
    await supabase
      .from("newsletters")
      .update({ sent_count: (row.sent_count ?? 0) + sentEvents.length })
      .eq("id", params.id)
      .eq("user_id", session.user.id);
  }

  // Mark as sent
  await supabase
    .from("newsletters")
    .update({ status: "sent", last_sent_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (errors.length) {
    return NextResponse.json({ message: "Sent with some errors", errors }, { status: 207 });
  }
  return NextResponse.json({ message: `Sent to ${contacts.length} contact(s)` });
}

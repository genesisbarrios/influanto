import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapNewsletter } from "@/libs/supabase";
import { renderNewsletterHtml } from "@/libs/newsletter-html";
import { sendEmail } from "@/libs/resend";

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

  // Sender info
  const { data: sender } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", session.user.id)
    .single();

  const senderName = sender?.name || "An artist";
  const newsletter = mapNewsletter(row)!;
  const html = renderNewsletterHtml(newsletter, { senderName });
  const subject = newsletter.subject || newsletter.title || `News from ${senderName}`;
  const text = `${newsletter.title || ""}\n\n${newsletter.description || ""}`.trim();

  const errors: string[] = [];
  for (const contact of contacts) {
    if (!contact.email) continue;
    try {
      await sendEmail({
        to: contact.email,
        subject,
        text,
        html,
        replyTo: sender?.email || "noreply@influanto.com",
      });
    } catch (e: any) {
      errors.push(`${contact.email}: ${e.message}`);
    }
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

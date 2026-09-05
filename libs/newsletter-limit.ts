import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import { renderNewsletterLimitEmailHtml } from "@/libs/newsletter-limit-email-html";
import config from "@/config";

// Free-plan cap on outreach_contacts (matches config.ts's documented
// "Outreach (up to 50 contacts, 5 newsletters)" Starter plan feature).
export const FREE_CONTACT_LIMIT = 50;

// Call after adding one or more outreach_contacts rows for a user (manual add,
// CSV import, or a public newsletter signup). If a free-plan artist has just
// reached the cap and hasn't been emailed about it yet, sends the "list is
// full" email once and flips newsletter_limit_notified so the dashboard
// banner appears.
export async function notifyIfNewsletterLimitReached(userId: string): Promise<void> {
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, has_access, newsletter_limit_notified")
    .eq("id", userId)
    .single();

  if (!user || user.has_access || user.newsletter_limit_notified) return;

  const { count } = await supabase
    .from("outreach_contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) < FREE_CONTACT_LIMIT) return;

  // Flip the flag first so a near-simultaneous request can't send a second email.
  await supabase.from("users").update({ newsletter_limit_notified: true }).eq("id", userId);

  if (!user.email) return;
  try {
    await sendEmail({
      to: user.email,
      subject: "Your newsletter subscriber list is full 🎉",
      text: `Your Influanto newsletter subscriber list just reached the ${FREE_CONTACT_LIMIT}-subscriber free plan limit, so new signups from your Link in Bio and Release Pages are paused. Upgrade to Influanto Pro for unlimited subscribers — start with a 14-day free trial: https://influanto.com/#pricing`,
      html: renderNewsletterLimitEmailHtml({ name: user.name, limit: FREE_CONTACT_LIMIT }),
      replyTo: config.mailgun.supportEmail || "info@influanto.com",
    });
  } catch (e) {
    console.error("Failed to send newsletter-limit email:", e);
  }
}

// Used by public-facing signup endpoints to reject new subscribers once a
// free-plan artist's list is already full (defense in depth alongside hiding
// the signup form on their public pages).
export async function isNewsletterFull(ownerId: string): Promise<boolean> {
  const { data: owner } = await supabase.from("users").select("has_access").eq("id", ownerId).single();
  if (!owner || owner.has_access) return false;

  const { count } = await supabase
    .from("outreach_contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerId);

  return (count ?? 0) >= FREE_CONTACT_LIMIT;
}

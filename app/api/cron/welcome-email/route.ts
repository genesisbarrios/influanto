import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase from "@/libs/supabase";
import { sendEmail } from "@/libs/resend";
import { renderWelcomeEmailHtml } from "@/libs/welcome-email-html";
import config from "@/config";

// Triggered daily by the Vercel Cron in vercel.json. Each run picks up anyone
// whose account is between 1 and 4 days old (the wider window is a safety net
// in case a run is skipped/delayed) and who hasn't been emailed yet, so every
// user gets the welcome email roughly a day or two after signing up.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_LIMIT = 200;

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const windowStart = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email")
    .is("welcome_email_sent_at", null)
    .not("email", "is", null)
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd)
    .limit(BATCH_LIMIT);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const user of users ?? []) {
    if (!user.email) continue;
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Influanto \u{1F44B} — let's set up your page",
        text: `Welcome to Influanto! Finish your profile, customize your Link in Bio, and create your first Release Page: https://influanto.com/dashboard`,
        html: renderWelcomeEmailHtml({ name: user.name }),
        replyTo: config.mailgun.supportEmail || "info@influanto.com",
      });
      await supabase
        .from("users")
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq("id", user.id);
      sent++;
    } catch (e: any) {
      errors.push(`${user.email}: ${e.message}`);
    }
  }

  return NextResponse.json({ sent, total: users?.length ?? 0, errors });
}

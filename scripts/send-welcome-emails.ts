// One-off backfill: sends the onboarding welcome email (see
// libs/welcome-email-html.ts) to every existing user who hasn't received it.
// The day-1/2 cron (app/api/cron/welcome-email) only catches new signups going
// forward, so this script covers everyone who joined before that existed.
//
// Usage:
//   npx tsx scripts/send-welcome-emails.ts            (dry run — lists recipients only)
//   npx tsx scripts/send-welcome-emails.ts --send      (actually sends)
//   npx tsx scripts/send-welcome-emails.ts --send --limit=25

import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { renderWelcomeEmailHtml } from "../libs/welcome-email-html";

const FROM_ADMIN = "info at influanto <info@influanto.com>";
const REPLY_TO = "info@influanto.com";
const SEND_DELAY_MS = 300; // stay well under Resend's rate limit

function loadEnv(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (k) env[k] = v;
  }
  return env;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const isSend = args.includes("--send");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

  const env = { ...loadEnv(".env.local"), ...process.env };
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  if (isSend && !env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = supabase
    .from("users")
    .select("id, name, email")
    .is("welcome_email_sent_at", null)
    .not("email", "is", null)
    .order("created_at", { ascending: true });

  if (limit) query = query.limit(limit);

  const { data: users, error } = await query;
  if (error) throw error;

  if (!users || users.length === 0) {
    console.log("No users to email — everyone already has welcome_email_sent_at set.");
    return;
  }

  if (!isSend) {
    console.log(`Dry run — ${users.length} user(s) would receive the welcome email:\n`);
    for (const u of users) console.log(`  ${u.email}`);
    console.log(`\nRe-run with --send to actually email them (add --limit=N to test on a few first).`);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  let sent = 0;
  const errors: string[] = [];

  console.log(`Sending welcome email to ${users.length} user(s)...\n`);

  for (const user of users) {
    if (!user.email) continue;
    try {
      await resend.emails.send({
        from: FROM_ADMIN,
        to: user.email,
        reply_to: REPLY_TO,
        subject: "Welcome to Influanto \u{1F44B} — let's set up your page",
        text: `Welcome to Influanto! Finish your profile, customize your Link in Bio, and create your first Release Page: https://influanto.com/dashboard`,
        html: renderWelcomeEmailHtml({ name: user.name }),
      });
      await supabase
        .from("users")
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq("id", user.id);
      sent++;
      console.log(`  ✅ ${user.email}`);
    } catch (e: any) {
      errors.push(`${user.email}: ${e.message}`);
      console.log(`  ❌ ${user.email}: ${e.message}`);
    }
    await sleep(SEND_DELAY_MS);
  }

  console.log(`\nDone. Sent ${sent}/${users.length}.`);
  if (errors.length) {
    console.log(`\nErrors:`);
    for (const e of errors) console.log(`  ${e}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

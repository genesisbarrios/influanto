#!/usr/bin/env node
/*
 * Reconcile Stripe → Supabase access.
 *
 * The live Stripe webhook was failing (signature mismatch) from ~June 3 2026,
 * so some paying customers never got has_access=true. This grants access to any
 * customer with an active/trialing subscription who is missing it.
 *
 * Safe by default (DRY RUN). Idempotent. Only ever GRANTS access.
 *
 * Usage (run with your LIVE key):
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/reconcile-stripe-access.js          # dry run
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/reconcile-stripe-access.js --apply  # write changes
 */
const fs = require("fs");
const Stripe = require("stripe");

// Load .env.local (without overriding anything already in the environment).
try {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    if (line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) {
      const k = line.slice(0, i).trim();
      if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
    }
  }
} catch {}

const APPLY = process.argv.includes("--apply");
const stripeKey = process.env.STRIPE_SECRET_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeKey || !SB_URL || !SB_KEY) {
  console.error("Missing STRIPE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!stripeKey.startsWith("sk_live")) {
  console.warn("⚠️  Non-live Stripe key — this scans TEST data and will NOT reconcile real customers.\n");
}

const stripe = new Stripe(stripeKey);
const sbHeaders = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" };

async function findUser(customerId, email) {
  let res = await fetch(`${SB_URL}/rest/v1/users?customer_id=eq.${customerId}&select=id,email,has_access`, { headers: sbHeaders });
  let rows = await res.json();
  if (Array.isArray(rows) && rows[0]) return rows[0];
  if (email) {
    res = await fetch(`${SB_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id,email,has_access`, { headers: sbHeaders });
    rows = await res.json();
    if (Array.isArray(rows) && rows[0]) return rows[0];
  }
  return null;
}

async function grant(userId, customerId, priceId) {
  await fetch(`${SB_URL}/rest/v1/users?id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({ has_access: true, customer_id: customerId, price_id: priceId }),
  });
}

async function processStatus(status, stats) {
  for await (const sub of stripe.subscriptions.list({ status, limit: 100, expand: ["data.customer"] })) {
    stats.scanned++;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    const email = typeof sub.customer === "object" ? sub.customer?.email : null;
    const priceId = sub.items?.data?.[0]?.price?.id || null;
    const user = await findUser(customerId, email);
    if (!user) { stats.missing++; console.log(`  ⚠️  no Supabase user for ${email || customerId}`); continue; }
    if (user.has_access) { stats.ok++; continue; }
    console.log(`  ${APPLY ? "GRANT " : "would grant"} access → ${user.email} (${status} ${sub.id}, price ${priceId})`);
    if (APPLY) await grant(user.id, customerId, priceId);
    stats.granted++;
  }
}

(async () => {
  console.log(`Reconcile Stripe access — ${APPLY ? "APPLY (writing)" : "DRY RUN"}\n`);
  const stats = { scanned: 0, ok: 0, granted: 0, missing: 0 };
  await processStatus("active", stats);
  await processStatus("trialing", stats);
  console.log(
    `\nScanned ${stats.scanned} subscriptions · already OK ${stats.ok} · ${APPLY ? "granted" : "would grant"} ${stats.granted} · no user match ${stats.missing}`
  );
  if (!APPLY && stats.granted) console.log("\nRe-run with --apply to write these changes.");
})().catch((e) => { console.error(e); process.exit(1); });

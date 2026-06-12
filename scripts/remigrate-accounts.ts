/**
 * Re-migrates the accounts collection only.
 * Rebuilds the user ID mapping by joining on email (both DBs are already populated).
 * Deduplicates by (provider, providerAccountId) keeping the newest record.
 *
 *   npx tsx scripts/remigrate-accounts.ts
 */
import ws from "ws";
(globalThis as any).WebSocket = ws;

import { MongoClient } from "mongodb";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import * as fs from "fs";

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (k && !process.env[k]) process.env[k] = v;
  }
}
loadEnv(".env.local");

async function main() {
  console.log("🔌 Connecting to MongoDB…");
  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect();
  const db = mongo.db();
  console.log("✅ MongoDB connected\n");

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── Build email → Supabase UUID map from the already-migrated users table ──
  console.log("📋 Building email→UUID map from Supabase…");
  const emailToUUID = new Map<string, string>();
  let offset = 0;
  while (true) {
    const { data, error } = await sb
      .from("users")
      .select("id, email")
      .range(offset, offset + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const u of data) {
      if (u.email) emailToUUID.set(u.email.toLowerCase(), u.id);
    }
    offset += data.length;
    if (data.length < 1000) break;
  }
  console.log(`   Loaded ${emailToUUID.size} user emails\n`);

  // Also build mongoId → supabaseUUID from the mongo users collection
  const mongoIdToUUID = new Map<string, string>();
  const mongoUsers = await db.collection("users").find({}, { projection: { _id: 1, email: 1 } }).toArray();
  for (const u of mongoUsers) {
    const supabaseId = u.email ? emailToUUID.get(u.email.toLowerCase()) : undefined;
    if (supabaseId) mongoIdToUUID.set(u._id.toString(), supabaseId);
  }
  console.log(`   Mapped ${mongoIdToUUID.size} Mongo user IDs to Supabase UUIDs\n`);

  // ── Fetch + deduplicate accounts ──────────────────────────────────────────
  console.log("📦 Fetching accounts from MongoDB…");
  const mongoAccounts = await db.collection("accounts").find({}).toArray();
  console.log(`   Found ${mongoAccounts.length} accounts`);

  // Deduplicate: keep the newest per (provider, providerAccountId)
  const seen = new Map<string, any>();
  for (const a of mongoAccounts) {
    const key = `${a.provider}::${a.providerAccountId}`;
    const existing = seen.get(key);
    const ts = (a.updatedAt ?? a.createdAt ?? new Date(0)).getTime();
    const existingTs = existing
      ? (existing.updatedAt ?? existing.createdAt ?? new Date(0)).getTime()
      : -1;
    if (!existing || ts > existingTs) seen.set(key, a);
  }
  console.log(`   After dedup: ${seen.size} unique accounts\n`);

  // ── Insert one-by-one so a single failure doesn't kill the batch ──────────
  let inserted = 0;
  let skipped = 0;

  for (const a of seen.values()) {
    const userId = mongoIdToUUID.get(a.userId?.toString());
    if (!userId) {
      console.warn(`   ⚠️  Skipping account (${a.provider}/${a.providerAccountId}) — user not found`);
      skipped++;
      continue;
    }

    const { error } = await sb.from("accounts").upsert(
      {
        id: randomUUID(),
        user_id: userId,
        type: a.type ?? "oauth",
        provider: a.provider,
        provider_account_id: a.providerAccountId,
        refresh_token: a.refreshToken ?? null,
        access_token: a.accessToken ?? null,
        expires_at: a.expiresAt
          ? Math.floor(new Date(a.expiresAt).getTime() / 1000)
          : null,
        token_type: a.tokenType ?? null,
        scope: a.scope ?? null,
        id_token: a.id_token ?? null,
        session_state: a.sessionState ?? null,
      },
      { onConflict: "provider,provider_account_id", ignoreDuplicates: true }
    );

    if (error) {
      console.error(`   ✗ ${a.provider}/${a.providerAccountId}: ${error.message}`);
      skipped++;
    } else {
      inserted++;
    }
  }

  console.log(`\n✅ Accounts re-migration done`);
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Skipped  : ${skipped}`);

  // ── Verify ────────────────────────────────────────────────────────────────
  const { count } = await sb.from("accounts").select("*", { count: "exact", head: true });
  console.log(`   Supabase accounts table now has ${count} rows`);

  await mongo.close();
}

main().catch((err) => {
  console.error("Re-migration failed:", err);
  process.exit(1);
});

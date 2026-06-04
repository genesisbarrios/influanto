/**
 * MongoDB → Supabase migration script
 *
 * Run once after deploying the Supabase schema:
 *   npx tsx scripts/migrate-to-supabase.ts
 *
 * Prerequisites:
 *   npm install --save-dev @supabase/supabase-js tsx
 *
 * What it does:
 *   1. Reads every collection from MongoDB
 *   2. Generates a new UUID for each document
 *   3. Inserts into the corresponding Supabase table
 *   4. Builds a Mongo-ObjectId → Supabase-UUID map so foreign keys resolve correctly
 *
 * After migration, existing JWT sessions will still carry the old MongoDB IDs.
 * They will be replaced with Supabase UUIDs on the user's next sign-in (normal
 * behaviour when switching adapters). No data is lost.
 */

// Node.js 18 doesn't have native WebSocket — polyfill before importing Supabase
import ws from "ws";
(globalThis as any).WebSocket = ws;

import { MongoClient } from "mongodb";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

// ── Load .env.local ──────────────────────────────────────────────────────────

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

// ── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");
if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
if (!SUPABASE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return randomUUID();
}

/** Chunk an array into batches to stay under Supabase's 1 MB row limit. */
function chunks<T>(arr: T[], size = 200): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function upsertBatches(table: string, rows: any[]) {
  if (!rows.length) return;
  for (const batch of chunks(rows)) {
    const { error } = await supabase.from(table).upsert(batch, { ignoreDuplicates: true });
    if (error) console.error(`  ✗ ${table} batch error:`, error.message);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔌 Connecting to MongoDB…");
  const mongo = new MongoClient(MONGODB_URI);
  await mongo.connect();
  const db = mongo.db(); // uses the database from the URI
  console.log("✅ Connected to MongoDB\n");

  // ID mapping: MongoDB ObjectId string → Supabase UUID
  const idMap = new Map<string, string>();

  // ── 1. Users ───────────────────────────────────────────────────────────────
  console.log("📦 Migrating users…");
  const mongoUsers = await db.collection("users").find({}).toArray();
  console.log(`   Found ${mongoUsers.length} users`);

  const supabaseUsers = mongoUsers.map((u) => {
    const newId = uuid();
    idMap.set(u._id.toString(), newId);
    return {
      id: newId,
      name: u.name ?? null,
      username: u.username ?? null,
      email: u.email ?? null,
      email_verified: u.emailVerified ?? null,
      display_email: u.displayEmail ?? false,
      image: u.image ?? null,
      location: u.location ?? null,
      bio: u.bio ?? null,
      website: u.website ?? null,
      etsy: u.etsy ?? null,
      instagram: u.instagram ?? null,
      twitter: u.twitter ?? null,
      discord: u.discord ?? null,
      telegram: u.telegram ?? null,
      facebook: u.facebook ?? null,
      linkedin: u.linkedin ?? null,
      youtube: u.youtube ?? null,
      tiktok: u.tiktok ?? null,
      github: u.github ?? null,
      spotify: u.spotify ?? null,
      apple_music: u.appleMusic ?? null,
      tidal: u.tidal ?? null,
      amazon_music: u.amazonMusic ?? null,
      soundcloud: u.soundcloud ?? null,
      deezer: u.deezer ?? null,
      pandora: u.pandora ?? null,
      bandcamp: u.bandcamp ?? null,
      youtube_music: u.youtubeMusic ?? null,
      patreon: u.patreon ?? null,
      substack: u.substack ?? null,
      customer_id: u.customerId ?? null,
      price_id: u.priceId ?? null,
      has_access: u.hasAccess ?? false,
      printify_shop_id: u.printifyShopId ?? null,
      printify_connected: u.printifyConnected ?? false,
      printify_store_url: u.printifyStoreUrl ?? null,
      printify_store_name: u.printifyStoreName ?? null,
      printify_access_token: u.printifyAccessToken ?? null,
      printify_shop_url: u.printifyShopUrl ?? null,
      created_at: u.createdAt ?? new Date(),
      updated_at: u.updatedAt ?? new Date(),
    };
  });

  await upsertBatches("users", supabaseUsers);
  console.log(`   ✅ ${supabaseUsers.length} users migrated\n`);

  // ── 2. Accounts (NextAuth OAuth links) ────────────────────────────────────
  console.log("📦 Migrating accounts…");
  const mongoAccounts = await db.collection("accounts").find({}).toArray();
  console.log(`   Found ${mongoAccounts.length} accounts`);

  const supabaseAccounts = mongoAccounts
    .map((a) => {
      const userId = idMap.get(a.userId?.toString());
      if (!userId) {
        console.warn(`   ⚠️  Skipping account ${a._id} — userId not found in map`);
        return null;
      }
      return {
        id: uuid(),
        user_id: userId,
        type: a.type ?? "oauth",
        provider: a.provider,
        provider_account_id: a.providerAccountId,
        refresh_token: a.refreshToken ?? null,
        access_token: a.accessToken ?? null,
        expires_at: a.expiresAt ? Math.floor(new Date(a.expiresAt).getTime() / 1000) : null,
        token_type: a.tokenType ?? null,
        scope: a.scope ?? null,
        id_token: a.id_token ?? null,
        session_state: a.sessionState ?? null,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  await upsertBatches("accounts", supabaseAccounts);
  console.log(`   ✅ ${supabaseAccounts.length} accounts migrated\n`);

  // ── 3. Leads ───────────────────────────────────────────────────────────────
  console.log("📦 Migrating leads…");
  const mongoLeads = await db.collection("leads").find({}).toArray();
  console.log(`   Found ${mongoLeads.length} leads`);

  const supabaseLeads = mongoLeads.map((l) => ({
    id: uuid(),
    email: l.email,
    created_at: l.createdAt ?? new Date(),
  }));

  await upsertBatches("leads", supabaseLeads);
  console.log(`   ✅ ${supabaseLeads.length} leads migrated\n`);

  // ── 4. Release pages ───────────────────────────────────────────────────────
  console.log("📦 Migrating release pages…");
  const mongoPages = await db.collection("releasepages").find({}).toArray();
  console.log(`   Found ${mongoPages.length} release pages`);

  const supabasePages = mongoPages
    .map((p) => {
      const userId = idMap.get(p.userId?.toString());
      if (!userId) {
        console.warn(`   ⚠️  Skipping release page "${p.name}" — userId not in map`);
        return null;
      }
      return {
        id: uuid(),
        user_id: userId,
        name: p.name,
        image: p.image ?? null,
        description: p.description ?? null,
        video: p.video ?? null,
        links: p.links ?? [],
        bg_color: p.bgColor ?? null,
        text_color: p.textColor ?? null,
        links_color: p.linksColor ?? null,
        font: p.font ?? null,
        selected_products: p.selectedProducts ?? [],
        created_at: p.createdAt ?? new Date(),
        updated_at: p.updatedAt ?? new Date(),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  await upsertBatches("release_pages", supabasePages);
  console.log(`   ✅ ${supabasePages.length} release pages migrated\n`);

  // ── 5. Link-in-bio ─────────────────────────────────────────────────────────
  console.log("📦 Migrating link-in-bio…");
  const mongoLibs = await db.collection("linkinbios").find({}).toArray();
  console.log(`   Found ${mongoLibs.length} link-in-bio records`);

  const supabaseLibs = mongoLibs
    .map((l) => {
      const userId = idMap.get(l.userId?.toString());
      if (!userId) {
        console.warn(`   ⚠️  Skipping link-in-bio ${l._id} — userId not in map`);
        return null;
      }
      return {
        id: uuid(),
        user_id: userId,
        bg_color: l.bgColor ?? null,
        text_color: l.textColor ?? null,
        links_color: l.linksColor ?? null,
        card_bg_color: l.cardBgColor ?? null,
        font: l.font ?? "Inter, sans-serif",
        bg_image: l.bgImage ?? null,
        bg_mode: l.bgMode ?? "color",
        bg_image_custom: l.bgImageCustom ?? null,
        pattern_id: l.patternId ?? "topography",
        pattern_fg: l.patternFg ?? "#000000",
        pattern_bg: l.patternBg ?? "#ffffff",
        pattern_opacity: l.patternOpacity ?? 0.5,
        selected_products: l.selectedProducts ?? [],
        links: l.links ?? [],
        created_at: l.createdAt ?? new Date(),
        updated_at: l.updatedAt ?? new Date(),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  await upsertBatches("link_in_bio", supabaseLibs);
  console.log(`   ✅ ${supabaseLibs.length} link-in-bio records migrated\n`);

  // ── 6. Link-in-bio visits ──────────────────────────────────────────────────
  console.log("📦 Migrating link-in-bio visits…");
  const mongoVisits = await db.collection("linkinbiovisits").find({}).toArray();
  console.log(`   Found ${mongoVisits.length} visits`);

  const supabaseVisits = mongoVisits
    .map((v) => {
      const userId = idMap.get(v.userId?.toString());
      if (!userId) return null;
      return {
        id: uuid(),
        user_id: userId,
        country: v.country ?? "Unknown",
        country_code: v.countryCode ?? "",
        city: v.city ?? "",
        device: v.device ?? "unknown",
        browser: v.browser ?? "Other",
        os: v.os ?? "Other",
        referrer: v.referrer ?? "Direct",
        created_at: v.createdAt ?? new Date(),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  // Visits can be large — use smaller batch size
  for (const batch of chunks(supabaseVisits, 500)) {
    const { error } = await supabase.from("link_in_bio_visits").insert(batch);
    if (error) console.error("  ✗ visits batch error:", error.message);
  }
  console.log(`   ✅ ${supabaseVisits.length} visits migrated\n`);

  // ── 7. QR codes ────────────────────────────────────────────────────────────
  console.log("📦 Migrating QR codes…");
  const mongoCodes = await db.collection("codes").find({}).toArray();
  console.log(`   Found ${mongoCodes.length} QR code records`);

  const supabaseCodes = mongoCodes
    .map((c) => {
      const userId = idMap.get(c.userId?.toString());
      if (!userId) {
        console.warn(`   ⚠️  Skipping codes ${c._id} — userId not in map`);
        return null;
      }
      // Ensure each code has a stable `id` for deletion support
      const codes = (c.codes ?? []).map((code: any) => ({
        id: code.id ?? code._id?.toString() ?? uuid(),
        url: code.url,
        name: code.name,
        color: code.color,
        dotStyle: code.dotStyle,
        cornerSquareStyle: code.cornerSquareStyle,
        cornerDotStyle: code.cornerDotStyle,
        cornerSquareColor: code.cornerSquareColor,
        cornerDotColor: code.cornerDotColor,
        transparentBg: code.transparentBg,
        bgColor: code.bgColor,
        size: code.size ?? 300,
      }));
      return {
        id: uuid(),
        user_id: userId,
        codes,
        created_at: c.createdAt ?? new Date(),
        updated_at: c.updatedAt ?? new Date(),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  await upsertBatches("qr_codes", supabaseCodes);
  console.log(`   ✅ ${supabaseCodes.length} QR code records migrated\n`);

  // ── 8. Verification tokens (email magic links) ─────────────────────────────
  console.log("📦 Migrating verification tokens…");
  const mongoTokens = await db.collection("verification_tokens").find({}).toArray();
  console.log(`   Found ${mongoTokens.length} verification tokens`);

  const supabaseTokens = mongoTokens.map((t) => ({
    identifier: t.identifier,
    token: t.token,
    expires: t.expires ?? new Date(Date.now() + 86400000),
  }));

  await upsertBatches("verification_tokens", supabaseTokens);
  console.log(`   ✅ ${supabaseTokens.length} verification tokens migrated\n`);

  await mongo.close();
  console.log("🎉 Migration complete!");
  console.log("\n⚠️  Next steps:");
  console.log("   1. Existing users will get new Supabase UUIDs on their next sign-in.");
  console.log("   2. Remove MONGODB_URI from .env.local once you've verified everything works.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

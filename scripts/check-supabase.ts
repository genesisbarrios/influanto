import ws from "ws";
(globalThis as any).WebSocket = ws;

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

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

async function main() {
  const env = loadEnv(".env.local");
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = [
    "users",
    "accounts",
    "leads",
    "release_pages",
    "link_in_bio",
    "link_in_bio_visits",
    "qr_codes",
    "verification_tokens",
    "sessions",
  ];

  console.log("\n── Supabase row counts ──────────────────────");
  for (const table of tables) {
    const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ❌  ${table.padEnd(25)} ${error.message}`);
    } else {
      console.log(`  ✅  ${table.padEnd(25)} ${count} rows`);
    }
  }

  // Spot-check: show first 3 users
  console.log("\n── Sample users ─────────────────────────────");
  const { data: users } = await sb
    .from("users")
    .select("id, email, username, has_access")
    .limit(3);
  for (const u of users ?? []) {
    console.log(`  ${u.email ?? "(no email)"}  |  username: ${u.username ?? "—"}  |  has_access: ${u.has_access}`);
  }
  console.log("─────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});

import ws from "ws";
(globalThis as any).WebSocket = ws;
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const eq = line.indexOf("="); if (eq < 0) continue;
    const k = line.slice(0, eq).trim(), v = line.slice(eq + 1).trim();
    if (k && !process.env[k]) process.env[k] = v;
  }
}
loadEnv(".env.local");

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await sb.rpc("exec_sql" as any, {
    sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;"
  });

  if (error) {
    // rpc might not exist — print the SQL for manual run
    console.log("⚠️  Could not run via RPC. Run this in your Supabase SQL Editor:");
    console.log("\n  ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;\n");
  } else {
    console.log("✅ meta_pixel_id column added to users table");
  }
}

main().catch(console.error);

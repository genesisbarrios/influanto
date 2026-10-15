import crypto from "crypto";
import supabase from "@/libs/supabase";

// Unsubscribe links for every non-transactional email (server only).
//   contact — a fan unsubscribing from one artist's newsletter (outreach_contacts.id)
//   user    — an Influanto user opting out of product/marketing emails (users.id)
//   curator — a playlist curator opting out of artist pitches (their email)
// Links are HMAC-signed so nobody can unsubscribe someone else by guessing.

export type UnsubscribeKind = "contact" | "user" | "curator";

const SITE = "https://www.influanto.com";

function secret() {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET or NEXTAUTH_SECRET must be set");
  return s;
}

const sign = (payload: string) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 32);

export function unsubscribeToken(kind: UnsubscribeKind, id: string): string {
  const payload = `${kind}:${id}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifyUnsubscribeToken(token: string | null | undefined): { kind: UnsubscribeKind; id: string } | null {
  const [b64, sig] = String(token || "").split(".");
  if (!b64 || !sig) return null;
  let payload: string;
  try { payload = Buffer.from(b64, "base64url").toString("utf8"); } catch { return null; }
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const i = payload.indexOf(":");
  const kind = payload.slice(0, i) as UnsubscribeKind;
  const id = payload.slice(i + 1);
  if (!["contact", "user", "curator"].includes(kind) || !id) return null;
  return { kind, id };
}

// Page the footer link opens (asks to confirm, so link scanners can't unsubscribe anyone)
export const unsubscribePageUrl = (kind: UnsubscribeKind, id: string) => `${SITE}/unsubscribe?token=${unsubscribeToken(kind, id)}`;

// RFC 8058 one-click headers (Gmail/Yahoo show their own "Unsubscribe" button)
export function listUnsubscribeHeaders(kind: UnsubscribeKind, id: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${SITE}/api/unsubscribe?token=${unsubscribeToken(kind, id)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export const normalizeEmail = (e: string) => String(e || "").trim().toLowerCase();

export async function applyUnsubscribe(kind: UnsubscribeKind, id: string): Promise<boolean> {
  const now = new Date().toISOString();
  if (kind === "contact") {
    const { error } = await supabase.from("outreach_contacts").update({ unsubscribed_at: now }).eq("id", id);
    return !error;
  }
  if (kind === "user") {
    const { error } = await supabase.from("users").update({ marketing_unsubscribed_at: now }).eq("id", id);
    return !error;
  }
  const { error } = await supabase.from("email_suppressions").upsert({ email: normalizeEmail(id), reason: "curator_pitches" }, { onConflict: "email" });
  return !error;
}

export async function isCuratorSuppressed(email: string): Promise<boolean> {
  const { data } = await supabase.from("email_suppressions").select("email").eq("email", normalizeEmail(email)).maybeSingle();
  return !!data;
}

import crypto from "crypto";

// influanto.com/s/<code> short links. Creating requires an account (open
// shorteners get abused for spam/phishing, which can get a whole domain flagged).

export const SHORT_LINK_LIMITS = { free: 25, pro: Infinity };
export const SHORT_BASE = "https://www.influanto.com/s/";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l/i)
export function randomCode(len = 6): string {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// Custom aliases: 3–40 chars, letters/numbers/dashes, can't start or end with a dash
export const isValidAlias = (a: string) => /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/i.test(a);

// Only real web links; no loops back into the shortener
export function cleanTargetUrl(input: string): string | null {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) return null;
    if (/(^|\.)influanto\.com$/i.test(u.hostname) && u.pathname.startsWith("/s/")) return null;
    if (s.length > 2048) return null;
    return u.toString();
  } catch {
    return null;
  }
}

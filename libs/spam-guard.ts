import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Minimum time (ms) between the signup form rendering and being submitted.
// A bot that fetches the page and POSTs immediately — or skips rendering
// the form entirely and hits the API directly — submits far faster than
// any human could read the form and type an email.
export const MIN_FORM_FILL_MS = 1200;

let limiter: Ratelimit | null | undefined;

function getRateLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    limiter = null;
    return limiter;
  }
  limiter = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "ratelimit:newsletter-subscribe",
  });
  return limiter;
}

// Fails open (allows the request) if Upstash isn't configured, e.g. in local
// dev, rather than breaking signups when the rate limiter itself is unavailable.
export async function isRateLimited(ip: string): Promise<boolean> {
  const rl = getRateLimiter();
  if (!rl) return false;
  try {
    const { success } = await rl.limit(ip);
    return !success;
  } catch {
    return false;
  }
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamailblock.com", "10minutemail.com",
  "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "sharklasers.com",
  "dispostable.com", "getnada.com", "fakeinbox.com", "throwawaymail.com", "maildrop.cc",
  "mintemail.com", "mailnesia.com", "spamgourmet.com", "moakt.com", "emailondeck.com",
  "33mail.com", "mytemp.email", "tempinbox.com", "mohmal.com", "harakirimail.com",
  "burnermail.io", "mailcatch.com", "spambog.com", "tmpmail.org", "tempail.com",
  "inboxkitten.com", "discard.email", "dropmail.me", "mailtemp.net", "tempr.email",
  "fakemailgenerator.com", "crazymailing.com", "mailsac.com", "20minutemail.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return !!domain && DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function getRequestIp(req: Request & { ip?: string }): string {
  return (
    req.ip ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

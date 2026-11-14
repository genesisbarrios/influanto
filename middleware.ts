import { NextResponse, type NextRequest } from "next/server";
import { isAppHost } from "@/libs/customDomains";

// Custom domains (Pro): a request on a user's own domain serves their public
// pages without changing the address bar.
//   /                    -> their Link in Bio
//   /release/*, /epk/*   -> release pages and EPKs, as on influanto.com
//   anything else        -> redirected to influanto.com (login, dashboard, …)

// Paths served as-is on a custom domain (pages above plus what they load)
const PASS_THROUGH = /^\/(release|epk|embed|code|api|ingest)(\/|$)/;
const STATIC_FILE = /\.[a-z0-9]+$/i;

// domain -> username, per edge instance. Short TTL so a removed domain or a
// downgraded account stops serving within a minute.
const TTL_MS = 60_000;
const cache = new Map<string, { username: string | null; expires: number }>();

async function usernameForDomain(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && hit.expires > Date.now()) return hit.username;

  let username: string | null = null;
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/custom_domains`
      + `?select=users(username,has_access)&verified=eq.true&domain=eq.${encodeURIComponent(host)}&limit=1`;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (res.ok) {
      const rows = await res.json();
      const user = rows?.[0]?.users;
      // Only Pro accounts are served; a lapsed plan falls back to influanto.com
      if (user?.username && user.has_access) username = user.username;
    }
  } catch (e) {
    console.error("custom domain lookup failed:", e);
    return null; // don't cache a failed lookup
  }
  cache.set(host, { username, expires: Date.now() + TTL_MS });
  return username;
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host || isAppHost(host)) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  const username = await usernameForDomain(host);
  if (!username) return NextResponse.redirect(new URL(`https://influanto.com${pathname}${search}`));

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${username}`;
    return NextResponse.rewrite(url);
  }
  if (PASS_THROUGH.test(pathname) || STATIC_FILE.test(pathname)) return NextResponse.next();

  return NextResponse.redirect(new URL(`https://influanto.com${pathname}${search}`));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

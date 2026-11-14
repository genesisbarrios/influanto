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

// domain -> owner, per edge instance. Short TTL so a removed domain or a
// downgraded account stops serving within a minute.
const TTL_MS = 60_000;
type Owner = { id: string; username: string; slugs: Set<string> } | null;
const cache = new Map<string, { owner: Owner; expires: number }>();

const supabaseGet = async (path: string) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  return res.json();
};

// The domain's owner and their release page / EPK slugs (lower-cased: slugs
// are matched case-insensitively, as on influanto.com).
async function ownerForDomain(host: string): Promise<Owner> {
  const hit = cache.get(host);
  if (hit && hit.expires > Date.now()) return hit.owner;

  let owner: Owner = null;
  try {
    const rows = await supabaseGet(
      `custom_domains?select=users(id,username,has_access)&verified=eq.true&domain=eq.${encodeURIComponent(host)}&limit=1`
    );
    const user = rows?.[0]?.users;
    // Only Pro accounts are served; a lapsed plan falls back to influanto.com
    if (user?.username && user.has_access) {
      const pages = await supabaseGet(`release_pages?select=slug&user_id=eq.${encodeURIComponent(user.id)}`);
      owner = {
        id: user.id,
        username: user.username,
        slugs: new Set((pages ?? []).map((p: any) => String(p.slug ?? "").toLowerCase()).filter(Boolean)),
      };
    }
  } catch (e) {
    console.error("custom domain lookup failed:", e);
    return null; // don't cache a failed lookup
  }
  cache.set(host, { owner, expires: Date.now() + TTL_MS });
  return owner;
}

// /release/<slug> or /epk/<slug> → the slug (decoded); otherwise null
function pageSlug(pathname: string): string | null {
  const m = pathname.match(/^\/(release|epk)\/([^/]+)\/?$/);
  if (!m) return null;
  try { return decodeURIComponent(m[2]); } catch { return m[2]; }
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host || isAppHost(host)) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  const owner = await ownerForDomain(host);
  const toInfluanto = () => NextResponse.redirect(new URL(`https://influanto.com${pathname}${search}`));
  if (!owner) return toInfluanto();

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${owner.username}`;
    return NextResponse.rewrite(url);
  }
  // Release pages and EPKs: only the domain owner's own pages are served here;
  // anyone else's open on influanto.com instead.
  const slug = pageSlug(pathname);
  if (slug !== null) return owner.slugs.has(slug.toLowerCase()) ? NextResponse.next() : toInfluanto();
  if (PASS_THROUGH.test(pathname) || STATIC_FILE.test(pathname)) return NextResponse.next();

  return NextResponse.redirect(new URL(`https://influanto.com${pathname}${search}`));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

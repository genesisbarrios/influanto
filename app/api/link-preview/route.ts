import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { lookup } from "dns/promises";
import net from "net";
import { extractPreview } from "@/libs/linkPreview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Fetches a public product/store page server-side and returns its preview image
// (og:image / twitter:image / JSON-LD product image) and title. Used to auto-fill
// thumbnails for custom merch links. Signed-in only, with SSRF protections:
// http(s) only, no private/loopback/link-local targets (checked on every redirect),
// short timeout and a capped response size.

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 4;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicUrl(u: URL) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) links are supported");
  if (u.port && !["80", "443", ""].includes(u.port)) throw new Error("Port not allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Host not allowed");
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("Host not allowed");
}

async function fetchHtml(start: string): Promise<{ html: string; finalUrl: string }> {
  let url = new URL(start);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicUrl(url);
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          // Many storefronts serve bots a stripped page; a browser UA gets the real meta tags.
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = new URL(res.headers.get("location")!, url);
        continue;
      }
      if (!res.ok) throw new Error(`Page returned ${res.status}`);
      const type = res.headers.get("content-type") || "";
      if (type.startsWith("image/")) return { html: `<meta property="og:image" content="${url.toString()}">`, finalUrl: url.toString() };
      if (!/html|xml/.test(type)) throw new Error("Link isn't a web page");
      // Read at most MAX_BYTES — the <head> is all we need.
      const reader = res.body!.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < MAX_BYTES) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      reader.cancel().catch(() => {});
      return { html: Buffer.concat(chunks).toString("utf8"), finalUrl: url.toString() };
    }
    throw new Error("Too many redirects");
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw = (req.nextUrl.searchParams.get("url") || "").trim();
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

  try {
    const { html, finalUrl } = await fetchHtml(raw);
    const preview = extractPreview(html, finalUrl);
    return NextResponse.json(preview, { headers: { "Cache-Control": "private, max-age=600" } });
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "The page took too long to respond" : e?.message || "Couldn't read that page";
    return NextResponse.json({ image: null, title: null, error: msg }, { status: 200 });
  }
}

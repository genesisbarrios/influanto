import { NextRequest, NextResponse } from "next/server";
import supabase from "@/libs/supabase";

function getDevice(ua: string): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!ua) return "unknown";
  if (/iPad/i.test(ua)) return "tablet";
  if (/Tablet/i.test(ua)) return "tablet";
  if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "mobile";
  return "desktop";
}
function getBrowser(ua: string): string {
  if (!ua) return "Other";
  if (/SamsungBrowser/i.test(ua)) return "Samsung";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  if (/Edg/i.test(ua)) return "Edge";
  if (/Firefox|FxiOS/i.test(ua)) return "Firefox";
  if (/(Chrome|CriOS)/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua)) return "Safari";
  return "Other";
}
function getOS(ua: string): string {
  if (!ua) return "Other";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}
function parseReferrer(ref: string | null): string {
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("t.co") || host.includes("twitter.com") || host.includes("x.com")) return "Twitter / X";
    if (host.includes("youtube.com")) return "YouTube";
    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("google.com")) return "Google";
    return host;
  } catch { return "Direct"; }
}
function isBot(ua: string): boolean {
  return /bot|crawl|spider|scraper|headless|curl|wget|python|go-http/i.test(ua);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const codeId = params.id;
  const fallback = NextResponse.redirect("https://influanto.com", 302);

  try {
    // Find the qr_codes row whose JSONB codes array contains this code id
    const { data: rows } = await supabase
      .from("qr_codes")
      .select("user_id, codes")
      .contains("codes", [{ id: codeId }]);

    let destinationUrl: string | null = null;
    let userId: string | null = null;

    if (rows?.length) {
      const codes = rows[0].codes as any[];
      const code = codes?.find((c: any) => c.id === codeId);
      if (code?.url) {
        destinationUrl = code.url;
        userId = rows[0].user_id;
      }
    }

    if (!destinationUrl) return fallback;

    // Destinations are sometimes saved without a scheme ("example.com"), which
    // NextResponse.redirect rejects (it needs an absolute URL) — normalize it.
    let target = destinationUrl.trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    try { new URL(target); } catch { return fallback; }

    // Record analytics (non-blocking — don't let this delay the redirect)
    const ua = req.headers.get("user-agent") || "";
    if (!isBot(ua) && userId) {
      supabase.from("qr_code_visits").insert({
        user_id: userId,
        qr_code_id: codeId,
        country: req.headers.get("x-vercel-ip-country") || "Unknown",
        country_code: req.headers.get("x-vercel-ip-country") || "",
        city: req.headers.get("x-vercel-ip-city") || "",
        device: getDevice(ua),
        browser: getBrowser(ua),
        os: getOS(ua),
        referrer: parseReferrer(req.headers.get("referer")),
      }).then(undefined, (e: any) => console.error("QR visit insert error:", e));
    }

    return NextResponse.redirect(target, 302);
  } catch (e) {
    console.error("QR redirect error:", e);
    return fallback;
  }
}

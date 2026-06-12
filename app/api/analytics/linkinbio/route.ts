import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
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

function parseReferrer(referer: string | null): string {
  if (!referer) return "Direct";
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("t.co") || host.includes("twitter.com") || host.includes("x.com")) return "Twitter / X";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("facebook.com") || host.includes("fb.com")) return "Facebook";
    if (host.includes("google.com")) return "Google";
    if (host.includes("snapchat.com")) return "Snapchat";
    if (host.includes("reddit.com")) return "Reddit";
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host.includes("influanto.com")) return "Influanto";
    return host;
  } catch {
    return "Direct";
  }
}

function isBot(ua: string): boolean {
  return /bot|crawl|spider|scraper|headless|curl|wget|python|go-http/i.test(ua);
}

// POST — record a visit (public, called from the link-in-bio public page)
export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ ok: false }, { status: 400 });

    const ua = req.headers.get("user-agent") || "";
    if (isBot(ua)) return NextResponse.json({ ok: true });

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!user) return NextResponse.json({ ok: false }, { status: 404 });

    await supabase.from("link_in_bio_visits").insert({
      user_id: user.id,
      country: req.headers.get("x-vercel-ip-country") || "Unknown",
      country_code: req.headers.get("x-vercel-ip-country") || "",
      city: req.headers.get("x-vercel-ip-city") || "",
      device: getDevice(ua),
      browser: getBrowser(ua),
      os: getOS(ua),
      referrer: parseReferrer(req.headers.get("referer")),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics POST error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET — return aggregated analytics for the signed-in user
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [{ data: recentVisits }, { data: allVisits }] = await Promise.all([
      supabase
        .from("link_in_bio_visits")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("link_in_bio_visits")
        .select("country, device, browser, os, referrer")
        .eq("user_id", userId),
    ]);

    // Visits per day — last 30 days, fill zero gaps
    const dayMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const v of recentVisits ?? []) {
      const key = new Date((v as any).created_at).toISOString().slice(0, 10);
      if (dayMap.has(key)) dayMap.set(key, dayMap.get(key)! + 1);
    }
    const visitsByDay = Array.from(dayMap.entries()).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));

    const aggregate = (field: string) => {
      const map = new Map<string, number>();
      for (const v of allVisits ?? []) {
        const val = (v as any)[field] || "Unknown";
        map.set(val, (map.get(val) || 0) + 1);
      }
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    return NextResponse.json({
      visitsByDay,
      visitsByCountry: aggregate("country").slice(0, 10),
      visitsByDevice: aggregate("device"),
      visitsByBrowser: aggregate("browser"),
      visitsByOS: aggregate("os"),
      visitsByReferrer: aggregate("referrer").slice(0, 10),
      total: (allVisits ?? []).length,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

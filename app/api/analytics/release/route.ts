import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { resolveRange, buildBuckets } from "@/libs/analyticsRange";

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


// POST — record a visit (public, called from the release page)
export async function POST(req: NextRequest) {
  try {
    const { releasePageId } = await req.json();
    if (!releasePageId) return NextResponse.json({ ok: false }, { status: 400 });

    const ua = req.headers.get("user-agent") || "";
    if (isBot(ua)) return NextResponse.json({ ok: true });

    // Verify release page exists and get user_id
    const { data: rp } = await supabase
      .from("release_pages")
      .select("id, user_id")
      .eq("id", releasePageId)
      .single();

    if (!rp) return NextResponse.json({ ok: false }, { status: 404 });

    await supabase.from("release_page_visits").insert({
      release_page_id: releasePageId,
      user_id: rp.user_id,
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
    console.error("Release analytics POST error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET — aggregated analytics for a specific release page (requires auth + ownership)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const releasePageId = searchParams.get("releasePageId");
  const range = searchParams.get("range");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  if (!releasePageId) {
    return NextResponse.json({ error: "releasePageId is required" }, { status: 400 });
  }

  try {
    // Verify ownership
    const { data: rp } = await supabase
      .from("release_pages")
      .select("id")
      .eq("id", releasePageId)
      .eq("user_id", session.user.id)
      .single();

    if (!rp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { start, end } = resolveRange(range, startParam, endParam);

    // All figures below (total + every breakdown) are scoped to the selected range.
    const { data: visits } = await supabase
      .from("release_page_visits")
      .select("created_at, country, device, browser, os, referrer")
      .eq("release_page_id", releasePageId)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    // Visits over time, bucketed to fit the range (day/week/month), zero-gaps filled
    const { keyFor, labelFor, counts, orderedKeys } = buildBuckets(start, end);
    for (const v of visits ?? []) {
      const key = keyFor(new Date((v as any).created_at));
      if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
    }
    const visitsByDay = orderedKeys.map((key) => ({ date: labelFor(key), count: counts.get(key) ?? 0 }));

    const aggregate = (field: string) => {
      const map = new Map<string, number>();
      for (const v of visits ?? []) {
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
      total: (visits ?? []).length,
    });
  } catch (error) {
    console.error("Release analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

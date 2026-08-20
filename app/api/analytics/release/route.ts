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

// Resolve the requested range key (+ optional custom start/end) into a concrete window.
function resolveRange(range: string | null, startParam: string | null, endParam: string | null): { start: Date; end: Date } {
  const end = range === "custom" && endParam ? new Date(`${endParam}T23:59:59.999Z`) : new Date();

  if (range === "custom" && startParam) {
    return { start: new Date(`${startParam}T00:00:00.000Z`), end };
  }

  const start = new Date();
  switch (range) {
    case "60d": start.setDate(start.getDate() - 60); break;
    case "90d": start.setDate(start.getDate() - 90); break;
    case "6m": start.setMonth(start.getMonth() - 6); break;
    case "9m": start.setMonth(start.getMonth() - 9); break;
    case "1y": start.setFullYear(start.getFullYear() - 1); break;
    case "2y": start.setFullYear(start.getFullYear() - 2); break;
    case "30d":
    default: start.setDate(start.getDate() - 30); break;
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

// Buckets the [start, end] window into days/weeks/months depending on span,
// so a 2-year range doesn't render as 730 unreadable daily bars.
function buildBuckets(start: Date, end: Date) {
  const spanDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const granularity: "day" | "week" | "month" = spanDays > 400 ? "month" : spanDays > 100 ? "week" : "day";

  const keyFor = (d: Date) => {
    if (granularity === "month") return d.toISOString().slice(0, 7); // YYYY-MM
    if (granularity === "week") {
      const monday = new Date(d);
      const dow = (monday.getUTCDay() + 6) % 7; // 0 = Monday
      monday.setUTCDate(monday.getUTCDate() - dow);
      return monday.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const labelFor = (key: string) => {
    if (granularity === "month") {
      const [y, m] = key.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
    }
    return key.slice(5); // MM-DD
  };

  const counts = new Map<string, number>();
  const orderedKeys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = keyFor(cursor);
    if (!counts.has(key)) { counts.set(key, 0); orderedKeys.push(key); }
    if (granularity === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (granularity === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return { keyFor, labelFor, counts, orderedKeys };
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

// GET /api/analytics/newsletter?newsletterId=...
// Aggregated open/click analytics for one newsletter (owner only).
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please Sign In." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const newsletterId = searchParams.get("newsletterId");
  if (!newsletterId) return NextResponse.json({ error: "newsletterId is required" }, { status: 400 });

  try {
    // Ownership check
    const { data: nl } = await supabase
      .from("newsletters")
      .select("id, sent_count")
      .eq("id", newsletterId)
      .eq("user_id", session.user.id)
      .single();
    if (!nl) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: events } = await supabase
      .from("newsletter_events")
      .select("type, contact_id, url, created_at")
      .eq("newsletter_id", newsletterId);

    const all = events ?? [];
    const sends = all.filter((e: any) => e.type === "send");
    const opens = all.filter((e: any) => e.type === "open");
    const clicks = all.filter((e: any) => e.type === "click");

    const uniq = (rows: any[]) => new Set(rows.map((r) => r.contact_id || "anon")).size;

    const sent = nl.sent_count || sends.length;
    const uniqueOpens = uniq(opens);
    const uniqueClicks = uniq(clicks);

    // Clicks grouped by destination url
    const urlMap = new Map<string, number>();
    for (const c of clicks) {
      const u = (c as any).url || "Unknown";
      urlMap.set(u, (urlMap.get(u) || 0) + 1);
    }
    const clicksByLink = Array.from(urlMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Opens + clicks per day over the last 30 days (zero-filled)
    const dayMap = new Map<string, { opens: number; clicks: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), { opens: 0, clicks: 0 });
    }
    for (const e of all) {
      if ((e as any).type !== "open" && (e as any).type !== "click") continue;
      const key = new Date((e as any).created_at).toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (bucket) bucket[(e as any).type === "open" ? "opens" : "clicks"]++;
    }
    const byDay = Array.from(dayMap.entries()).map(([date, v]) => ({
      date: date.slice(5),
      opens: v.opens,
      clicks: v.clicks,
    }));

    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

    return NextResponse.json({
      sent,
      totalOpens: opens.length,
      uniqueOpens,
      totalClicks: clicks.length,
      uniqueClicks,
      openRate: pct(uniqueOpens, sent),
      clickRate: pct(uniqueClicks, sent),
      clicksByLink,
      byDay,
    });
  } catch (error) {
    console.error("Newsletter analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

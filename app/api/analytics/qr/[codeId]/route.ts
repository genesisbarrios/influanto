import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export async function GET(req: NextRequest, { params }: { params: { codeId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Premium check
  const { data: userRow } = await supabase
    .from("users")
    .select("has_access")
    .eq("id", session.user.id)
    .single();

  if (!userRow?.has_access) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const { codeId } = params;

  // Verify the code belongs to this user
  const { data: row } = await supabase
    .from("qr_codes")
    .select("codes")
    .eq("user_id", session.user.id)
    .contains("codes", [{ id: codeId }])
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: recentVisits }, { data: allVisits }] = await Promise.all([
    supabase
      .from("qr_code_visits")
      .select("created_at")
      .eq("qr_code_id", codeId)
      .eq("user_id", session.user.id)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("qr_code_visits")
      .select("country, device, browser, os, referrer")
      .eq("qr_code_id", codeId)
      .eq("user_id", session.user.id),
  ]);

  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const v of recentVisits ?? []) {
    const key = new Date((v as any).created_at).toISOString().slice(0, 10);
    if (dayMap.has(key)) dayMap.set(key, dayMap.get(key)! + 1);
  }
  const visitsByDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date: date.slice(5), count }));

  const aggregate = (field: string) => {
    const map = new Map<string, number>();
    for (const v of allVisits ?? []) {
      const val = (v as any)[field] || "Unknown";
      map.set(val, (map.get(val) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
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
}

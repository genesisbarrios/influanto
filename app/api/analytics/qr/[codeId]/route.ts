import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { resolveRange, buildBuckets } from "@/libs/analyticsRange";

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
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  // Verify the code belongs to this user
  const { data: row } = await supabase
    .from("qr_codes")
    .select("codes")
    .eq("user_id", session.user.id)
    .contains("codes", [{ id: codeId }])
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { start, end } = resolveRange(range, startParam, endParam);

  // All figures below (total + every breakdown) are scoped to the selected range.
  const { data: visits } = await supabase
    .from("qr_code_visits")
    .select("created_at, country, device, browser, os, referrer")
    .eq("qr_code_id", codeId)
    .eq("user_id", session.user.id)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

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
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
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
}

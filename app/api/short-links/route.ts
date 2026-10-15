import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { SHORT_LINK_LIMITS, cleanTargetUrl, isValidAlias, randomCode } from "@/libs/shortLinks";

export const dynamic = "force-dynamic";

// GET: your short links (newest first)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Sign in to see your links" }, { status: 401 });
  const { data, error } = await supabase
    .from("short_links")
    .select("code, url, clicks, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST { url, alias? }: create a short link
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Create a free account to shorten links" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));

  const url = cleanTargetUrl(body.url);
  if (!url) return NextResponse.json({ error: "Enter a valid web link (https://…)" }, { status: 400 });

  const [{ count }, { data: account }] = await Promise.all([
    supabase.from("short_links").select("code", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("users").select("has_access").eq("id", userId).single(),
  ]);
  const limit = account?.has_access ? SHORT_LINK_LIMITS.pro : SHORT_LINK_LIMITS.free;
  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: `Free accounts can have up to ${SHORT_LINK_LIMITS.free} short links. Delete one or upgrade to Pro for unlimited.` }, { status: 403 });
  }

  const alias = String(body.alias || "").trim().toLowerCase();
  if (alias) {
    if (!isValidAlias(alias)) return NextResponse.json({ error: "Custom alias: 3–40 letters, numbers, or dashes" }, { status: 400 });
    const { error } = await supabase.from("short_links").insert({ code: alias, url, user_id: userId });
    if (error) {
      const taken = error.code === "23505";
      return NextResponse.json({ error: taken ? "That alias is taken — try another" : error.message }, { status: taken ? 409 : 500 });
    }
    return NextResponse.json({ data: { code: alias, url, clicks: 0 } }, { status: 201 });
  }

  // Random code; retry on the (rare) collision
  for (let i = 0; i < 5; i++) {
    const code = randomCode(i < 3 ? 6 : 8);
    const { error } = await supabase.from("short_links").insert({ code, url, user_id: userId });
    if (!error) return NextResponse.json({ data: { code, url, clicks: 0 } }, { status: 201 });
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Couldn't create a link, please try again" }, { status: 500 });
}

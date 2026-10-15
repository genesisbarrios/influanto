import { NextRequest, NextResponse } from "next/server";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

// influanto.com/s/<code> → the saved link (counts the click)
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = String(params.code || "").toLowerCase();
  const { data } = await supabase.from("short_links").select("url, clicks").eq("code", code).maybeSingle();
  if (!data?.url) return NextResponse.redirect(new URL("/Link-Shortener?missing=1", req.nextUrl.origin), 302);
  // Awaited: serverless functions can stop work left running after the response
  try { await supabase.from("short_links").update({ clicks: (data.clicks ?? 0) + 1 }).eq("code", code); } catch { /* never block the redirect */ }
  return NextResponse.redirect(data.url, 302);
}

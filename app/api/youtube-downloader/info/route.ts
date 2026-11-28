import { NextRequest, NextResponse } from "next/server";
import { FREE_MAX_HEIGHT, callDownloader, downloaderConfigured, isPro } from "@/libs/ytDownloader";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { url }: the video's title, length, thumbnail and qualities, plus this
// user's quality cap (null = full quality).
export async function POST(req: NextRequest) {
  if (!downloaderConfigured()) return NextResponse.json({ error: "The downloader isn't available right now." }, { status: 503 });
  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim()) return NextResponse.json({ error: "Paste a YouTube link." }, { status: 400 });
  const [pro, r] = await Promise.all([isPro(), callDownloader("/api/info", { url: url.trim().slice(0, 500) })]);
  if (!r.ok) return NextResponse.json({ error: r.data?.error || "Couldn't read that video." }, { status: r.status === 401 ? 503 : 400 });
  return NextResponse.json({ info: r.data, pro, maxHeight: pro ? null : FREE_MAX_HEIGHT });
}

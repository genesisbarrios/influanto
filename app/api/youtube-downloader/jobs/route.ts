import { NextRequest, NextResponse } from "next/server";
import { FREE_MAX_HEIGHT, callDownloader, downloaderConfigured, downloaderUrl, isPro } from "@/libs/ytDownloader";

export const dynamic = "force-dynamic";

// POST { url, opts }: start a download with this user's quality cap (enforced
// on the downloader server, whatever the browser asks for). Returns where the
// browser follows progress and fetches the file.
export async function POST(req: NextRequest) {
  if (!downloaderConfigured()) return NextResponse.json({ error: "The downloader isn't available right now." }, { status: 503 });
  const { url, opts } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim()) return NextResponse.json({ error: "Paste a YouTube link." }, { status: 400 });
  const pro = await isPro();
  const r = await callDownloader("/api/partner/jobs", {
    url: url.trim().slice(0, 500),
    opts: opts && typeof opts === "object" ? opts : {},
    maxHeight: pro ? undefined : FREE_MAX_HEIGHT,
  });
  if (!r.ok) return NextResponse.json({ error: r.data?.error || "Couldn't start the download." }, { status: r.status === 503 ? 503 : 400 });
  const base = downloaderUrl();
  const q = `t=${encodeURIComponent(r.data.token)}`;
  return NextResponse.json({
    events: `${base}/api/jobs/${r.data.id}/events?${q}`,
    file: `${base}/api/jobs/${r.data.id}/file?${q}`,
    opts: r.data.opts,
  });
}

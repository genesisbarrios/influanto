// The YouTube downloader runs on its own server (YoutubeUtilityManager, see
// its README: "Host it for Influanto"), because Vercel can't run yt-dlp or
// ffmpeg. Influanto starts each download there with the quality cap for this
// user; the browser then follows progress and downloads the file from that
// server directly, using the job's access token.
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export const FREE_MAX_HEIGHT = 720;

export const downloaderUrl = () => (process.env.YT_DOWNLOADER_URL || "").replace(/\/+$/, "");

export function downloaderConfigured() {
  return !!downloaderUrl() && !!process.env.YT_DOWNLOADER_KEY;
}

/** POST to the downloader server with the partner key. */
export async function callDownloader(path: string, body: unknown) {
  const r = await fetch(`${downloaderUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-partner-key": process.env.YT_DOWNLOADER_KEY || "" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

/** Pro accounts get full quality; everyone else (signed out included) is capped at 720p. */
export async function isPro() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;
  const { data } = await supabase.from("users").select("has_access").eq("id", session.user.id).single();
  return !!data?.has_access;
}

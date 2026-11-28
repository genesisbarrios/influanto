import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
const title = "YouTube Downloader: MP4, MOV, MP3 & WAV | Influanto";
const description =
  "Download YouTube videos as MP4 or MOV, or the audio as MP3, WAV or M4A. Free up to 720p, full quality up to 4K with Pro. Download just part of a video, too.";

export const metadata = getSEOTags({
  title,
  description,
  keywords: ["youtube downloader", "youtube to mp4", "youtube to mp3", "youtube to wav", "youtube to mov", "download youtube video", "youtube clip downloader"],
  canonicalUrlRelative: "/YouTube-Downloader",
  openGraph: { title, description, url: "https://www.influanto.com/YouTube-Downloader" },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
const title = "Free WAV to MP3 Converter — 320 kbps, No Upload | Influanto";
const description =
  "Convert WAV to MP3 free at 128, 192, 256 or 320 kbps. Drop in several files at once. Runs in your browser, so your music is never uploaded.";

export const metadata = getSEOTags({
  title,
  description,
  keywords: ["wav to mp3", "wav to mp3 converter", "convert wav to mp3", "wav to mp3 320kbps", "free wav to mp3 converter", "audio converter"],
  canonicalUrlRelative: "/WAV-to-MP3",
  openGraph: { title, description, url: "https://www.influanto.com/WAV-to-MP3" },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

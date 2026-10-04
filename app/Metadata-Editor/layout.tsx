import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Music Metadata Editor \u2014 Tag MP3 Files Online | Influanto",
  description: "Free online music metadata editor. Edit MP3 tags like title, artist, album, and artwork before you send or release your music.",
  keywords: ["mp3 tag editor", "music metadata editor", "edit mp3 metadata online", "id3 tag editor"],
  canonicalUrlRelative: "/Metadata-Editor",
  openGraph: {
    title: "Music Metadata Editor \u2014 Tag MP3 Files Online | Influanto",
    description: "Free online music metadata editor. Edit MP3 tags like title, artist, album, and artwork before you send or release your music.",
    url: "https://www.influanto.com/Metadata-Editor",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

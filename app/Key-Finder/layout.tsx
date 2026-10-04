import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Song Key Finder \u2014 Detect the Key of Any Song | Influanto",
  description: "Free online song key finder. Upload a track or use your microphone to detect its musical key and scale.",
  keywords: ["key finder", "song key finder", "what key is this song in", "detect song key"],
  canonicalUrlRelative: "/Key-Finder",
  openGraph: {
    title: "Song Key Finder \u2014 Detect the Key of Any Song | Influanto",
    description: "Free online song key finder. Upload a track or use your microphone to detect its musical key and scale.",
    url: "https://www.influanto.com/Key-Finder",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

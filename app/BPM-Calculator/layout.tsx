import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "BPM Calculator \u2014 Tap Tempo Online | Influanto",
  description: "Free online BPM calculator. Tap along to any song to find its tempo in beats per minute.",
  keywords: ["bpm calculator", "tap tempo", "find bpm of a song", "tempo finder"],
  canonicalUrlRelative: "/BPM-Calculator",
  openGraph: {
    title: "BPM Calculator \u2014 Tap Tempo Online | Influanto",
    description: "Free online BPM calculator. Tap along to any song to find its tempo in beats per minute.",
    url: "https://www.influanto.com/BPM-Calculator",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

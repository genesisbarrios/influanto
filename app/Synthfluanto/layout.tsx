import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Synthfluanto \u2014 Free Online Synthesizer | Influanto",
  description: "Play Synthfluanto, a free synthesizer that runs in your browser.",
  keywords: ["online synthesizer", "free online synth", "browser synth", "web synthesizer"],
  canonicalUrlRelative: "/Synthfluanto",
  openGraph: {
    title: "Synthfluanto \u2014 Free Online Synthesizer | Influanto",
    description: "Play Synthfluanto, a free synthesizer that runs in your browser.",
    url: "https://www.influanto.com/Synthfluanto",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

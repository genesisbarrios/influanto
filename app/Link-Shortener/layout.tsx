import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Free Link Shortener with Click Tracking | Influanto",
  description: "Shorten long streaming, merch, and pre-save links into clean influanto.com/s/ links with custom aliases and click counts. Free for musicians and creators.",
  keywords: ["link shortener", "free link shortener", "url shortener", "custom short link", "link shortener with analytics", "short link for music", "shorten spotify link"],
  canonicalUrlRelative: "/Link-Shortener",
  openGraph: {
    title: "Free Link Shortener with Click Tracking",
    description: "Turn long links into short influanto.com/s/ links with custom aliases and click counts.",
    url: "https://www.influanto.com/Link-Shortener",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Ear Training for Musicians \u2014 Free Online | Influanto",
  description: "Free online ear training for musicians and producers: practice recognizing intervals, chords, and notes to write better melodies.",
  keywords: ["ear training", "online ear training", "interval training", "ear training for producers"],
  canonicalUrlRelative: "/Ear-Training",
  openGraph: {
    title: "Ear Training for Musicians \u2014 Free Online | Influanto",
    description: "Free online ear training for musicians and producers: practice recognizing intervals, chords, and notes to write better melodies.",
    url: "https://www.influanto.com/Ear-Training",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

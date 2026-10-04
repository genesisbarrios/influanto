import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Free Music Tools for Artists & Producers | Influanto",
  description: "Free online tools for musicians: split sheet generator, BPM calculator, song key finder, delay and reverb calculator, chromatic tuner, metronome, ear training, online synth, and metadata editor.",
  keywords: ["free music tools", "tools for musicians", "music producer tools", "online music tools", "split sheet generator", "bpm calculator", "key finder", "online metronome"],
  canonicalUrlRelative: "/tools",
  openGraph: {
    title: "Free Music Tools for Artists & Producers | Influanto",
    description: "Free online tools for musicians: split sheet generator, BPM calculator, song key finder, delay and reverb calculator, chromatic tuner, metronome, ear training, online synth, and metadata editor.",
    url: "https://www.influanto.com/tools",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

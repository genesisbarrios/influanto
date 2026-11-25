import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Synthfluanto \u2014 Free Online Synthesizer | Influanto",
  description: "Play Synthfluanto, a free online synthesizer: pick oscillator waveforms, shape the sound with filters, reverb, delay and distortion, and record your ideas. No download needed.",
  keywords: ["online synthesizer", "free online synth", "browser synth", "web synthesizer"],
  canonicalUrlRelative: "/Synthfluanto",
  openGraph: {
    title: "Synthfluanto \u2014 Free Online Synthesizer | Influanto",
    description: "Play Synthfluanto, a free online synthesizer: pick oscillator waveforms, shape the sound with filters, reverb, delay and distortion, and record your ideas. No download needed.",
    url: "https://www.influanto.com/Synthfluanto",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

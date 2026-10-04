import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Free Online Metronome — BPM, Time Signatures & Tap Tempo | Influanto",
  description:
    "Free online metronome with a 3D pendulum. Set any tempo from 30 to 260 BPM, tap tempo, accent beat one, and practice in 4/4, 3/4, 6/8, and more with eighth-note, triplet, or sixteenth subdivisions.",
  keywords: [
    "metronome",
    "online metronome",
    "free metronome",
    "metronome online",
    "bpm metronome",
    "metronome with time signature",
    "metronome with subdivisions",
    "tap tempo metronome",
    "metronome for musicians",
  ],
  canonicalUrlRelative: "/Metronome",
  openGraph: {
    title: "Free Online Metronome — BPM, Time Signatures & Tap Tempo",
    description: "Practice with a free online metronome: any BPM, tap tempo, time signatures, subdivisions, and a 3D swinging pendulum.",
    url: "https://www.influanto.com/Metronome",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

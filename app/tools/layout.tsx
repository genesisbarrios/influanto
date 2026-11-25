import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Free Music Tools for Artists & Producers | Influanto",
  description: "Free online tools for musicians: LUFS meter, WAV to MP3 and MP4 to MOV converters, split sheet generator, BPM calculator, key finder, tuner, metronome, ear training, synth, metadata editor and more.",
  keywords: ["free music tools", "tools for musicians", "music producer tools", "online music tools", "split sheet generator", "bpm calculator", "key finder", "online metronome", "lufs meter", "wav to mp3 converter", "mp4 to mov converter", "mp3 tag editor", "online tuner"],
  canonicalUrlRelative: "/tools",
  openGraph: {
    title: "Free Music Tools for Artists & Producers | Influanto",
    description: "Free online tools for musicians: LUFS meter, WAV to MP3 and MP4 to MOV converters, split sheet generator, BPM calculator, key finder, tuner, metronome, ear training, synth, metadata editor and more.",
    url: "https://www.influanto.com/tools",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

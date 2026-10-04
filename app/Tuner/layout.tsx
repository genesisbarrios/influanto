import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Online Chromatic Tuner \u2014 Tune Any Instrument | Influanto",
  description: "Free online chromatic tuner. Use your microphone to tune guitar, bass, ukulele, voice, or any instrument.",
  keywords: ["online tuner", "chromatic tuner", "guitar tuner online", "free tuner"],
  canonicalUrlRelative: "/Tuner",
  openGraph: {
    title: "Online Chromatic Tuner \u2014 Tune Any Instrument | Influanto",
    description: "Free online chromatic tuner. Use your microphone to tune guitar, bass, ukulele, voice, or any instrument.",
    url: "https://www.influanto.com/Tuner",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

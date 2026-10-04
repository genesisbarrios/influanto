import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Delay & Reverb Time Calculator by BPM | Influanto",
  description: "Free delay and reverb time calculator. Enter your BPM to get delay times and reverb pre-delay and decay in milliseconds for every note value.",
  keywords: ["delay calculator", "reverb calculator", "delay time calculator", "bpm to ms", "reverb pre delay calculator"],
  canonicalUrlRelative: "/Reverb-and-Delay-Calculator",
  openGraph: {
    title: "Delay & Reverb Time Calculator by BPM | Influanto",
    description: "Free delay and reverb time calculator. Enter your BPM to get delay times and reverb pre-delay and decay in milliseconds for every note value.",
    url: "https://www.influanto.com/Reverb-and-Delay-Calculator",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

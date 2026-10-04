import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Music Split Sheet Template (Free PDF) | Influanto",
  description: "Free music split sheet template showing exactly what to include: song info, contributors, roles, ownership percentages, publisher, PRO, and IPI numbers. Fill it in online and download a PDF.",
  keywords: ["split sheet template", "music split sheet template", "free split sheet template", "split sheet template pdf", "song split sheet template", "split sheet example"],
  canonicalUrlRelative: "/Split-Sheet-Template",
  openGraph: {
    title: "Music Split Sheet Template (Free PDF) | Influanto",
    description: "Free music split sheet template showing exactly what to include: song info, contributors, roles, ownership percentages, publisher, PRO, and IPI numbers. Fill it in online and download a PDF.",
    url: "https://www.influanto.com/Split-Sheet-Template",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

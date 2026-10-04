import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Free Split Sheet Generator \u2014 Music Split Sheet PDF | Influanto",
  description: "Free music split sheet generator. Add each contributor's role and ownership %, publishing splits, and e-signatures, then download a ready-to-sign split sheet PDF in minutes.",
  keywords: ["split sheet generator", "free split sheet generator", "music split sheet", "split sheet", "split sheet pdf", "song split sheet", "online split sheet", "split sheet maker"],
  canonicalUrlRelative: "/Split-Sheet-Generator",
  openGraph: {
    title: "Free Split Sheet Generator \u2014 Music Split Sheet PDF | Influanto",
    description: "Free music split sheet generator. Add each contributor's role and ownership %, publishing splits, and e-signatures, then download a ready-to-sign split sheet PDF in minutes.",
    url: "https://www.influanto.com/Split-Sheet-Generator",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

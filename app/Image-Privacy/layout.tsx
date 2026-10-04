import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
export const metadata = getSEOTags({
  title: "Image Privacy Cleaner \u2014 Remove EXIF & Location Data | Influanto",
  description: "Free tool to remove EXIF metadata and GPS location from photos before you post them online.",
  keywords: ["remove exif data", "remove location from photo", "exif remover", "image metadata remover"],
  canonicalUrlRelative: "/Image-Privacy",
  openGraph: {
    title: "Image Privacy Cleaner \u2014 Remove EXIF & Location Data | Influanto",
    description: "Free tool to remove EXIF metadata and GPS location from photos before you post them online.",
    url: "https://www.influanto.com/Image-Privacy",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

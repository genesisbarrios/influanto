import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
const title = "Free MP4 to MOV Converter — No Quality Loss | Influanto";
const description =
  "Convert MP4 to MOV for Final Cut Pro, iMovie and QuickTime free, with no re-encoding and zero quality loss. Huge files convert in seconds, right in your browser.";

export const metadata = getSEOTags({
  title,
  description,
  keywords: ["mp4 to mov", "mp4 to mov converter", "convert mp4 to mov", "mp4 to quicktime", "mp4 to mov final cut", "free video converter"],
  canonicalUrlRelative: "/MP4-to-MOV",
  openGraph: { title, description, url: "https://www.influanto.com/MP4-to-MOV" },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

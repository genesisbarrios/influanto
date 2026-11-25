import type { ReactNode } from "react";
import { getSEOTags } from "@/libs/seo";

// The page is a client component, so its title/description live here to be
// server-rendered for search engines.
const title = "LUFS Meter Online — Free Loudness & True Peak Checker | Influanto";
const description =
  "Free online LUFS meter. Drop in a song to measure integrated, short-term and momentary loudness, loudness range (LRA) and true peak, and see how Spotify, Apple Music and YouTube will normalize it. Runs in your browser; nothing is uploaded.";

export const metadata = getSEOTags({
  title,
  description,
  keywords: ["lufs meter", "lufs meter online", "integrated lufs", "loudness meter", "true peak meter", "spotify lufs", "check lufs of a song", "ebu r128"],
  canonicalUrlRelative: "/LUFS-Meter",
  openGraph: { title, description, url: "https://www.influanto.com/LUFS-Meter" },
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

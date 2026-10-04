/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { getSEOTags } from "@/libs/seo";
import FeatureLanding from "@/components/FeatureLanding";

export const metadata: Metadata = getSEOTags({
  title: "Spotify Playlist Curator Contact Tool — Search & Contact Curators | Influanto",
  description:
    "Search & contact Spotify playlist curators in your genre. Influanto's free Spotify playlist curator contact tool finds curator emails, Instagram, and TikTok so you can pitch your music directly.",
  keywords: [
    "spotify playlist curator contact tool",
    "search & contact spotify playlist curators",
    "search and contact spotify playlist curators",
    "spotify playlist curator search",
    "spotify playlist curator contacts",
    "spotify curator email",
    "playlist curator tool",
    "spotify playlist curators",
    "find playlist curators",
    "playlist curator contact",
    "spotify playlist submission",
    "how to contact playlist curators",
    "playlist pitching tool",
    "submit music to spotify playlists",
  ],
  canonicalUrlRelative: "/playlist-curator-tool",
  openGraph: {
    title: "Spotify Playlist Curator Contact Tool — Search & Contact Curators",
    description: "Search & contact Spotify playlist curators by genre — find curator emails, Instagram, and TikTok, then pitch your release directly.",
    url: "https://www.influanto.com/playlist-curator-tool",
  },
});

export default function PlaylistCuratorLanding() {
  return (
    <FeatureLanding
      path="/playlist-curator-tool"
      eyebrow="Spotify Playlist Curator Contact Tool"
      h1="Search & Contact Spotify Playlist Curators"
      subtitle="Search Spotify playlists in your genre, see the curator contact info listed on each playlist, and pitch your release page directly — no paid submission platforms in the middle."
      appName="Influanto Spotify Playlist Curator Contact Tool"
      appDescription="Search Spotify playlists by genre or keyword and find curator contact details to pitch your music directly."
      ctaText="Find Curators Free"
      features={[
        { title: "Search by genre or vibe", body: "Type a genre, mood, or keyword and get matching Spotify playlists to pitch." },
        { title: "Curator contact info", body: "Influanto pulls the email, Instagram, or TikTok that curators list in their playlist descriptions, so you know how to reach them." },
        { title: "Pitch from your dashboard", body: "Email a curator directly from Influanto with a link to your release page attached." },
        { title: "Pitch with a release page", body: "Send curators one clean link with every streaming platform, your artwork, and your socials — not a bare Spotify URL." },
        { title: "Direct, not pay-to-play", body: "Reach curators yourself instead of paying per submission on pitching platforms." },
        { title: "Included free", body: "The curator search and contact tool is part of the free Influanto plan." },
      ]}
      steps={[
        "Sign up free and create a release page for the song you're pitching.",
        "Search playlists by genre or keyword and pick the ones that fit your sound.",
        "Email the curator from your dashboard, or reach out on the Instagram or TikTok they list.",
      ]}
      sections={[
        {
          heading: "How to Pitch Playlist Curators Without Getting Ignored",
          body: (
            <>
              <p>Curators get flooded with pitches. Pick playlists that genuinely match your song, keep your message short and personal, and send one link that makes it easy to listen — a release page with every streaming platform works better than a raw Spotify link.</p>
              <p>Pitch a few weeks before release day when you can, and follow the curator's preferred contact method if they list one in the playlist description.</p>
            </>
          ),
        },
      ]}
      faqs={[
        { q: "How do I find Spotify playlist curators?", a: "Search Spotify playlists that match your genre, then check each playlist's description for the curator's contact info. Influanto's curator tool does both at once — search by genre or keyword and it pulls out the email, Instagram, or TikTok listed by the curator." },
        { q: "Is the playlist curator tool free?", a: "Yes. The playlist curator search and contact tool is included in Influanto's free plan." },
        { q: "Do I have to pay curators to get on playlists?", a: "No. Influanto helps you contact curators directly. Paying for guaranteed playlist placement can violate Spotify's rules, so pitching curators yourself is the safer approach." },
        { q: "What should I send a playlist curator?", a: "A short, personal message explaining why your song fits their playlist, plus one link to listen. An Influanto release page gives them every streaming platform, your artwork, and your socials in one place." },
      ]}
      related={[
        { href: "/blog/music-release-pages-indie-artists", label: "Why artists use release pages" },
        { href: "/newsletter", label: "Newsletter & mailing list" },
        { href: "/link-in-bio", label: "Link in bio for musicians" },
      ]}
    />
  );
}

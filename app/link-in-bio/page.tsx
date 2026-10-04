/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { getSEOTags } from "@/libs/seo";
import FeatureLanding from "@/components/FeatureLanding";

export const metadata: Metadata = getSEOTags({
  title: "Link in Bio for Musicians & Indie Artists — Free | Influanto",
  description:
    "Free link in bio for independent artists: streaming links, merch, a newsletter signup to grow your mailing list, Meta Pixel tracking, and click analytics — all on one page.",
  keywords: [
    "link in bio",
    "link in bio for musicians",
    "indie artist link in bio",
    "link in bio for artists",
    "music link in bio",
    "link in bio with newsletter signup",
    "linktree alternative for musicians",
    "free link in bio",
  ],
  canonicalUrlRelative: "/link-in-bio",
  openGraph: {
    title: "Link in Bio for Musicians & Indie Artists",
    description: "Streaming links, merch, newsletter signup, and Meta Pixel tracking on one free page built for independent artists.",
    url: "https://www.influanto.com/link-in-bio",
  },
});

export default function LinkInBioLanding() {
  return (
    <FeatureLanding
      path="/link-in-bio"
      eyebrow="Link in Bio"
      h1="The Link in Bio Built for Indie Artists and Musicians"
      subtitle="One link for your Instagram, TikTok, and YouTube bios that sends fans to your music, your merch, and your mailing list — with a newsletter signup built in, so every visitor can become a fan you can actually reach."
      appName="Influanto Link in Bio"
      appDescription="A free link in bio page for musicians with streaming links, merch, newsletter signup, and Meta Pixel tracking."
      features={[
        { title: "All your streaming links", body: "Spotify, Apple Music, YouTube Music, Tidal, Amazon Music, SoundCloud, Bandcamp, Deezer, and more — fans tap straight to your profile on the app they already use." },
        { title: "Newsletter signup built in", body: "Collect emails right on your link in bio and they land in your Influanto mailing list, ready for your next release announcement." },
        { title: "Sell your merch", body: "Show products from your Printify store or add your own merch links, with images, next to your music." },
        { title: "Meta Pixel tracking", body: "Paste your Pixel ID once to track visits and streaming clicks, then retarget those fans with Instagram and Facebook ads." },
        { title: "Make it look like you", body: "Choose your colors, fonts, background image, and button style so the page matches your brand and artwork." },
        { title: "Release pages included", body: "Pair your link in bio with a smart link page for every new song or album, so each release gets its own pre-save and streaming page." },
      ]}
      steps={[
        "Sign up free and pick your username — your page lives at influanto.com/yourname.",
        "Add your streaming profiles, socials, merch, and turn on the newsletter signup.",
        "Customize the colors and fonts, then paste your link into your Instagram, TikTok, and YouTube bios.",
      ]}
      sections={[
        {
          heading: "Why Musicians Need More Than a Generic Link in Bio",
          body: (
            <>
              <p>Generic link-in-bio tools treat your page as a list of buttons. Influanto is built around what independent artists actually need from a bio link: getting fans to stream, buy merch, and join a mailing list you own.</p>
              <p>Social platforms decide who sees your posts. An email list doesn't. Putting a newsletter signup on the page every fan already visits is the easiest way to turn followers into an audience you can reach on release day.</p>
            </>
          ),
        },
      ]}
      faqs={[
        { q: "Is the Influanto link in bio free?", a: "Yes. The free plan includes a link in bio page, release pages, a QR code generator, newsletter tools for up to 50 contacts, and split sheets. Influanto Pro adds unlimited contacts and newsletters, more release pages, and analytics." },
        { q: "Can I collect emails from my link in bio?", a: "Yes. Turn on the newsletter signup and visitors can subscribe right from your page. Subscribers are added to your Influanto contacts so you can email them newsletters and release announcements." },
        { q: "Is Influanto a Linktree alternative for musicians?", a: "Yes. Influanto covers the same one-link use case, but adds music-specific features like streaming platform links, release pages, merch, a mailing list, and Meta Pixel tracking in one place." },
        { q: "Can I add a Meta (Facebook) Pixel to my link in bio?", a: "Yes. Add your Pixel ID in your profile settings and Influanto tracks page views, link clicks, and streaming clicks on your link in bio and release pages." },
      ]}
      related={[
        { href: "/newsletter", label: "Newsletter & mailing list for artists" },
        { href: "/qr-code-generator", label: "QR code generator" },
        { href: "/blog/link-in-bio-for-independent-artists", label: "Why every artist needs a link in bio" },
        { href: "/blog/how-to-set-up-meta-pixel-for-musicians", label: "Set up a Meta Pixel" },
      ]}
    />
  );
}

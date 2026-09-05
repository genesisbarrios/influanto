/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faLink } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Why Indie Artists Should Use Release Pages Instead of Pasting Links | Influanto",
  description: "Stop dropping Spotify links in your Instagram Stories. Learn why dedicated music release pages help independent artists and producers get more streams, grow their fanbase, and look professional on every platform.",
  keywords: [
    "music release page",
    "smart link for music",
    "indie artist release strategy",
    "how to promote a song independently",
    "music smart link",
    "release link page musician",
    "independent artist music promotion",
    "pre-save music release",
    "music release marketing",
    "how to release music independently 2025",
    "all-platform music link",
  ],
  openGraph: {
    title: "Why Indie Artists Should Use Release Pages Instead of Pasting Links",
    description: "A single release page beats a Spotify link every time. Here's why smart links are the standard for independent artists in 2025.",
    type: "article",
    url: "https://influanto.com/blog/music-release-pages-indie-artists",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Indie Artists Should Use Release Pages Instead of Pasting Links",
    description: "A single release page beats a Spotify link every time. Here's why smart links are the standard for independent artists in 2025.",
  },
  alternates: { canonical: "https://influanto.com/blog/music-release-pages-indie-artists" },
};

export default function PostReleasePages() {
  return (
    <>
      <Suspense><Header /></Suspense>
      <main style={{ background: "#f9fafb", minHeight: "80vh" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)", padding: "3.5rem 1.5rem 3rem" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Link href="/blog" style={{ color: "#6ee7b7", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Blog</Link>
              <span style={{ color: "#10b981", fontSize: 13 }}>/</span>
              <span style={{ color: "#6ee7b7", fontSize: 12, background: "#10b98120", padding: "2px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>Releases</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
              Why Indie Artists Should Use Release Pages Instead of Pasting Links
            </h1>
            <p style={{ color: "#a7f3d0", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: 20 }}>
              Dropping a new song? A single release page beats a Spotify link every time. Here's why smart links are the standard for independent artists in 2025 — and what you're losing by skipping them.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#6ee7b7", fontSize: 13 }}>June 2026</span>
              <span style={{ color: "#34d399", fontSize: 13 }}>·</span>
              <span style={{ color: "#6ee7b7", fontSize: 13 }}>7 min read</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", lineHeight: 1.8, color: "#374151", fontSize: "1.05rem" }}>

            <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: 500, marginBottom: "1.5rem" }}>
              You just finished mastering your new single. You've got the cover art ready, the distributor is lined up, and you're planning your rollout. Then you copy the Spotify link from DistroKid and paste it into your Instagram story. Job done, right?
            </p>

            <p>
              Not quite. That single Spotify link just cut off every Apple Music listener, every Amazon Music user, every fan using Tidal or YouTube Music. And because it disappears from Stories in 24 hours, most of the people who missed your post today will never find the song at all. A <strong>music release page</strong> fixes all of this in one step.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What Is a Music Release Page?</h2>
            <p>
              A music release page — sometimes called a smart link or pre-save link — is a dedicated webpage for a single release. It houses all your streaming platform links in one place, shows your cover art, and gives fans a clean destination to find your music regardless of which platform they use.
            </p>
            <p>
              Instead of saying "Spotify link in bio," you share one URL — something like <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: "0.9rem" }}>influanto.com/release/song-title</code> — and it works for everyone. Spotify users click Spotify. Apple Music users click Apple Music. The page handles the routing.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>The Problem with Just Dropping a Platform Link</h2>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>You're Excluding Listeners on Other Platforms</h3>
            <p>
              According to industry data, Spotify has around 31% of the global music streaming market share — which means roughly <strong>69% of streaming listeners</strong> are on other platforms. When you post only a Spotify link, you're immediately shutting the door on the majority of potential streams. Apple Music alone has over 88 million subscribers. Amazon Music, YouTube Music, and Tidal add millions more.
            </p>
            <p>
              An independent artist can't afford to leave streams on the table. A release page with links to every major platform captures all of them.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Stories Disappear — Your Release Page Doesn't</h3>
            <p>
              An Instagram Story lasts 24 hours. A TikTok video might trend for a few days before it's buried by the algorithm. But a release page URL can live in your bio, get shared in DMs, posted on Reddit music communities, sent in newsletters, and embedded in blog articles — indefinitely. It has a permanent home on the internet that fans can find months after your release date.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>It Looks More Professional</h3>
            <p>
              When playlist curators, music blogs, podcast hosts, and sync licensing contacts receive a release page link, they see a clean, branded page with your artwork, artist name, and all relevant information. When they receive a raw Spotify URL, they see a Spotify page stripped of your branding and context. First impressions matter enormously in a competitive independent music scene.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What Makes a Great Music Release Page?</h2>
            <p>Not all release pages are created equal. Here's what the best ones include:</p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li><strong>Cover art</strong> — full-size, high-quality image that represents the release</li>
              <li><strong>All major streaming links</strong> — Spotify, Apple Music, YouTube Music, Amazon Music, Tidal, Deezer, Pandora, SoundCloud</li>
              <li><strong>Artist name and release title</strong> — clearly visible above the fold</li>
              <li><strong>Download link</strong> — for Bandcamp or direct purchases if applicable</li>
              <li><strong>Newsletter signup</strong> — capture fans while their attention is on your music</li>
              <li><strong>Custom branding</strong> — your colors and font, not a generic template</li>
              <li><strong>Social sharing</strong> — make it easy for fans to share the release page itself</li>
              <li><strong>Pre-save functionality</strong> — for upcoming releases, let fans save before the drop date</li>
            </ul>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>How Independent Artists Use Release Pages in Their Rollout</h2>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Before the Release: Pre-Save Campaigns</h3>
            <p>
              If you're planning a release, you can create your release page in advance and use it to collect pre-saves on Spotify and Apple Music. Pre-saves increase the chances of your song showing up in algorithmic playlists like Release Radar on day one because the platform already knows listeners have flagged interest.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>On Release Day: One Link for Everything</h3>
            <p>
              On release day, you share one URL everywhere: Instagram bio, TikTok bio, Twitter/X, YouTube channel description, email newsletter, press releases, and your website. Every fan lands on the same page and chooses their preferred platform. You never have to update links across ten different places.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>After the Release: Sustained Promotion</h3>
            <p>
              A release page keeps working months after release day. When your song gets picked up by a blog, podcast, or playlist, they can link directly to your release page. When a new fan discovers you six months later, your release page gives them an instant organized snapshot of your catalog.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Release Pages vs. Link in Bio Pages: What's the Difference?</h2>
            <p>
              Both are tools for independent artists, but they serve different purposes:
            </p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li><strong>Link in bio page</strong> — your permanent hub. All your streaming profiles, social links, merch, newsletter. Lives in your bio permanently.</li>
              <li><strong>Release page</strong> — a dedicated page for a specific release. Focuses on one song or album. Changes with each release.</li>
            </ul>
            <p>
              You need both. Your link in bio page is the evergreen hub; your release page is the campaign-specific destination you push during a release rollout.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Common Mistakes Independent Artists Make with Releases</h2>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Posting only a Spotify link and ignoring all other platforms</li>
              <li>Not creating any kind of landing page before the release date (missing pre-save opportunities)</li>
              <li>Using a generic link shortener with no branding</li>
              <li>Forgetting to add a newsletter signup to capture fans at peak engagement</li>
              <li>Sharing different links on different platforms, creating confusion for fans</li>
              <li>Not updating the release page when the song becomes available on new platforms</li>
            </ul>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>The Bottom Line</h2>
            <p>
              Every release deserves its own page. It's the difference between dropping a song and actually releasing it. With a dedicated release page, you're giving your music a permanent, professional home on the internet that works for every fan on every platform — from the moment you announce the song to years after it comes out.
            </p>
            <p>
              For an independent artist competing without a label's marketing budget, that advantage is everything.
            </p>

            {/* GIF preview */}
            <div style={{ margin: "2.5rem 0 0", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <img src="/solymar_releasepage.gif" alt="Example of an Influanto release page for an indie artist" style={{ width: "100%", display: "block" }} />
            </div>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 12, padding: "1.75rem", marginTop: "1.5rem", border: "1px solid #6ee7b7" }}>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#065f46", marginBottom: 8 }}>Create your Release Page on Influanto — free</p>
              <p style={{ color: "#047857", fontSize: "0.95rem", marginBottom: 16 }}>
                Build a branded release page with all major streaming links, cover art, newsletter signup, and your custom colors. No monthly fees, no complicated setup.
              </p>
              <Link
                href="/api/auth/signin?callbackUrl=/dashboard"
                style={{ display: "inline-block", background: "#059669", color: "#fff", fontWeight: 700, padding: "0.75rem 1.75rem", borderRadius: 8, textDecoration: "none", fontSize: "1rem" }}
              >
                Create Your Release Page →
              </Link>
            </div>
          </div>

          {/* Related */}
          <div style={{ marginTop: "2.5rem" }}>
            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: 1 }}>Keep Reading</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <Link href="/blog/link-in-bio-for-independent-artists" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faLink} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Every Independent Artist Needs a Link in Bio</p>
                <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 600 }}>Read →</span>
              </Link>
              <Link href="/blog/split-sheets-indie-artists" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faFileLines} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Split Sheets Are Non-Negotiable for Collabs</p>
                <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 600 }}>Read →</span>
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

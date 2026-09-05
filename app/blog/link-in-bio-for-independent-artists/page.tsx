/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faMusic } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Why Every Independent Artist Needs a Link in Bio | Influanto",
  description: "One social media bio link isn't enough. Learn why independent artists and music producers need a link in bio page to consolidate their streaming profiles, merch, and fan outreach in one place.",
  keywords: [
    "link in bio for musicians",
    "link in bio independent artist",
    "music link in bio",
    "best link in bio for artists",
    "musician bio link page",
    "independent artist marketing",
    "music promotion tools",
    "linktree for musicians",
    "music producer link in bio",
    "indie artist online presence",
  ],
  openGraph: {
    title: "Why Every Independent Artist Needs a Link in Bio",
    description: "One bio link isn't enough. Here's why every independent musician needs a dedicated link in bio page — and what to put on it.",
    type: "article",
    url: "https://influanto.com/blog/link-in-bio-for-independent-artists",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Every Independent Artist Needs a Link in Bio",
    description: "One bio link isn't enough. Here's why every independent musician needs a dedicated link in bio page.",
  },
  alternates: { canonical: "https://influanto.com/blog/link-in-bio-for-independent-artists" },
};

export default function PostLinkInBio() {
  return (
    <>
      <Suspense><Header /></Suspense>
      <main style={{ background: "#f9fafb", minHeight: "80vh" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)", padding: "3.5rem 1.5rem 3rem" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Link href="/blog" style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Blog</Link>
              <span style={{ color: "#6366f1", fontSize: 13 }}>/</span>
              <span style={{ color: "#a5b4fc", fontSize: 12, background: "#6366f120", padding: "2px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>Marketing</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
              Why Every Independent Artist Needs a Link in Bio
            </h1>
            <p style={{ color: "#c7d2fe", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: 20 }}>
              Social media gives you exactly one clickable link in your bio. Here's why that single link needs to do the work of an entire website — and how to make that happen.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>June 2026</span>
              <span style={{ color: "#475569", fontSize: 13 }}>·</span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>6 min read</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", lineHeight: 1.8, color: "#374151", fontSize: "1.05rem" }}>

            <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: 500, marginBottom: "1.5rem" }}>
              You spend hours crafting the perfect Instagram post to promote your new single. You write the caption, pick the best frame, tag everyone involved. Then you post it — and realize your Spotify link is buried in a comment because Instagram won't let you put it in the caption.
            </p>

            <p>
              This is the reality for every independent artist and music producer working in 2025. You're spread across Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, TikTok, Instagram, and more — but every platform that matters only gives you <strong>one clickable bio link</strong>. A link in bio page solves this problem permanently.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What Is a Link in Bio Page?</h2>
            <p>
              A link in bio page is a single URL that lives in your social media bio and acts as a mini-website for everything you want fans to find. Instead of swapping your Spotify link for your merch store link every time you have something new to promote, your link in bio page shows them everything at once: streaming platforms, new releases, merchandise, newsletter signup, social media profiles, tour dates, and more.
            </p>
            <p>
              Think of it as the front door to your music career. When someone taps the link in your Instagram or TikTok bio, they land on a page that reflects who you are as an artist and gives them clear paths to everything they might want to do — stream your music, buy your merch, join your mailing list, or follow you on other platforms.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Why Independent Artists Can't Afford to Skip This</h2>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>You're Losing Fans at the Bio Every Day</h3>
            <p>
              Most fans who visit your social media profile and find a dead-end bio link will bounce immediately. They're not going to Google your name to find your Spotify. If your bio link leads to something outdated — last year's single, a broken merch store, or just your Spotify homepage — you've lost them. A clean, current link in bio page converts curious listeners into loyal followers.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Your Audience Is Everywhere, Not Just Spotify</h3>
            <p>
              As an independent artist, you can't assume your fans all use the same streaming platform. Some of your listeners are on Spotify. Others are Apple Music loyalists. Some prefer YouTube. A link in bio page lets you direct every fan to their preferred platform without ever having to pick one. That means more streams, more reach, and better numbers across the board.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Merch, Newsletter, and Monetization in One Place</h3>
            <p>
              The music business has changed. Streaming revenue alone isn't enough to sustain an independent music career — especially in the early stages. Your link in bio page is where merch sales, newsletter signups, and direct fan connections happen. Every time someone taps your bio link and sees your merch store or a newsletter signup form, that's a potential conversion that didn't exist before.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>It Makes You Look Professional</h3>
            <p>
              A well-designed link in bio page with your brand colors, logo, and all your official links signals that you take your music career seriously. Music blogs, playlist curators, and record label A&Rs look at your online presence before anything else. A polished link in bio page communicates that you're organized, intentional, and worth paying attention to.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What to Include on Your Music Link in Bio Page</h2>
            <p>Here's what every independent artist's link in bio page should have:</p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li><strong>Streaming links</strong> — Spotify, Apple Music, YouTube Music, Tidal, Amazon Music, SoundCloud</li>
              <li><strong>Your newest release</strong> — link directly to the song or album, not just your profile</li>
              <li><strong>Merch store</strong> — Printify, Shopify, or wherever fans can buy your gear</li>
              <li><strong>Newsletter signup</strong> — your email list is the one thing you own. Social platforms come and go.</li>
              <li><strong>Social media profiles</strong> — Instagram, TikTok, Twitter/X, Facebook</li>
              <li><strong>Brand logo</strong> — consistent visual identity builds recognition over time</li>
              <li><strong>Custom domain or branded URL</strong> — looks cleaner than a long redirect link</li>
            </ul>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Link in Bio vs. a Full Website</h2>
            <p>
              You might be thinking: don't I already have a website? Maybe — but most independent artists don't maintain their websites consistently. A link in bio page is low-maintenance, always current, and optimized for the way fans actually discover music: through social media on their phones.
            </p>
            <p>
              While a full website is worth having eventually, a link in bio page is faster to set up, easier to update, and specifically designed for the mobile-first experience that defines how people interact with music online in 2025.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>How to Use Your Link in Bio Strategically</h2>
            <p>
              Setting it up is only the first step. Here's how to get real results from your link in bio page:
            </p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li><strong>Mention it in every post</strong> — "link in bio" is still one of the highest-converting CTAs on Instagram</li>
              <li><strong>Update it when you release something new</strong> — pin your freshest release at the top</li>
              <li><strong>Use it in all your social profiles</strong> — same link on Instagram, TikTok, Twitter, YouTube channel description</li>
              <li><strong>Add it to your email signature</strong> — every email you send is a potential touchpoint</li>
              <li><strong>Share the URL directly in music submissions</strong> — curators and blogs appreciate having everything in one place</li>
            </ul>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>The Bottom Line for Independent Artists</h2>
            <p>
              In a world where attention spans are short and competition for listeners is fierce, you need every advantage you can get. A link in bio page is one of the lowest-effort, highest-impact tools available to independent artists and music producers — and it costs nothing to set up.
            </p>
            <p>
              Every day you're promoting your music without one is a day you're sending potential fans to a dead end.
            </p>

            {/* Image preview */}
            <div style={{ margin: "2.5rem 0 0", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <img src="/linkInBio_mockup.png" alt="Example of an Influanto Link in Bio page for an independent artist" style={{ width: "100%", display: "block" }} />
            </div>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, #eef2ff, #ede9fe)", borderRadius: 12, padding: "1.75rem", marginTop: "1.5rem", border: "1px solid #c7d2fe" }}>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#3730a3", marginBottom: 8 }}>Build your free music Link in Bio on Influanto</p>
              <p style={{ color: "#4338ca", fontSize: "0.95rem", marginBottom: 16 }}>
                Create a fully branded link in bio page with all your streaming links, merch store, newsletter signup, and custom colors — free, no credit card needed.
              </p>
              <Link
                href="/api/auth/signin?callbackUrl=/dashboard"
                style={{ display: "inline-block", background: "#4f46e5", color: "#fff", fontWeight: 700, padding: "0.75rem 1.75rem", borderRadius: 8, textDecoration: "none", fontSize: "1rem" }}
              >
                Create Your Link in Bio →
              </Link>
            </div>
          </div>

          {/* Related */}
          <div style={{ marginTop: "2.5rem" }}>
            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: 1 }}>Keep Reading</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <Link href="/blog/music-release-pages-indie-artists" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faMusic} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Indie Artists Should Use Release Pages</p>
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

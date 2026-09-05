/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEarListen, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { faSpotify, faApple, faAmazon, faDeezer } from "@fortawesome/free-brands-svg-icons";
import UrlAnatomy from "@/components/UrlAnatomy";

export const metadata: Metadata = {
  title: "How to Find Your Spotify Artist ID (and Apple, Tidal, Amazon, Pandora, Deezer, Qobuz) | Influanto",
  description: "Step-by-step instructions for finding your artist ID on Spotify, Apple Music, Tidal, Amazon Music, Pandora, Deezer, and Qobuz — with the exact URL to look at for each platform.",
  keywords: [
    "how to find spotify artist id",
    "spotify artist id",
    "apple music artist id",
    "tidal artist id",
    "amazon music artist id",
    "pandora artist id",
    "deezer artist id",
    "qobuz artist id",
    "find my artist id",
    "streaming platform artist id",
  ],
  openGraph: {
    title: "How to Find Your Spotify Artist ID (and Apple, Tidal, Amazon, Pandora, Deezer, Qobuz)",
    description: "Step-by-step instructions for finding your artist ID on every major streaming platform — with the exact URL to look at for each one.",
    type: "article",
    url: "https://www.influanto.com/blog/how-to-find-your-spotify-artist-id",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Find Your Spotify Artist ID (and Apple, Tidal, Amazon, Pandora, Deezer, Qobuz)",
    description: "Step-by-step instructions for finding your artist ID on every major streaming platform.",
  },
  alternates: { canonical: "https://www.influanto.com/blog/how-to-find-your-spotify-artist-id" },
};

const h2Style: CSSProperties = { color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" };
const h3Style: CSSProperties = { color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem", display: "flex", alignItems: "center", gap: 8 };
const captionStyle: CSSProperties = { fontSize: "0.85rem", color: "#9ca3af", marginTop: 6 };

export default function PostSpotifyArtistId() {
  return (
    <>
      <Suspense><Header /></Suspense>
      <main style={{ background: "#f9fafb", minHeight: "80vh" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)", padding: "3.5rem 1.5rem 3rem" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Link href="/blog" style={{ color: "#a7f3d0", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Blog</Link>
              <span style={{ color: "#6ee7b7", fontSize: 13 }}>/</span>
              <span style={{ color: "#d1fae5", fontSize: 12, background: "#05966920", padding: "2px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>Distribution</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
              How to Find Your Spotify Artist ID (Plus Apple, Tidal, Amazon, Pandora, Deezer &amp; Qobuz)
            </h1>
            <p style={{ color: "#d1fae5", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: 20 }}>
              Your artist ID is the unique code streaming platforms use to identify your profile — and it's what tools like Influanto need to link out to your music correctly. Here's exactly where to find it on every major platform.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#a7f3d0", fontSize: 13 }}>September 2026</span>
              <span style={{ color: "#6ee7b7", fontSize: 13 }}>·</span>
              <span style={{ color: "#a7f3d0", fontSize: 13 }}>7 min read</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", lineHeight: 1.8, color: "#374151", fontSize: "1.05rem" }}>

            <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: 500, marginBottom: "1.5rem" }}>
              Every streaming platform assigns your artist profile a unique ID — a string of characters buried inside your profile's URL. You don't need it for casual listening, but the moment you want to connect your profile to a distributor, a link-in-bio tool, or an analytics dashboard, you'll be asked for it. Here's exactly how to find it, platform by platform.
            </p>

            {/* Spotify */}
            <h2 style={h2Style}><FontAwesomeIcon icon={faSpotify} style={{ height: "1.2rem", color: "#1DB954" }} className="mr-2" />Spotify Artist ID</h2>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Open the Spotify app (desktop or mobile) or go to <strong>open.spotify.com</strong></li>
              <li>Search for your artist name and open your artist profile</li>
              <li>Click the <strong>••• (three dots)</strong> next to your name, choose <strong>Share</strong>, then <strong>Copy link to artist</strong></li>
              <li>Paste the link anywhere — the ID is the segment after <span style={{ fontFamily: "monospace" }}>/artist/</span> and before any <span style={{ fontFamily: "monospace" }}>?</span></li>
            </ol>
            <UrlAnatomy before="open.spotify.com/artist/" id="3TVXtAsR1Inumwj472S9r4" after="?si=..." />
            <p style={captionStyle}>Your Spotify Artist ID is always exactly 22 characters, made up of letters and numbers.</p>

            {/* Apple Music */}
            <h2 style={h2Style}><FontAwesomeIcon icon={faApple} style={{ height: "1.2rem" }} className="mr-2" />Apple Music Artist ID</h2>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Go to <strong>music.apple.com</strong> and search for your artist page</li>
              <li>Open your artist profile — on desktop, copy the URL straight from the address bar; on mobile, tap the <strong>••• (more)</strong> button and choose <strong>Share</strong></li>
              <li>The last set of numbers in the URL is your Apple Music Artist ID</li>
            </ol>
            <UrlAnatomy before="music.apple.com/us/artist/your-artist-name/" id="1440833725" />
            <p style={captionStyle}>Some tools ask for the whole path (locale, "artist", your name, and the number) — others just want the trailing number. Check what the field you're filling in expects.</p>

            {/* Tidal */}
            <h2 style={h2Style}>Tidal Artist ID</h2>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Open <strong>tidal.com</strong> and search for your artist page</li>
              <li>Click the <strong>••• (more)</strong> menu on your profile and choose <strong>Share</strong></li>
              <li>Copy the link — the number after <span style={{ fontFamily: "monospace" }}>/artist/</span> is your ID</li>
            </ol>
            <UrlAnatomy before="tidal.com/artist/" id="4099663" />

            {/* Amazon Music */}
            <h2 style={h2Style}><FontAwesomeIcon icon={faAmazon} style={{ height: "1.2rem" }} className="mr-2" />Amazon Music Artist ID</h2>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Go to <strong>music.amazon.com</strong> and search for your artist name</li>
              <li>Open your artist profile page</li>
              <li>Check the URL in your browser's address bar and copy the code that appears after <span style={{ fontFamily: "monospace" }}>/artists/</span></li>
            </ol>
            <UrlAnatomy before="music.amazon.com/artists/" id="B08XXXXXX1" after="/your-artist-name" />

            {/* Pandora */}
            <h2 style={h2Style}>Pandora Artist ID</h2>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Go to <strong>pandora.com</strong> and search for your artist page</li>
              <li>Open your artist profile</li>
              <li>Copy the URL — the code starting with <span style={{ fontFamily: "monospace" }}>AR</span> at the end is your artist ID</li>
            </ol>
            <UrlAnatomy before="pandora.com/artist/your-artist-name/" id="ARjKprgvntwZmbk" />

            {/* Deezer */}
            <h2 style={h2Style}><FontAwesomeIcon icon={faDeezer} style={{ height: "1.2rem" }} className="mr-2" />Deezer Artist ID</h2>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Go to <strong>deezer.com</strong> and search for your artist page</li>
              <li>Open your artist profile</li>
              <li>The number after <span style={{ fontFamily: "monospace" }}>/artist/</span> in the URL is your ID</li>
            </ol>
            <UrlAnatomy before="deezer.com/artist/" id="12241710" />

            {/* Qobuz */}
            <h2 style={h2Style}>Qobuz Artist ID</h2>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Go to <strong>qobuz.com</strong> and search for your artist page</li>
              <li>Open your artist profile</li>
              <li>The number at the very end of the URL, after your artist name, is your ID</li>
            </ol>
            <UrlAnatomy before="qobuz.com/us-en/interpreter/your-artist-name/" id="123456789" />

            <h2 style={h2Style}>What to Do With Your Artist IDs</h2>
            <p>
              Once you've got them, you can drop them straight into your Influanto profile's <strong>Listen</strong> section — that's what powers the streaming links on your Link in Bio and Release Pages, so fans land on your actual profile instead of a search results page.
            </p>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 12, padding: "1.75rem", marginTop: "1.5rem", border: "1px solid #6ee7b7" }}>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#065f46", marginBottom: 8 }}>Add Your Streaming Links on Influanto</p>
              <p style={{ color: "#047857", fontSize: "0.95rem", marginBottom: 16 }}>
                Paste your artist IDs into your Influanto profile once, and they'll show up correctly across your Link in Bio and Release Pages.
              </p>
              <Link
                href="/dashboard"
                style={{ display: "inline-block", background: "#059669", color: "#fff", fontWeight: 700, padding: "0.75rem 1.75rem", borderRadius: 8, textDecoration: "none", fontSize: "1rem" }}
              >
                Go to My Profile →
              </Link>
            </div>
          </div>

          {/* Related */}
          <div style={{ marginTop: "2.5rem" }}>
            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: 1 }}>Keep Reading</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <Link href="/blog/music-release-pages-indie-artists" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faFileLines} style={{ height: "1.4rem" }} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Indie Artists Should Use Release Pages</p>
                <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 600 }}>Read →</span>
              </Link>
              <Link href="/blog/ear-training-for-musicians" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faEarListen} style={{ height: "1.4rem" }} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Struggling to Write Melodies? You Might Need Ear Training</p>
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

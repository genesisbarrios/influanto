/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faMusic } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Guerrilla Marketing for Indie Artists: Using QR Codes to Market in the Real World | Influanto",
  description: "No street team, no budget, no problem. Here's how independent artists use QR codes and low-cost guerrilla marketing tactics to turn flyers, stickers, and street art into streams.",
  keywords: [
    "guerrilla marketing for musicians",
    "qr code music marketing",
    "indie artist marketing ideas",
    "street team marketing music",
    "qr code flyers for musicians",
    "low budget music marketing",
    "music marketing ideas 2026",
    "how to promote music locally",
  ],
  openGraph: {
    title: "Guerrilla Marketing for Indie Artists: Using QR Codes to Market in the Real World",
    description: "No street team, no budget, no problem. Here's how independent artists use QR codes and guerrilla marketing tactics to turn flyers and stickers into streams.",
    type: "article",
    url: "https://www.influanto.com/blog/guerrilla-marketing-qr-codes-indie-artists",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guerrilla Marketing for Indie Artists: Using QR Codes to Market in the Real World",
    description: "No street team, no budget, no problem. Here's how independent artists use QR codes and guerrilla marketing tactics to turn flyers and stickers into streams.",
  },
  alternates: { canonical: "https://www.influanto.com/blog/guerrilla-marketing-qr-codes-indie-artists" },
};

export default function PostGuerrillaMarketing() {
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
              <span style={{ color: "#a5b4fc", fontSize: 12, background: "#ec489920", padding: "2px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>Marketing</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
              Guerrilla Marketing for Indie Artists: Using QR Codes to Market in the Real World
            </h1>
            <p style={{ color: "#c7d2fe", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: 20 }}>
              You don't need a street team or a marketing budget to get people scanning into your music. You need a sticker, a wall, and a QR code that actually goes somewhere worth landing on.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>July 2026</span>
              <span style={{ color: "#475569", fontSize: 13 }}>·</span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>7 min read</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", lineHeight: 1.8, color: "#374151", fontSize: "1.05rem" }}>

            <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: 500, marginBottom: "1.5rem" }}>
              Guerrilla marketing has always been about doing more with less: cheap, unexpected, and placed exactly where your audience already walks past every day. For decades, that meant flyers, stickers, and chalk art with a URL nobody could actually remember to type in later. The QR code fixed the one thing that always made guerrilla marketing leaky — now the scan <em>is</em> the conversion.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What Guerrilla Marketing Actually Means for a Musician</h2>
            <p>
              Guerrilla marketing is any low-cost, high-creativity tactic that gets your name in front of people outside of paid ads or algorithm-dependent feeds — stickers on light poles, flyers on a coffee shop corkboard, a stencil on the sidewalk outside a venue, a card slipped into someone's hand at a show. It's called "guerrilla" because it relies on placement and surprise instead of a budget.
            </p>
            <p>
              For independent artists specifically, this matters more than it used to. Streaming platforms bury new artists behind algorithms you don't control, and social media reach keeps shrinking unless you pay to boost it. Guerrilla marketing is one of the few channels left where a single artist with zero dollars and a decent idea can genuinely compete.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Why QR Codes Are the Missing Piece</h2>
            <p>
              The old version of this — "check out [artist name] on Spotify" printed on a flyer — asked someone to remember a name, open an app, and search for it later. Almost nobody does that. A QR code collapses all three steps into one: point your phone's camera at it, and you're already on the page. That's the entire difference between a flyer that generates streams and a flyer that generates litter.
            </p>
            <p>
              The other advantage is that a QR code doesn't have to point at a generic profile. It can point at exactly the right thing for exactly where it's placed — the new single if it's on a flyer for a release, a merch table if it's on a table tent at a show, your full{" "}
              <Link href="/blog/link-in-bio-for-independent-artists" style={{ color: "#4f46e5", fontWeight: 600 }}>link in bio page</Link>{" "}
              if it's on a sticker meant to catch someone cold on the street.
            </p>

            <div style={{ margin: "2rem 0", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <img src="/5.qrcodes.gif" alt="Generating a trackable QR code in Influanto" style={{ width: "100%", display: "block" }} />
            </div>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Guerrilla Tactics That Actually Work, With a QR Code Attached</h2>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Stickers on the Way to and from Venues</h3>
            <p>
              Stickers are the cheapest guerrilla tool that exists — a sheet of a hundred costs less than a single paid ad click. Put them on lamp posts, mailboxes, and utility boxes on the walking route to and from venues where your target audience already goes: local music venues, record shops, college campuses. A QR code on the sticker pointing straight to your newest release turns foot traffic into streams without anyone having to search for you.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Flyers with One Job Each</h3>
            <p>
              Don't put five links on a flyer. Pick one goal per flyer — stream the single, RSVP to the show, join the newsletter — and make the QR code the only call to action. A flyer trying to do everything at once does nothing well; a flyer with one clear ask and a working scan converts.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Table Tents and Merch Tags at Shows</h3>
            <p>
              People at your merch table are already your most engaged fans in the room — don't let that moment end at a cash transaction. A small QR code on a table tent or stitched into a merch tag pointing to your newsletter signup turns a one-time buyer into someone on your email list permanently, which matters far more than a single sale.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Chalk Stencils and Sidewalk Art</h3>
            <p>
              A stencil and washable chalk spray outside a venue on show night is memorable, photographable, and — unlike a sticker — completely legal and temporary in most cities (always check local rules before spraying anything permanent). Add a QR code next to the art and you've turned a piece of street art into a direct link to your show page or ticket link.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Business Cards That Aren't Actually Business Cards</h3>
            <p>
              Instead of a card with your name and Instagram handle, print a card that looks like a mini record sleeve or ticket stub with nothing on it but your artist name, art, and a QR code. Novelty gets kept in wallets and passed around far longer than a generic business card does — and every scan lands exactly where you decided it should.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>The Part Everyone Skips: Where the Scan Actually Lands</h2>
            <p>
              A QR code is only as good as the page behind it. Pointing every code at your Spotify profile wastes the moment — Spotify doesn't tell you who scanned, doesn't let you collect an email, and buries your new release under your entire back catalog. A dedicated{" "}
              <Link href="/blog/music-release-pages-indie-artists" style={{ color: "#4f46e5", fontWeight: 600 }}>release page</Link>{" "}
              or link in bio page gives the scan a single, focused destination — and lets you actually see how many people scanned, and when.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Guerrilla Marketing Mistakes That Waste the Effort</h2>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li><strong>A QR code with no context.</strong> Always include a one-line reason to scan — "new single out now," not just a bare code.</li>
              <li><strong>Linking to a dead or generic page.</strong> Test every code before it goes up. A broken scan is worse than no code at all.</li>
              <li><strong>Wallpapering one area instead of spreading out.</strong> Ten stickers across five different neighborhoods reach more new people than fifty stickers on one block.</li>
              <li><strong>Ignoring local postering rules.</strong> Some cities and venues restrict flyering and stickering on public property — check first so your campaign doesn't turn into a fine.</li>
              <li><strong>Never checking the scan data.</strong> If you can see which codes get scanned and when, use that to double down on what's actually working instead of guessing.</li>
            </ul>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>The Bottom Line for Independent Artists</h2>
            <p>
              Guerrilla marketing has never been about spending more — it's about being where your audience already is with a clear, frictionless next step. QR codes remove the last bit of friction that used to make flyers and stickers a dead end. A sticker on a lamp post, a card left on a bar, or a stencil outside a venue can now do exactly what a paid ad does: get someone from noticing you to streaming you, in one scan.
            </p>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, #eef2ff, #ede9fe)", borderRadius: 12, padding: "1.75rem", marginTop: "1.5rem", border: "1px solid #c7d2fe" }}>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#3730a3", marginBottom: 8 }}>Generate a trackable QR code, free, on Influanto</p>
              <p style={{ color: "#4338ca", fontSize: "0.95rem", marginBottom: 16 }}>
                Point it at your release page, your link in bio, or your merch — and see exactly how many people scanned it, right from your dashboard.
              </p>
              <Link
                href="/api/auth/signin?callbackUrl=/dashboard"
                style={{ display: "inline-block", background: "#4f46e5", color: "#fff", fontWeight: 700, padding: "0.75rem 1.75rem", borderRadius: 8, textDecoration: "none", fontSize: "1rem" }}
              >
                Create Your QR Code →
              </Link>
            </div>
          </div>

          {/* Related */}
          <div style={{ marginTop: "2.5rem" }}>
            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: 1 }}>Keep Reading</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <Link href="/blog/link-in-bio-for-independent-artists" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faLink} style={{ height: "1.4rem" }} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Every Independent Artist Needs a Link in Bio</p>
                <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 600 }}>Read →</span>
              </Link>
              <Link href="/blog/music-release-pages-indie-artists" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faMusic} style={{ height: "1.4rem" }} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Indie Artists Should Use Release Pages</p>
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

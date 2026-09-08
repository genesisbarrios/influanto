/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faMusic } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Why Split Sheets Are Non-Negotiable for Indie Music Collaborations | Influanto",
  description: "A verbal agreement doesn't protect your royalties. Learn why every independent artist, producer, and songwriter needs a split sheet before releasing any collaborative music — and what to include.",
  keywords: [
    "split sheet music",
    "music split sheet",
    "music collaboration contract",
    "indie artist split sheet",
    "songwriter split sheet",
    "music producer split sheet",
    "music royalty split",
    "how to split music royalties",
    "music ownership agreement",
    "independent artist music business",
    "music publishing rights",
    "song ownership contract",
  ],
  openGraph: {
    title: "Why Split Sheets Are Non-Negotiable for Indie Music Collaborations",
    description: "A verbal agreement won't protect your royalties. Every independent artist and producer needs a split sheet before releasing collaborative music.",
    type: "article",
    url: "https://www.influanto.com/blog/split-sheets-indie-artists",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Split Sheets Are Non-Negotiable for Indie Music Collaborations",
    description: "A verbal agreement won't protect your royalties. Here's what every indie artist and producer needs to know about split sheets.",
  },
  alternates: { canonical: "https://www.influanto.com/blog/split-sheets-indie-artists" },
};

export default function PostSplitSheets() {
  return (
    <>
      <Suspense><Header /></Suspense>
      <main style={{ background: "#f9fafb", minHeight: "80vh" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #d97706 100%)", padding: "3.5rem 1.5rem 3rem" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Link href="/blog" style={{ color: "#fde68a", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Blog</Link>
              <span style={{ color: "#f59e0b", fontSize: 13 }}>/</span>
              <span style={{ color: "#fde68a", fontSize: 12, background: "#f59e0b20", padding: "2px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>Business</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
              Why Split Sheets Are Non-Negotiable for Indie Music Collaborations
            </h1>
            <p style={{ color: "#fde68a", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: 20 }}>
              You made a banger with your producer friend. Congrats. Now — do you have a signed split sheet? A verbal agreement won't hold up when the song gets licensed, hits a playlist, or your names need to be registered with a PRO.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#fcd34d", fontSize: 13 }}>June 2026</span>
              <span style={{ color: "#fbbf24", fontSize: 13 }}>·</span>
              <span style={{ color: "#fcd34d", fontSize: 13 }}>6 min read</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", lineHeight: 1.8, color: "#374151", fontSize: "1.05rem" }}>

            <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: 500, marginBottom: "1.5rem" }}>
              Here's a scenario that plays out in the independent music world every week: two artists collaborate on a track, release it, and the song unexpectedly blows up. A label reaches out about licensing. A sync supervisor wants it for a TV show. And suddenly, two people who shook hands and said "we'll split it 50/50" are in a dispute over who owns what, who gets paid, and whose name goes on the registration.
            </p>

            <p>
              A <strong>split sheet</strong> would have prevented all of it. This simple document — often one page — is the most important piece of paperwork in any music collaboration. And yet, most independent artists and music producers skip it entirely.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What Is a Split Sheet?</h2>
            <p>
              A split sheet is a written agreement between all contributors to a song that documents:
            </p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Who contributed to the song (writers, producers, featured artists)</li>
              <li>What percentage of ownership each person holds</li>
              <li>What role each person played (lyrics, melody, beat, arrangement)</li>
              <li>Legal name, contact information, and PRO affiliation for each contributor</li>
              <li>Agreement on how the song can be used (licensing, samples, sync)</li>
            </ul>
            <p>
              It's not a contract in the complex legal sense — it's a clear, signed record of an agreement that everyone makes before or immediately after creating the song. When signed by all parties, it's legally enforceable in disputes over royalties and ownership.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>Why Independent Artists Skip Split Sheets (and Why That's a Mistake)</h2>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>"We're friends, I trust them"</h3>
            <p>
              This is the most common reason independent artists avoid the conversation — and the most dangerous. Friendships in music survive a lot of things, but money disputes are not usually one of them. The split sheet conversation isn't about distrust. It's about clarity. When everyone agrees upfront on what they're owed, there's nothing to argue about later.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>"The song probably won't go anywhere"</h3>
            <p>
              You don't know that. Every independent artist who has ever had a surprise hit thought the same thing. The song you make in a quick session for fun is sometimes the one that gets placed in a commercial, picked up by a major playlist, or licensed for a film. By the time that opportunity arrives, it's often too late to establish clear ownership without a fight.
            </p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>"We'll figure it out later"</h3>
            <p>
              Later is the worst time to establish splits. Memories fade, contributions get reframed, and relationships can change. Doing a split sheet in the moment — while everyone is still in the room and the enthusiasm is fresh — is infinitely easier than trying to reconstruct an agreement months later.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What Happens When You Don't Have a Split Sheet?</h2>

            <p>Without a split sheet, you risk:</p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li><strong>Royalties going to the wrong person</strong> — if only one person registers the song with a PRO (ASCAP, BMI, SESAC), they may collect 100% of the performance royalties by default</li>
              <li><strong>Licensing deals falling apart</strong> — sync supervisors and publishers need documented ownership before licensing a track. No split sheet often means no deal.</li>
              <li><strong>Disputes blocking releases</strong> — if a collaborator claims a different split than you remember, the song can be taken down from platforms during the dispute</li>
              <li><strong>Legal costs</strong> — resolving ownership disputes without documentation almost always involves lawyers, even for independent artists</li>
              <li><strong>Damaged relationships</strong> — money disputes are one of the fastest ways to end creative partnerships and friendships</li>
            </ul>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>What Should Be in a Music Split Sheet?</h2>
            <p>A solid split sheet for an independent artist collaboration should include:</p>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Song Information</h3>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Song title</li>
              <li>Date of creation or recording</li>
              <li>ISRC code (if registered)</li>
              <li>Album or project it belongs to (if applicable)</li>
            </ul>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Contributor Information</h3>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Legal name and artist name for each contributor</li>
              <li>Role (songwriter, producer, lyricist, featured artist, arranger)</li>
              <li>Percentage of ownership</li>
              <li>PRO affiliation (ASCAP, BMI, SESAC, or unaffiliated)</li>
              <li>Publisher name (if applicable)</li>
              <li>Contact email and phone</li>
            </ul>

            <h3 style={{ color: "#374151", fontWeight: 700, fontSize: "1.1rem", margin: "1.5rem 0 0.75rem" }}>Signatures</h3>
            <p>
              Every contributor should sign and date the split sheet. Without signatures, it's just a note — not a legally recognized agreement. Digital signatures (DocuSign, Adobe Sign) are fully valid and often easier to collect when collaborators aren't in the same city.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>How to Divide Splits Fairly</h2>
            <p>
              There's no universal formula for split percentages, but here are common frameworks used in the independent music world:
            </p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li><strong>Equal split</strong> — if two people wrote a song together equally, 50/50 is clean and simple</li>
              <li><strong>Contribution-based</strong> — if one person wrote the lyrics and melody while another provided the beat, splits might be 60/40 or 70/30 depending on what was agreed</li>
              <li><strong>Publisher split</strong> — if one party has a publishing deal, they may control a portion of the "publisher's share" separately from the writer's share</li>
              <li><strong>Producer points</strong> — producers often receive a percentage of the master recording plus a portion of the composition</li>
            </ul>
            <p>
              The most important thing isn't the exact number — it's that everyone agrees before the song gets released.
            </p>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>When to Use a Split Sheet</h2>
            <p>The answer is simple: <strong>every time</strong>. Not just for the songs you think will blow up. Every collaboration, regardless of how casual the session was or how close you are to the other person.</p>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" }}>
              <li>Writing sessions with other artists or songwriters</li>
              <li>Producer beats used for your single or album</li>
              <li>Featured verses or hooks from guest artists</li>
              <li>Songs that sample another artist's work</li>
              <li>Songs co-written remotely (over email, voice note, or online DAW sessions)</li>
            </ul>

            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" }}>The Bottom Line for Independent Artists</h2>
            <p>
              Split sheets are not a sign of distrust — they're a sign of professionalism. The artists and producers who consistently use them protect their income, their relationships, and their ability to take advantage of opportunities when they arise.
            </p>
            <p>
              For an independent artist without a label or legal team handling these details, a split sheet is the single cheapest, easiest way to protect your work. It takes ten minutes to fill out. The disputes it prevents can take years and thousands of dollars to resolve.
            </p>
            <p>
              Do it every time, before the song is released. No exceptions.
            </p>

            {/* Image previews */}
            <div style={{ margin: "2.5rem 0 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <img src="/split%20sheet%20create.png" alt="Creating a split sheet on Influanto" style={{ width: "100%", display: "block" }} />
              </div>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <img src="/split%20sheet%20dashboard.png" alt="Split sheet dashboard on Influanto" style={{ width: "100%", display: "block" }} />
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", borderRadius: 12, padding: "1.75rem", marginTop: "1.5rem", border: "1px solid #fcd34d" }}>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#78350f", marginBottom: 8 }}>Generate a Free Split Sheet on Influanto</p>
              <p style={{ color: "#92400e", fontSize: "0.95rem", marginBottom: 16 }}>
                Create a professional split sheet for any collaboration in minutes. Add contributors, set ownership percentages, and export as a PDF — free, no account required.
              </p>
              <Link
                href="/Split-Sheet-Generator"
                style={{ display: "inline-block", background: "#d97706", color: "#fff", fontWeight: 700, padding: "0.75rem 1.75rem", borderRadius: 8, textDecoration: "none", fontSize: "1rem" }}
              >
                Generate Your Split Sheet →
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

/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faMusic } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "How to Set Up a Meta Pixel for Your Music (and Test It) | Influanto",
  description: "Step-by-step guide for independent artists: create a Meta (Facebook) Pixel for your website, connect it to your Influanto Link in Bio and Release Pages, and confirm it works with Test Events.",
  keywords: [
    "meta pixel for musicians",
    "facebook pixel for artists",
    "how to create a meta pixel",
    "meta pixel setup",
    "meta pixel id",
    "test meta pixel events",
    "meta events manager test events",
    "facebook pixel link in bio",
    "retarget music fans",
    "music marketing facebook ads",
  ],
  openGraph: {
    title: "How to Set Up a Meta Pixel for Your Music (and Test It)",
    description: "Create a Meta Pixel, connect it to your Influanto pages, and confirm it's working with Test Events — step by step.",
    type: "article",
    url: "https://www.influanto.com/blog/how-to-set-up-meta-pixel-for-musicians",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Set Up a Meta Pixel for Your Music (and Test It)",
    description: "Create a Meta Pixel, connect it to your Influanto pages, and confirm it's working with Test Events.",
  },
  alternates: { canonical: "https://www.influanto.com/blog/how-to-set-up-meta-pixel-for-musicians" },
};

const h2Style: CSSProperties = { color: "#111827", fontWeight: 800, fontSize: "1.4rem", margin: "2rem 0 1rem" };
const olStyle: CSSProperties = { paddingLeft: "1.5rem", lineHeight: 2.2, margin: "1rem 0" };
const captionStyle: CSSProperties = { fontSize: "0.85rem", color: "#9ca3af", marginTop: 6 };
const tipStyle: CSSProperties = { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "1rem 1.25rem", fontSize: "0.95rem", color: "#1e3a8a", margin: "1.25rem 0" };
const mono: CSSProperties = { fontFamily: "monospace", overflowWrap: "anywhere" };

const EVENTS: [string, string][] = [
  ["PageView", "Someone opens your Link in Bio or a Release Page"],
  ["ViewContent", "The same page view, tagged as link_in_bio or release_page"],
  ["LinkClick", "A fan clicks any link on your page"],
  ["StreamingClick + Lead", "A fan clicks through to Spotify, Apple Music, or another streaming platform"],
  ["MerchClick", "A fan clicks one of your merch items"],
];

export default function PostMetaPixel() {
  return (
    <>
      <Suspense><Header /></Suspense>
      <main style={{ background: "#f9fafb", minHeight: "80vh" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0b1f4d 0%, #1d4ed8 50%, #0866ff 100%)", padding: "3.5rem 1.5rem 3rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Link href="/blog" style={{ color: "#bfdbfe", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Blog</Link>
              <span style={{ color: "#93c5fd", fontSize: 13 }}>/</span>
              <span style={{ color: "#dbeafe", fontSize: 12, background: "#ffffff20", padding: "2px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>Marketing</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
              How to Set Up a Meta Pixel for Your Music (and Make Sure It Works)
            </h1>
            <p style={{ color: "#dbeafe", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: 20 }}>
              A Meta Pixel lets you see who visits your Link in Bio and Release Pages — and run Instagram and Facebook ads to the fans who already clicked through to stream. Here's how to create one, connect it to Influanto, and test it in about ten minutes.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#bfdbfe", fontSize: 13 }}>October 2026</span>
              <span style={{ color: "#93c5fd", fontSize: 13 }}>·</span>
              <span style={{ color: "#bfdbfe", fontSize: 13 }}>6 min read</span>
            </div>
          </div>
        </div>

        {/* Article */}
        <article data-reveal style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", lineHeight: 1.8, color: "#374151", fontSize: "1.05rem" }}>

            <p style={{ fontSize: "1.1rem", color: "#1f2937", fontWeight: 500, marginBottom: "1.5rem" }}>
              Boosting a post to "everyone who likes hip-hop" burns money. Running an ad to the 400 people who opened your release page last week and clicked through to Spotify doesn't. That second audience only exists if you have a Meta Pixel collecting it — so set one up before your next release, not after.
            </p>

            <h2 style={h2Style}>What You'll Need</h2>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2, margin: "1rem 0" }}>
              <li>A Facebook account with access to <strong>Meta Business Suite</strong> (a free business portfolio — Meta will walk you through creating one if you don't have it)</li>
              <li>An Influanto account with a username set, so your Link in Bio is live</li>
              <li>About ten minutes</li>
            </ul>

            {/* Step 1 */}
            <h2 style={h2Style}>Step 1: Create a Website Pixel in Events Manager</h2>
            <ol style={olStyle}>
              <li>Go to <strong>Meta Events Manager</strong> at <span style={mono}>business.facebook.com/events_manager</span></li>
              <li>Click <strong>Connect data</strong> (the green <strong>+</strong> button in the left sidebar)</li>
              <li>Choose <strong>Web</strong> as the data source and click <strong>Connect</strong></li>
              <li>Give the pixel a name — your artist name works — and click <strong>Create</strong></li>
              <li>If Meta asks for a website URL, enter <span style={mono}>influanto.com</span> (or your own site if you'll use the pixel there too)</li>
              <li>When it asks how you want to install the code, close the setup or choose to install it manually — <strong>you don't need to paste any code</strong>. Influanto installs the pixel for you.</li>
            </ol>
            <p style={captionStyle}>Meta sometimes calls a pixel a "dataset" — they're the same thing, and the dataset ID is your Pixel ID.</p>

            {/* Step 2 */}
            <h2 style={h2Style}>Step 2: Copy Your Pixel ID</h2>
            <ol style={olStyle}>
              <li>In Events Manager, select your new pixel under <strong>Data sources</strong></li>
              <li>The Pixel ID is the long number shown under the pixel's name (also under <strong>Settings</strong>)</li>
              <li>Copy it</li>
            </ol>
            <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 10, padding: "0.9rem 1.25rem", fontFamily: "monospace", fontSize: "1.05rem", color: "#111827" }}>
              Pixel ID: <strong style={{ color: "#1d4ed8" }}>1234567890123456</strong>
            </div>
            <p style={captionStyle}>Pixel IDs are a 15–16 digit number. If Meta only shows you the full code snippet, that's fine too — Influanto can pull the ID out of it.</p>

            {/* Step 3 */}
            <h2 style={h2Style}>Step 3: Add the Pixel to Your Influanto Profile</h2>
            <ol style={olStyle}>
              <li>Open your <Link href="/dashboard" style={{ color: "#1d4ed8", fontWeight: 600 }}>Influanto dashboard</Link> and go to <strong>Profile</strong></li>
              <li>Scroll to <strong>Integrations → Meta Pixel</strong> and click <strong>Connect Pixel</strong></li>
              <li>Paste your Pixel ID and click <strong>Save</strong></li>
            </ol>
            <p>
              You'll see <strong>Pixel Connected</strong> with your ID. From now on the pixel loads on your Link in Bio (<span style={mono}>influanto.com/yourname</span>) and on every one of your Release Pages — nothing else to install.
            </p>

            {/* Step 4 */}
            <h2 style={h2Style}>Step 4: Send a Test Event to Confirm It Works</h2>
            <p>Don't wait for ad results to find out the pixel was never firing. Test it right away:</p>
            <ol style={olStyle}>
              <li>In Events Manager, select your pixel and open the <strong>Test events</strong> tab</li>
              <li>Under <strong>Test browser events</strong>, enter your Link in Bio URL — for example <span style={mono}>https://www.influanto.com/yourname</span></li>
              <li>Click <strong>Open website</strong>. Meta opens your page in a new tab that's linked to this test session.</li>
              <li>In that tab, click a link or two — ideally one of your streaming links</li>
              <li>Switch back to Test events. Within about 30 seconds you should see <strong>PageView</strong>, <strong>ViewContent</strong>, and your click events appear</li>
            </ol>
            <div style={tipStyle}>
              <strong>Test events only shows the tab you opened with "Open website."</strong> Browsing your page normally in another tab still sends events to your pixel, but they won't appear in Test events — check the <strong>Overview</strong> tab for those instead (it can take 20 minutes or more to update).
            </div>
            <p>Want to test a Release Page too? Repeat the same steps with its URL, like <span style={mono}>https://www.influanto.com/release/your-song</span>.</p>

            {/* Events */}
            <h2 style={h2Style}>The Events Influanto Sends</h2>
            <p>Once connected, these show up in Events Manager automatically:</p>
            <div style={{ overflowX: "auto", margin: "1rem 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem 0.9rem" }}>Event</th>
                    <th style={{ padding: "0.6rem 0.9rem" }}>When it fires</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map(([name, when]) => (
                    <tr key={name} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "0.6rem 0.9rem", fontFamily: "monospace", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{name}</td>
                      <td style={{ padding: "0.6rem 0.9rem" }}>{when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Every event also includes <span style={mono}>page_name</span> and <span style={mono}>page_path</span>, so if you use the same pixel on your own website you can still tell which page a fan came from.
            </p>

            {/* Troubleshooting */}
            <h2 style={h2Style}>Not Seeing Events? Check These</h2>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: 2, margin: "1rem 0" }}>
              <li><strong>Ad blockers and privacy browsers.</strong> uBlock, Brave Shields, and similar tools block the pixel. Test in a normal Chrome window with extensions off, or on your phone.</li>
              <li><strong>Wrong pixel.</strong> Make sure the ID saved in Influanto matches the pixel you're looking at in Events Manager — easy to mix up if you have more than one.</li>
              <li><strong>Traffic permissions.</strong> If you've set an allow list under your pixel's <strong>Settings → Traffic permissions</strong>, add <span style={mono}>influanto.com</span> and <span style={mono}>www.influanto.com</span> or Meta will drop the events.</li>
              <li><strong>Looking in the wrong tab.</strong> Test events only shows the tab you opened from it; Overview shows everything but updates with a delay.</li>
              <li><strong>Meta Pixel Helper.</strong> Meta's free Chrome extension shows whether the pixel fired on a page and flags errors.</li>
            </ul>

            <h2 style={h2Style}>What to Do Once It's Working</h2>
            <p>
              Give it a week or two to collect data, then in Ads Manager create a <strong>Custom Audience</strong> from website visitors — for example, everyone who triggered <span style={mono}>StreamingClick</span> in the last 30 days. Run your next release's ads to that audience first, and build a <strong>Lookalike Audience</strong> from it to reach new listeners who behave like your existing fans.
            </p>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", borderRadius: 12, padding: "1.75rem", marginTop: "1.5rem", border: "1px solid #93c5fd" }}>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1e3a8a", marginBottom: 8 }}>Connect Your Pixel on Influanto</p>
              <p style={{ color: "#1d4ed8", fontSize: "0.95rem", marginBottom: 16 }}>
                Paste your Pixel ID once and it's live on your Link in Bio and every Release Page.
              </p>
              <Link
                href="/dashboard"
                style={{ display: "inline-block", background: "#1d4ed8", color: "#fff", fontWeight: 700, padding: "0.75rem 1.75rem", borderRadius: 8, textDecoration: "none", fontSize: "1rem" }}
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
                <FontAwesomeIcon icon={faMusic} style={{ height: "1.4rem" }} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Indie Artists Should Use Release Pages</p>
                <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 600 }}>Read →</span>
              </Link>
              <Link href="/blog/link-in-bio-for-independent-artists" style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textDecoration: "none", display: "block", border: "1px solid #f3f4f6" }}>
                <FontAwesomeIcon icon={faLink} style={{ height: "1.4rem" }} />
                <p style={{ color: "#111827", fontWeight: 700, marginTop: 8, fontSize: "0.95rem" }}>Why Every Independent Artist Needs a Link in Bio</p>
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

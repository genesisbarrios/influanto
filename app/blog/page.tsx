/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music Blog for Independent Artists & Producers | Influanto",
  description: "Tips, guides, and tools for independent musicians and music producers. Learn how to grow your music career, protect your royalties, and promote your releases online.",
  keywords: ["independent artist tips", "music producer guide", "indie musician blog", "music career advice", "release strategy", "music royalties", "link in bio music"],
  openGraph: {
    title: "Music Blog for Independent Artists & Producers | Influanto",
    description: "Tips, guides, and tools for independent musicians and music producers. Learn how to grow your music career, protect your royalties, and promote your releases online.",
    type: "website",
    url: "https://influanto.com/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Music Blog for Independent Artists & Producers | Influanto",
    description: "Tips, guides, and tools for independent musicians and music producers.",
  },
  alternates: { canonical: "https://influanto.com/blog" },
};

const posts = [
  {
    slug: "link-in-bio-for-independent-artists",
    title: "Why Every Independent Artist Needs a Link in Bio",
    excerpt: "Social media gives you one bio link. Here's how to make it do the work of a full website — and why it matters more than you think.",
    date: "June 2025",
    readTime: "6 min read",
    tag: "Marketing",
    tagColor: "#6366f1",
    emoji: "🔗",
  },
  {
    slug: "music-release-pages-indie-artists",
    title: "Why Indie Artists Should Use Release Pages Instead of Pasting Links",
    excerpt: "Dropping a new song? A single release page beats a Spotify link every time. Here's why smart links are the standard for independent artists in 2025.",
    date: "June 2025",
    readTime: "7 min read",
    tag: "Releases",
    tagColor: "#10b981",
    emoji: "🎵",
  },
  {
    slug: "split-sheets-indie-artists",
    title: "Why Split Sheets Are Non-Negotiable for Indie Music Collaborations",
    excerpt: "Made a beat with your producer friend? A verbal agreement won't protect you when the song gets licensed or hits a playlist. Here's what to do.",
    date: "June 2025",
    readTime: "6 min read",
    tag: "Business",
    tagColor: "#f59e0b",
    emoji: "📄",
  },
];

export default function BlogIndex() {
  return (
    <>
      <Suspense><Header /></Suspense>
      <main style={{ background: "#f9fafb", minHeight: "80vh" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
          <p style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Influanto Blog</p>
          <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
            Resources for Independent Artists<br />& Music Producers
          </h1>
          <p style={{ color: "#c7d2fe", fontSize: "1.1rem", maxWidth: 560, margin: "0 auto" }}>
            Actionable guides on marketing your music, protecting your rights, and building a sustainable independent music career.
          </p>
        </div>

        {/* Posts */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ display: "grid", gap: "2rem" }}>
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <article style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "2rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "flex-start",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  border: "1px solid #f3f4f6",
                }}
                  className="blog-card"
                >
                  <div style={{ fontSize: "2.5rem", lineHeight: 1, flexShrink: 0, width: 56, height: 56, background: "#f3f4f6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {post.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ background: post.tagColor + "18", color: post.tagColor, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, letterSpacing: 1, textTransform: "uppercase" }}>{post.tag}</span>
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>{post.date} · {post.readTime}</span>
                    </div>
                    <h2 style={{ color: "#111827", fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>{post.title}</h2>
                    <p style={{ color: "#6b7280", fontSize: "0.97rem", lineHeight: 1.6 }}>{post.excerpt}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, color: "#6366f1", fontWeight: 600, fontSize: 14 }}>
                      Read article →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <style>{`
        .blog-card:hover { box-shadow: 0 8px 32px rgba(99,102,241,0.13) !important; transform: translateY(-2px); }
      `}</style>
      <Footer />
    </>
  );
}

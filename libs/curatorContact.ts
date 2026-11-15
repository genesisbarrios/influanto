// Pull a curator's contact details out of a Spotify playlist description.
// Pure (no I/O), so it's easy to test and safe to import anywhere.

const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const IG_ON = /@([a-zA-Z0-9_.]+)\s+on\s+(?:instagram|ig|insta)\b/i;        // "@name on IG"
const IG_TAG = /\b(?:ig|instagram|insta)\s*[:@]?\s*@?([a-zA-Z0-9_.]{2,30})\b/i; // "ig: @name", "instagram name"
const TIKTOK = /\btiktok\s*[:@]?\s*@?([a-zA-Z0-9_.]{2,24})\b/i;              // "tiktok: @name"
const ANCHOR = /<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/;
// TikTok mentions that describe the music rather than a curator's account
const GENERIC_TIKTOK = ["tiktok songs", "tik tok songs", "tiktok music", "tik tok music", "viral hits", "tiktok viral",
  "tik tok trending", "trending", "top hits", "popular", "mix tiktok", "latino 2025 tik tok", "best viral hits from tiktok"];
// Words that follow "ig" / "tiktok" in descriptions but aren't handles
const NOT_HANDLES = new Set(["songs", "song", "music", "hits", "viral", "trending", "and", "or", "the", "for", "dm", "me", "us", "page"]);

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x2F;/g, "/").replace(/&quot;/g, '"');

export function parseContact(raw: string) {
  const description = decode(raw || "");
  const email = description.match(EMAIL)?.[0]?.toLowerCase() ?? null;

  let externalUrl: string | null = null;
  const ig = description.match(IG_ON)?.[1] ?? description.match(IG_TAG)?.[1];
  if (ig && !NOT_HANDLES.has(ig.toLowerCase())) externalUrl = `https://instagram.com/${ig}`;
  if (!externalUrl) {
    const tt = description.match(TIKTOK)?.[1];
    const generic = GENERIC_TIKTOK.some((p) => description.toLowerCase().includes(p));
    if (tt && !generic && !NOT_HANDLES.has(tt.toLowerCase())) externalUrl = `https://www.tiktok.com/@${tt}`;
  }
  if (!externalUrl) externalUrl = description.match(ANCHOR)?.[1] ?? null;

  const cleaned = description
    .replace(/<a[^>]*>[^<]*<\/a>/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { email, externalUrl, description: cleaned };
}

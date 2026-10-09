import { normalizeUrl } from "@/libs/urls";
import { isEmbeddableVideo } from "@/libs/videoEmbed";

// Electronic press kit content, stored on a release page (release_pages.epk)
// when its page_type is "epk". The page's own name/image/description/video/
// links are reused as the artist name, artist photo, tagline, featured video,
// and streaming links.

export interface EpkVenue { name: string; city: string; date: string }
export interface EpkQuote { quote: string; source: string; url: string }
// A release shown on the EPK: one of the artist's Influanto release pages
// (resolved to its current cover/title/link when the EPK loads), or a custom one
export type EpkRelease =
  | { kind: "page"; id: string }
  | { kind: "custom"; title: string; image: string; url: string };
// What the public EPK renders for each release
export interface EpkReleaseCard { title: string; image: string; url: string; internal: boolean }

export interface Epk {
  genre: string;
  location: string;
  bookingEmail: string;
  bio: string;
  highlights: string[];
  videos: string[];
  venues: EpkVenue[];
  gallery: string[];
  pressQuotes: EpkQuote[];
  releases: EpkRelease[];
  pressKitUrl: string;
}

export const EMPTY_EPK: Epk = {
  genre: "", location: "", bookingEmail: "", bio: "",
  highlights: [], videos: [], venues: [], gallery: [], pressQuotes: [], releases: [], pressKitUrl: "",
};

// How many EPK versions an account can have
export const EPK_PAGE_LIMITS = { free: 5, pro: 50 };

export const EPK_LIMITS = { bio: 5000, highlights: 12, videos: 8, venues: 60, gallery: 24, pressQuotes: 12, releases: 24 };

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
const url = (v: unknown) => { const s = str(v, 1000); return s ? normalizeUrl(s) : ""; };
const list = <T,>(v: unknown, max: number, map: (x: any) => T, keep: (x: T) => boolean) =>
  (Array.isArray(v) ? v : []).map(map).filter(keep).slice(0, max);

// Server-side cleanup of whatever the editor sends
export function sanitizeEpk(input: any): Epk {
  const e = input && typeof input === "object" ? input : {};
  const email = str(e.bookingEmail, 200);
  return {
    genre: str(e.genre, 100),
    location: str(e.location, 100),
    bookingEmail: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : "",
    bio: str(e.bio, EPK_LIMITS.bio),
    highlights: list(e.highlights, EPK_LIMITS.highlights, (h) => str(h, 200), (h) => !!h),
    videos: list(e.videos, EPK_LIMITS.videos, url, (v) => isEmbeddableVideo(v)), // YouTube/Vimeo videos + playlists
    venues: list(e.venues, EPK_LIMITS.venues, (v) => ({ name: str(v?.name, 120), city: str(v?.city, 100), date: str(v?.date, 40) }), (v) => !!v.name),
    gallery: list(e.gallery, EPK_LIMITS.gallery, url, (g) => /^https:\/\//.test(g)),
    pressQuotes: list(e.pressQuotes, EPK_LIMITS.pressQuotes, (q) => ({ quote: str(q?.quote, 600), source: str(q?.source, 120), url: url(q?.url) }), (q) => !!q.quote),
    releases: list(e.releases, EPK_LIMITS.releases, (r): EpkRelease | null => {
      if (r?.kind === "page" && /^[0-9a-f-]{36}$/i.test(String(r.id))) return { kind: "page", id: String(r.id) };
      if (r?.kind === "custom") return { kind: "custom", title: str(r.title, 120), image: url(r.image), url: url(r.url) };
      return null;
    }, (r) => !!r && (r.kind === "page" || (!!r.title && !!r.url))) as EpkRelease[],
    pressKitUrl: url(e.pressKitUrl),
  };
}

// Fill in any missing fields (older rows / partial data) for the editor and template
export function withEpkDefaults(e: any): Epk {
  return { ...EMPTY_EPK, ...(e && typeof e === "object" ? e : {}) };
}

export function getYouTubeId(link: string): string | null {
  const m = String(link || "").match(/(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

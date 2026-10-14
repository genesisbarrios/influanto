// Release page streaming-link auto-fill. Server only: import it from API routes
// (it calls third-party APIs and keeps an in-process rate-limit queue).
// 1. Search iTunes for artist + title (song for singles, album for albums/EPs)
// 2. Pick a confident match, or return candidates for the artist to choose from
// 3. Expand the Apple Music URL into every platform with Odesli (song.link)
// 4. Fill a missing Deezer link from the Deezer API when artist + title match

export type ReleaseType = "single" | "album";

export interface ItunesCandidate {
  id: number;
  title: string;
  artist: string;
  appleMusicUrl: string;
  artworkUrl: string;
  releaseDate: string | null;
  explicit: boolean;
  type: ReleaseType;
}

export interface FoundLink { name: string; url: string; source: "auto" }

export interface LinkLookup {
  links: FoundLink[];
  pageUrl: string | null; // song.link page
  missing: string[]; // platforms we couldn't find
  odesliFailed: boolean;
}

// Platforms we save, in display order. `name` matches the release page editor's link names.
const PLATFORMS: { key: string; name: string }[] = [
  { key: "spotify", name: "Spotify" },
  { key: "appleMusic", name: "Apple Music" },
  { key: "youtubeMusic", name: "YouTube Music" },
  { key: "youtube", name: "YouTube" },
  { key: "amazonMusic", name: "Amazon Music" },
  { key: "tidal", name: "Tidal" },
  { key: "deezer", name: "Deezer" },
  { key: "soundcloud", name: "SoundCloud" },
  { key: "pandora", name: "Pandora" },
];

// ── Matching ──────────────────────────────────────────────────────────────────

// For comparison only: lowercase, strip accents, " - Single"/" - EP",
// "(feat. ...)"/"[with ...]", punctuation, and extra spaces
export function normalize(s: string): string {
  return String(s || "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+-\s+(single|ep)\s*$/i, "")
    .replace(/[([](?:feat\.?|ft\.?|featuring|with)\b[^)\]]*[)\]]/gi, "")
    .replace(/\s(?:feat\.?|ft\.?|featuring)\s.*$/i, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Exact match after normalizing, or the artist is one of several credited artists
export function artistMatches(candidate: string, artist: string): boolean {
  const want = normalize(artist);
  if (!want) return false;
  if (normalize(candidate) === want) return true;
  const parts = String(candidate || "")
    .split(/\s*(?:,|&|\band\b|\bx\b|\bfeat\.?|\bft\.?|\bfeaturing\b|\bwith\b)\s*/i)
    .map(normalize)
    .filter(Boolean);
  return parts.includes(want);
}

export const titleMatches = (candidate: string, title: string) => !!normalize(title) && normalize(candidate) === normalize(title);

// ── iTunes ────────────────────────────────────────────────────────────────────

const bigArtwork = (url?: string) => (url ? url.replace(/\/\d+x\d+bb\./, "/600x600bb.") : "");

const toCandidates = (results: any[], type: ReleaseType): ItunesCandidate[] =>
  results.filter((r) => r.wrapperType === (type === "album" ? "collection" : "track")).map((r: any) => ({
    id: type === "album" ? r.collectionId : r.trackId,
    title: type === "album" ? r.collectionName : r.trackName,
    artist: r.artistName,
    appleMusicUrl: (type === "album" ? r.collectionViewUrl : r.trackViewUrl) || "",
    artworkUrl: bigArtwork(r.artworkUrl100),
    releaseDate: r.releaseDate || null,
    explicit: (type === "album" ? r.collectionExplicitness : r.trackExplicitness) === "explicit",
    type,
  })).filter((c: ItunesCandidate) => c.appleMusicUrl);

async function itunes(path: "search" | "lookup", params: Record<string, string>) {
  const res = await fetch(`https://itunes.apple.com/${path}?${new URLSearchParams({ country: "US", ...params })}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`iTunes ${path} failed (${res.status})`);
  return (await res.json()).results || [];
}

export async function searchItunes(artist: string, title: string, type: ReleaseType): Promise<ItunesCandidate[]> {
  return toCandidates(await itunes("search", { term: `${artist} ${title}`, entity: type === "album" ? "album" : "song", limit: "10" }), type);
}

// Small artists often don't surface in a keyword search (and names like
// "gen.wav" tokenize badly), so look the artist up and scan their catalog
export async function searchArtistCatalog(artist: string, type: ReleaseType): Promise<ItunesCandidate[]> {
  const artists = (await itunes("search", { term: artist, entity: "musicArtist", limit: "5" })).filter((a: any) => artistMatches(a.artistName, artist));
  const out: ItunesCandidate[] = [];
  for (const a of artists.slice(0, 2)) {
    out.push(...toCandidates(await itunes("lookup", { id: String(a.artistId), entity: type === "album" ? "album" : "song", limit: "200" }), type));
  }
  return out;
}

// Confident match = artist and title both match; newest release wins, then the
// explicit/clean version the artist prefers (if they told us)
export function pickMatch(results: ItunesCandidate[], artist: string, title: string, preferExplicit?: boolean) {
  const matches = results.filter((r) => artistMatches(r.artist, artist) && titleMatches(r.title, title));
  matches.sort((a, b) => {
    const byDate = (b.releaseDate || "").localeCompare(a.releaseDate || "");
    if (byDate !== 0) return byDate;
    if (preferExplicit === undefined) return 0;
    return Number(b.explicit === preferExplicit) - Number(a.explicit === preferExplicit);
  });
  if (matches.length) return { match: matches[0], candidates: [] as ItunesCandidate[] };
  // No confident match: offer the closest results, the artist's own releases first
  const ranked = [...results].sort((a, b) => Number(artistMatches(b.artist, artist)) - Number(artistMatches(a.artist, artist)));
  return { match: null, candidates: ranked.slice(0, 5) };
}

// ── Odesli (song.link) ────────────────────────────────────────────────────────

// Free tier is ~10 requests/minute. Space calls ~6.5s apart within this server
// instance, and back off + retry on 429s/errors (max 3 tries).
const ODESLI_SPACING_MS = 6500;
let odesliQueue: Promise<unknown> = Promise.resolve();
let lastOdesliCall = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function queued<T>(fn: () => Promise<T>): Promise<T> {
  const run = odesliQueue.then(async () => {
    const wait = lastOdesliCall + ODESLI_SPACING_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastOdesliCall = Date.now();
    return fn();
  });
  odesliQueue = run.catch(() => undefined);
  return run;
}

// Odesli's keyless public API was retired (401 PUBLIC_API_ACCESS_DEPRECATED);
// set ODESLI_API_KEY once song.link issues one.
export async function fetchOdesli(url: string): Promise<any | null> {
  // The keyless API always returns 401 now, so don't spend the queue time without a key
  if (!process.env.ODESLI_API_KEY) return null;
  const params = new URLSearchParams({ url, userCountry: "US" });
  if (process.env.ODESLI_API_KEY) params.set("key", process.env.ODESLI_API_KEY);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await queued(() => fetch(`https://api.song.link/v1-alpha.1/links?${params}`, { cache: "no-store" }));
      if (res.ok) return await res.json();
      if (res.status !== 429 && res.status < 500) return null; // e.g. 400/404: not something a retry fixes
    } catch {
      /* network error: retry */
    }
    if (attempt < 3) await sleep(2000 * 2 ** (attempt - 1)); // 2s, 4s
  }
  return null;
}

// ── Deezer fallback ───────────────────────────────────────────────────────────

export async function searchDeezer(artist: string, title: string, type: ReleaseType): Promise<string | null> {
  // Plain keyword search: Deezer's advanced artist:"" track:"" syntax currently
  // returns no results. Only exact artist + title matches are kept.
  try {
    const res = await fetch(`https://api.deezer.com/search${type === "album" ? "/album" : ""}?q=${encodeURIComponent(`${artist} ${title}`)}&limit=50`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const hit = (json.data || []).find((d: any) =>
      artistMatches(d.artist?.name || "", artist) && titleMatches(type === "album" ? d.title : d.title_short || d.title, title)
    );
    return hit?.link || null;
  } catch {
    return null;
  }
}

// ── Spotify fallback (same app credentials as the curator search) ─────────────

let spotifyToken: { value: string; expires: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  const id = process.env.identity, secret = process.env.spotify_secret;
  if (!id || !secret) return null;
  if (spotifyToken && spotifyToken.expires > Date.now() + 60_000) return spotifyToken.value;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  spotifyToken = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return spotifyToken.value;
}

export async function searchSpotify(artist: string, title: string, type: ReleaseType): Promise<string | null> {
  try {
    const token = await getSpotifyToken();
    if (!token) return null;
    const kind = type === "album" ? "album" : "track";
    const params = new URLSearchParams({ q: `${kind}:${title} artist:${artist}`, type: kind, limit: "20", market: "US" });
    const res = await fetch(`https://api.spotify.com/v1/search?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return null;
    const items = (await res.json())[`${kind}s`]?.items || [];
    const hit = items.find((it: any) => titleMatches(it.name, title) && (it.artists || []).some((a: any) => artistMatches(a.name, artist)));
    return hit?.external_urls?.spotify || null;
  } catch {
    return null;
  }
}

// ── Expand a chosen Apple Music URL into every platform ───────────────────────

export async function lookupLinks(candidate: Pick<ItunesCandidate, "appleMusicUrl">, artist: string, title: string, type: ReleaseType): Promise<LinkLookup> {
  const data = await fetchOdesli(candidate.appleMusicUrl);
  const byPlatform = data?.linksByPlatform || {};
  const links: FoundLink[] = [];
  for (const p of PLATFORMS) {
    const url = byPlatform[p.key]?.url;
    if (url) links.push({ name: p.name, url, source: "auto" });
  }
  // Odesli down or missing Apple Music: still keep the iTunes link
  if (!links.some((l) => l.name === "Apple Music")) links.splice(1, 0, { name: "Apple Music", url: candidate.appleMusicUrl, source: "auto" });
  if (!links.some((l) => l.name === "Spotify")) {
    const spotify = await searchSpotify(artist, title, type);
    if (spotify) links.unshift({ name: "Spotify", url: spotify, source: "auto" });
  }
  if (!links.some((l) => l.name === "Deezer")) {
    const deezer = await searchDeezer(artist, title, type);
    if (deezer) links.push({ name: "Deezer", url: deezer, source: "auto" });
  }
  const found = new Set(links.map((l) => l.name));
  return {
    links: PLATFORMS.map((p) => links.find((l) => l.name === p.name)).filter(Boolean) as FoundLink[],
    pageUrl: data?.pageUrl || null,
    missing: PLATFORMS.filter((p) => !found.has(p.name)).map((p) => p.name),
    odesliFailed: !data,
  };
}

// Full flow: search → confident match → links; or candidates when unsure
export async function findReleaseLinks(opts: { artist: string; title: string; type: ReleaseType; preferExplicit?: boolean }) {
  const results = await searchItunes(opts.artist, opts.title, opts.type);
  let { match, candidates } = pickMatch(results, opts.artist, opts.title, opts.preferExplicit);
  if (!match) {
    const catalog = await searchArtistCatalog(opts.artist, opts.type);
    const fromCatalog = pickMatch(catalog, opts.artist, opts.title, opts.preferExplicit);
    if (fromCatalog.match) match = fromCatalog.match;
    else if (!candidates.length) candidates = fromCatalog.candidates;
  }
  if (!match) return { status: candidates.length ? ("candidates" as const) : ("none" as const), candidates };
  const lookup = await lookupLinks(match, opts.artist, opts.title, opts.type);
  return { status: "matched" as const, match, ...lookup };
}

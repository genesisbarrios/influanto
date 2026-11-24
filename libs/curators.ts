// Playlist curators: find Spotify playlists whose descriptions carry a way to
// reach the curator (an email, or an Instagram / TikTok handle or link), and
// cache them in Supabase so searches are instant after the first one.
//
// Tables (scripts/supabase-schema.sql):
//   curator_playlists  one row per playlist with contact info, tagged with every
//                      genre search it turned up in
//   curator_searches   when each genre was last fetched from Spotify
import supabase from "@/libs/supabase";
import { parseContact } from "@/libs/curatorContact";

export interface Curator {
  name: string;
  id: string;
  description: string;
  url: string;
  externalUrl: string | null; // Instagram / TikTok / other link to reach them
  owner: string;
  ownerProfileUrl: string;
  playlistCoverImage: string | null;
  email: string | null;
}

const REFRESH_DAYS = 7;          // re-query Spotify for a genre at most once a week
const MAX_PAGES = 6;             // 6 x 50 playlists per fetch
const TARGET = 60;               // stop paging once this many curators with contact info are found

// Email first (the most useful way to pitch), then the rest
const byEmailFirst = (a: Curator, b: Curator) => Number(!!b.email) - Number(!!a.email);

// ── Spotify ───────────────────────────────────────────────────────────────────

async function spotifyToken(): Promise<string> {
  const id = process.env.identity, secret = process.env.spotify_secret;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(data.error_description || "Spotify token request failed");
  return data.access_token;
}

const MIGHT_HAVE_CONTACT = /\b(ig|insta|instagram|tiktok|contact|e-?mail|submit|submissions?)\b|@/i;

// Spotify search allows offset + limit up to 1000, i.e. pages 0–19 of 50
const LAST_PAGE = 19;

export async function fetchFromSpotify(genre: string, startPage = 0): Promise<Curator[]> {
  const token = await spotifyToken();
  const found = new Map<string, Curator>();
  const end = Math.min(LAST_PAGE + 1, startPage + MAX_PAGES);
  for (let page = startPage; page < end && found.size < TARGET; page++) {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(genre)}&type=playlist&limit=50&offset=${page * 50}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) break;
    const items: any[] = (await res.json()).playlists?.items ?? [];
    if (!items.length) break;
    for (const p of items) {
      if (!p?.id || !p.description || !p.owner?.external_urls?.spotify || !MIGHT_HAVE_CONTACT.test(p.description)) continue;
      const c = parseContact(p.description);
      if (!c.email && !c.externalUrl) continue; // only curators we can actually reach
      found.set(p.id, {
        id: p.id,
        name: p.name || "Unknown Playlist",
        description: c.description || "No description available",
        url: p.external_urls?.spotify || "#",
        externalUrl: c.externalUrl,
        owner: p.owner?.display_name || "Unknown Owner",
        ownerProfileUrl: p.owner.external_urls.spotify,
        playlistCoverImage: p.images?.[0]?.url ?? null,
        email: c.email,
      });
    }
  }
  return Array.from(found.values());
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const normGenre = (g: string) => g.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);

const fromRow = (r: any): Curator => ({
  id: r.id, name: r.name, description: r.description, url: r.url, externalUrl: r.external_url,
  owner: r.owner, ownerProfileUrl: r.owner_profile_url, playlistCoverImage: r.cover_image, email: r.email,
});

async function readCache(genre: string): Promise<{ curators: Curator[]; fresh: boolean } | null> {
  const [{ data: search, error: e1 }, { data: rows, error: e2 }] = await Promise.all([
    supabase.from("curator_searches").select("fetched_at").eq("genre", genre).maybeSingle(),
    supabase.from("curator_playlists").select("*").contains("genres", [genre]).order("has_email", { ascending: false }).limit(200),
  ]);
  if (e1 || e2) return null; // tables missing or unreachable: behave as uncached
  if (!search) return { curators: [], fresh: false };
  const age = Date.now() - new Date(search.fetched_at).getTime();
  return { curators: (rows ?? []).map(fromRow), fresh: age < REFRESH_DAYS * 86400e3 };
}

async function writeCache(genre: string, curators: Curator[]) {
  await savePlaylists(genre, curators);
  await supabase.from("curator_searches").upsert({ genre, fetched_at: new Date().toISOString(), result_count: curators.length });
}

/** Add playlists to the cache, tagged with `genre` (keeps the genres they already had). */
async function savePlaylists(genre: string, curators: Curator[]) {
  if (curators.length) {
    // Keep the genres a playlist was already tagged with
    const { data: existing } = await supabase.from("curator_playlists").select("id, genres").in("id", curators.map((c) => c.id));
    const prior = new Map((existing ?? []).map((r: any) => [r.id, r.genres as string[]]));
    const now = new Date().toISOString();
    await supabase.from("curator_playlists").upsert(curators.map((c) => ({
      id: c.id, name: c.name, description: c.description, url: c.url, external_url: c.externalUrl,
      owner: c.owner, owner_profile_url: c.ownerProfileUrl, cover_image: c.playlistCoverImage,
      email: c.email, has_email: !!c.email,
      genres: Array.from(new Set([...(prior.get(c.id) ?? []), genre])),
      fetched_at: now,
    })));
  }
}

/** Cached curators for a genre (email first), fetching from Spotify when the cache is empty or a week old. */
export async function curatorsFor(rawGenre: string): Promise<{ curators: Curator[]; source: "cache" | "spotify" | "stale-cache" }> {
  const genre = normGenre(rawGenre) || "reggaeton";
  const cached = await readCache(genre).catch(() => null);
  if (cached?.fresh) return { curators: cached.curators.sort(byEmailFirst), source: "cache" };

  try {
    const live = await fetchFromSpotify(genre);
    if (cached) await writeCache(genre, live).catch((e) => console.error("curator cache write failed:", e?.message));
    // Merge with anything cached earlier that this fetch didn't return
    const merged = new Map((cached?.curators ?? []).map((c) => [c.id, c]));
    live.forEach((c) => merged.set(c.id, c));
    return { curators: Array.from(merged.values()).sort(byEmailFirst), source: "spotify" };
  } catch (e: any) {
    if (cached?.curators.length) return { curators: cached.curators.sort(byEmailFirst), source: "stale-cache" };
    throw e;
  }
}

// ── More curators (the refresh button) ─────────────────────────────────────────

// Genres that are close enough that their curators would take the same songs.
// When a genre runs out, "more" moves on to the others in its group, in order.
export const ADJACENT_GENRES: string[][] = [
  ["indie pop", "indie", "alternative", "synth pop", "dance pop", "dance"],
  ["latin", "reggaeton", "latin pop"],
  ["hip hop", "trap", "detroit rap", "drill"],
  ["house", "melodic house", "tech house", "techno"],
];

export function adjacentGenres(rawGenre: string): string[] {
  const g = normGenre(rawGenre);
  const alias = g === "detroit" ? "detroit rap" : g;
  const group = ADJACENT_GENRES.find((gr) => gr.includes(alias));
  return group ? group.filter((x) => x !== alias) : [];
}

type Step = { genre: string; page: number }; // page -1: the genre's normal (cached) results

function stepsFor(rawGenre: string): Step[] {
  const genre = normGenre(rawGenre) || "reggaeton";
  // deeper into Spotify's results for this genre, then the adjacent genres
  const deeper: Step[] = [];
  for (let page = MAX_PAGES; page <= LAST_PAGE; page += MAX_PAGES) deeper.push({ genre, page });
  return [...deeper, ...adjacentGenres(genre).map((g) => ({ genre: g, page: -1 }))];
}

/**
 * Curators not in `exclude`, found by searching deeper for the genre and then
 * its adjacent genres. `cursor` is where the last call stopped; pass back the
 * returned one to keep going. `done` means there's nowhere left to look.
 */
export async function moreCurators(rawGenre: string, exclude: Set<string>, cursor = 0) {
  const steps = stepsFor(rawGenre);
  const searched: string[] = [];
  const found = new Map<string, Curator>();
  let i = Math.max(0, cursor);
  // a few steps per request at most, so it answers quickly; stop once something new turns up
  for (let tries = 0; i < steps.length && tries < 3 && !found.size; i++, tries++) {
    const { genre, page } = steps[i];
    let list: Curator[] = [];
    try {
      if (page < 0) list = (await curatorsFor(genre)).curators;
      else {
        list = await fetchFromSpotify(genre, page);
        await savePlaylists(genre, list).catch((e) => console.error("curator cache write failed:", e?.message));
      }
    } catch (e: any) {
      console.error("more curators step failed:", genre, page, e?.message);
    }
    if (!searched.includes(genre)) searched.push(genre);
    for (const c of list) if (!exclude.has(c.id)) found.set(c.id, c);
  }
  return {
    curators: Array.from(found.values()).sort(byEmailFirst),
    cursor: i,
    done: i >= steps.length,
    searched,
    next: steps[i]?.genre ?? null,
  };
}

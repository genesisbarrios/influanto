import { NextRequest, NextResponse } from "next/server";
import { curatorsFor, moreCurators } from "@/libs/curators";

// GET /api/fetch-curators?genre=reggaeton
// Playlist curators you can reach (email first), from the Supabase cache when a
// genre was searched in the last week, otherwise fresh from Spotify (and cached).
export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre") || "reggaeton";
  try {
    const { curators, source } = await curatorsFor(genre);
    return NextResponse.json({ playlists: curators, source }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching curators:", error?.message);
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}

// POST /api/fetch-curators { genre, exclude: string[], cursor }
// More curators for the refresh button: deeper results for the genre, then
// adjacent genres, skipping the playlists already on screen.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const genre = String(body.genre || "").trim();
  if (!genre) return NextResponse.json({ error: "Search for a genre first" }, { status: 400 });
  const exclude = new Set<string>((Array.isArray(body.exclude) ? body.exclude : []).slice(0, 2000).map(String));
  try {
    const more = await moreCurators(genre, exclude, Number(body.cursor) || 0);
    return NextResponse.json({ ...more, playlists: more.curators, curators: undefined });
  } catch (error: any) {
    console.error("Error fetching more curators:", error?.message);
    return NextResponse.json({ error: "Failed to fetch more playlists" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { curatorsFor } from "@/libs/curators";

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

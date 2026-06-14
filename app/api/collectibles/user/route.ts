import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids"); // comma-separated Supabase UUIDs for slug views

  // Slug view: fetch specific collectibles by their Supabase IDs (public, no auth needed)
  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ collectibles: [] });

    const { data: rows, error } = await supabase
      .from("collectibles")
      .select("id, title, image_url, audio_url, artist, price_usd, edition_size, token_id, status, user_id")
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      collectibles: (rows ?? []).map((r: any) => ({
        id:          r.id,
        title:       r.title ?? "",
        imageUrl:    r.image_url ?? "",
        audioUrl:    r.audio_url ?? "",
        artist:      r.artist ?? "",
        priceUsd:    r.price_usd ?? 0,
        editionSize: r.edition_size ?? 1,
        tokenId:     r.token_id ? Number(r.token_id) : null,
        status:      r.status ?? "uploaded",
        userId:      r.user_id ?? "",
      })),
    });
  }

  // Editor: fetch current user's own collectibles (requires auth)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("collectibles")
    .select("id, title, image_url, audio_url, artist, genres, price_usd, edition_size, token_id, status, network")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("collectibles/user error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    collectibles: (rows ?? []).map((r: any) => ({
      id:          r.id,
      title:       r.title ?? "",
      imageUrl:    r.image_url ?? "",
      audioUrl:    r.audio_url ?? "",
      artist:      r.artist ?? "",
      genres:      r.genres ?? [],
      priceUsd:    r.price_usd ?? 0,
      editionSize: r.edition_size ?? 1,
      tokenId:     r.token_id ? Number(r.token_id) : null,
      status:      r.status ?? "uploaded",
      network:     r.network ?? "",
    })),
  });
}

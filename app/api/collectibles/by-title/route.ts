import { NextRequest, NextResponse } from "next/server";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const title  = searchParams.get("title");

  if (!userId || !title) {
    return NextResponse.json({ error: "userId and title are required" }, { status: 400 });
  }

  const { data: rows, error } = await supabase
    .from("collectibles")
    .select("id, title, description, image_url, audio_url, artist, genres, price_usd, edition_size, token_id, status")
    .eq("user_id", userId)
    .ilike("title", title)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = rows?.[0];
  if (!row) {
    return NextResponse.json({ collectible: null });
  }

  return NextResponse.json({
    collectible: {
      id:          row.id,
      title:       row.title ?? "",
      description: row.description ?? "",
      imageUrl:    row.image_url ?? "",
      audioUrl:    row.audio_url ?? "",
      artist:      row.artist ?? "",
      genres:      row.genres ?? [],
      priceUsd:    row.price_usd ?? 0,
      editionSize: row.edition_size ?? 1,
      tokenId:     row.token_id ? Number(row.token_id) : null,
      status:      row.status ?? "uploaded",
    },
  });
}

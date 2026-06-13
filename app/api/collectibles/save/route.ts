import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, description, artist, genres, bpm, lyrics, releaseDate,
      priceUsd, editionSize,
      audioUrl, audioBlobId, imageUrl, imageBlobId,
      metadataUri, metadataHash,
      tokenId, txHash, blockNumber, contractAddress,
    } = body;

    if (!title || !audioUrl || !metadataUri || !tokenId) {
      return NextResponse.json(
        { error: "title, audioUrl, metadataUri and tokenId are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("collectibles").upsert(
      {
        user_id:          session.user.id,
        title,
        description:      description ?? "",
        artist:           artist ?? "",
        type:             "single",
        storage_provider: "walrus",
        metadata_uri:     metadataUri,
        metadata_hash:    metadataHash,
        audio_url:        audioUrl,
        audio_blob_id:    audioBlobId ?? null,
        image_url:        imageUrl ?? null,
        image_blob_id:    imageBlobId ?? null,
        genres:           Array.isArray(genres) ? genres : [],
        bpm:              bpm ?? null,
        lyrics:           lyrics ?? null,
        release_date:     releaseDate ?? null,
        price_usd:        priceUsd ?? 0,
        edition_size:     editionSize ?? 1,
        token_id:         String(tokenId),
        tx_hash:          txHash ?? null,
        block_number:     blockNumber ?? null,
        contract_address: contractAddress ?? null,
        status:           "minted",
        network:          "polygon",
      },
      { onConflict: "token_id,network" }
    );

    if (error) {
      console.error("Supabase save error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("collectibles/save error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to save" }, { status: 500 });
  }
}

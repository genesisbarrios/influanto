import { NextRequest, NextResponse } from "next/server";
import { uploadToWalrus, uploadJsonToWalrus, walrusUrl } from "@/libs/walrus";
import connectMongo from "@/libs/mongoose";
import { Collectible } from "@/models/Collectible";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const audioFile = formData.get("audioFile") as File | null;
    const imageFile = formData.get("imageFile") as File | null;
    const metadataString = formData.get("metadata") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }
    if (!metadataString) {
      return NextResponse.json({ error: "Metadata is required" }, { status: 400 });
    }

    let metadata: Record<string, any>;
    try {
      metadata = JSON.parse(metadataString);
    } catch {
      return NextResponse.json({ error: "Invalid metadata JSON" }, { status: 400 });
    }

    if (!metadata.title || !metadata.userId) {
      return NextResponse.json({ error: "title and userId are required" }, { status: 400 });
    }

    // ── 1. Upload audio ───────────────────────────────────────────────
    console.log("Uploading audio to Walrus…");
    const audioBytes = await audioFile.arrayBuffer();
    const audioBlobId = await uploadToWalrus(audioBytes);
    const audioUrl = walrusUrl(audioBlobId);
    console.log("Audio blob ID:", audioBlobId);

    // ── 2. Upload image (optional) ────────────────────────────────────
    let imageUrl = "";
    let imageBlobId = "";
    if (imageFile) {
      console.log("Uploading image to Walrus…");
      const imageBytes = await imageFile.arrayBuffer();
      imageBlobId = await uploadToWalrus(imageBytes);
      imageUrl = walrusUrl(imageBlobId);
      console.log("Image blob ID:", imageBlobId);
    }

    // ── 3. Build & upload metadata JSON ──────────────────────────────
    const attributes = [
      { trait_type: "Type",         value: "Single" },
      { trait_type: "Artist",       value: metadata.artist   ?? "Unknown" },
      { trait_type: "Genre",        value: metadata.genres?.join(", ") ?? "Uncategorized" },
      { trait_type: "Edition Size", value: metadata.editionSize ?? 1 },
      { trait_type: "Price (USD)",  value: metadata.priceUsd ?? 0 },
    ];
    if (metadata.bpm)         attributes.push({ trait_type: "BPM",          value: metadata.bpm });
    if (metadata.releaseDate) attributes.push({ trait_type: "Release Date", value: metadata.releaseDate });

    const collectibleMetadata = {
      name:          metadata.title,
      description:   metadata.description ?? "",
      image:         imageUrl,
      animation_url: audioUrl,
      attributes,
      lyrics:        metadata.lyrics ?? "",
      artist:        metadata.artist ?? "",
      genres:        metadata.genres?.join(", ") ?? "",
      bpm:           metadata.bpm,
      edition_size:  metadata.editionSize ?? 1,
      price_usd:     metadata.priceUsd ?? 0,
      release_date:  metadata.releaseDate ?? new Date().toISOString().split("T")[0],
      content_type:  "single",
      created_at:    new Date().toISOString(),
      creator_id:    metadata.userId,
      // Storage references
      storage:       "walrus",
      audio_blob_id: audioBlobId,
      ...(imageBlobId && { image_blob_id: imageBlobId }),
    };

    console.log("Uploading metadata JSON to Walrus…");
    const metadataBlobId = await uploadJsonToWalrus(collectibleMetadata);
    const metadataUrl = walrusUrl(metadataBlobId);
    console.log("Metadata blob ID:", metadataBlobId);

    // ── 4. Save to database ───────────────────────────────────────────
    try {
      await connectMongo();
      const collectible = new Collectible({
        userId:      metadata.userId,
        title:       metadata.title,
        description: metadata.description,
        artist:      metadata.artist,
        type:        "single",

        // Storage
        storageProvider: "walrus",
        metadataUri:  metadataUrl,
        metadataHash: metadataBlobId,
        audioBlobId,
        audioUrl,
        ...(imageBlobId && { imageBlobId, imageUrl }),

        // Metadata
        genres:      metadata.genres ?? [],
        bpm:         metadata.bpm,
        lyrics:      metadata.lyrics,
        releaseDate: metadata.releaseDate ? new Date(metadata.releaseDate) : null,

        // Commercial
        priceUsd:    metadata.priceUsd ?? 0,
        editionSize: metadata.editionSize ?? 1,

        // Status
        status:  "uploaded",
        network: "polygon",
      });
      await collectible.save();
      console.log("Collectible saved:", collectible._id);
    } catch (dbErr) {
      console.error("DB save failed (non-fatal):", dbErr);
    }

    // ── 5. Return result ──────────────────────────────────────────────
    return NextResponse.json({
      title:       metadata.title,
      description: metadata.description,
      artist:      metadata.artist,
      genre:       metadata.genres?.join(", ") ?? "",
      bpm:         metadata.bpm,
      lyrics:      metadata.lyrics,
      editionSize: metadata.editionSize ?? 1,
      price:       metadata.priceUsd ?? 0,
      audio:       audioUrl,
      image:       imageUrl,
      releaseDate: metadata.releaseDate,
      // metadataCID is what NFTCreationModal passes to mintTrack on-chain
      metadataCID: metadataUrl,
      metadataHash: metadataBlobId,
      audioBlobId,
      ...(imageBlobId && { imageBlobId }),
    });
  } catch (err: any) {
    console.error("Walrus upload-single error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

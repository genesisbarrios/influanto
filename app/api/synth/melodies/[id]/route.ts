import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: "duwwnsyur",
  api_key: "929533944976281",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("synth_melodies")
      .update({ name })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  // Fetch the row to get the audio_url for Cloudinary deletion
  const { data: row, error: fetchError } = await supabase
    .from("synth_melodies")
    .select("audio_url")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Melody not found" }, { status: 404 });
  }

  // Extract public_id from audio_url
  const audioUrl: string = row.audio_url;
  const match = audioUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  if (match && match[1]) {
    const publicId = match[1];
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    } catch (err) {
      // Log but don't block DB deletion if Cloudinary delete fails
      console.error("Cloudinary delete error:", err);
    }
  }

  const { error: deleteError } = await supabase
    .from("synth_melodies")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

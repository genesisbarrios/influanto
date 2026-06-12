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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;

  const { data, error } = await supabase
    .from("synth_melodies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { name, audio, mimeType } = body;

    if (!name || !audio) {
      return NextResponse.json({ error: "name and audio are required" }, { status: 400 });
    }

    const publicId = `user_${userId}_${Date.now()}`;
    const dataUri = `data:${mimeType || "audio/webm"};base64,${audio}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataUri,
        {
          resource_type: "video",
          folder: "synth_melodies",
          public_id: publicId,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    const audioUrl = uploadResult.secure_url;

    const { data, error } = await supabase
      .from("synth_melodies")
      .insert({ user_id: userId, name, audio_url: audioUrl })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}

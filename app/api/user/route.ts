import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapUser } from "@/libs/supabase";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: "duwwnsyur",
  api_key: "929533944976281",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImageToCloudinary(imageBuffer: Buffer, userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: `user-${userId}-profile`, resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      )
      .end(imageBuffer);
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const id = session.user.id;

  try {
    const formData = await req.formData();

    const { data: existing } = await supabase.from("users").select("id").eq("id", id).single();
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      updates.image = await uploadImageToCloudinary(buffer, id);
    }

    const textFields: [string, string][] = [
      ["metaPixelId", "meta_pixel_id"],
      ["name", "name"],
      ["username", "username"],
      ["email", "email"],
      ["location", "location"],
      ["website", "website"],
      ["bio", "bio"],
      ["etsy", "etsy"],
      ["instagram", "instagram"],
      ["twitter", "twitter"],
      ["facebook", "facebook"],
      ["linkedin", "linkedin"],
      ["youtube", "youtube"],
      ["tiktok", "tiktok"],
      ["github", "github"],
      ["patreon", "patreon"],
      ["substack", "substack"],
      ["telegram", "telegram"],
      ["discord", "discord"],
      ["spotify", "spotify"],
      ["appleMusic", "apple_music"],
      ["tidal", "tidal"],
      ["amazonMusic", "amazon_music"],
      ["soundcloud", "soundcloud"],
      ["deezer", "deezer"],
      ["pandora", "pandora"],
      ["youtubeMusic", "youtube_music"],
      ["bandcamp", "bandcamp"],
    ];

    for (const [formKey, dbKey] of textFields) {
      const val = formData.get(formKey) as string | null;
      if (val !== null && val !== "") updates[dbKey] = val;
    }

    const displayEmail = formData.get("displayEmail");
    if (displayEmail === "true") updates.display_email = true;
    else if (displayEmail === "false") updates.display_email = false;

    const newsletterStyle = formData.get("newsletterStyle") as string | null;
    if (newsletterStyle) {
      try { updates.newsletter_style = JSON.parse(newsletterStyle); } catch { /* ignore bad json */ }
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: mapUser(updated) }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

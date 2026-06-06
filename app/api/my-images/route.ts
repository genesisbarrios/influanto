import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export const dynamic = "force-dynamic";

// Returns every distinct image the user already has across their pages, for the
// "select from your images" gallery in the image picker.
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const [{ data: lib }, { data: rps }, { data: user }] = await Promise.all([
    supabase.from("link_in_bio").select("links, brand_logo_url, bg_image_custom").eq("user_id", uid).maybeSingle(),
    supabase.from("release_pages").select("image").eq("user_id", uid),
    supabase.from("users").select("image").eq("id", uid).maybeSingle(),
  ]);

  const images = new Set<string>();
  for (const l of (lib?.links as any[]) ?? []) if (l?.image) images.add(l.image);
  if (lib?.brand_logo_url) images.add(lib.brand_logo_url);
  if (lib?.bg_image_custom) images.add(lib.bg_image_custom);
  for (const r of (rps as any[]) ?? []) if (r?.image) images.add(r.image);
  if (user?.image) images.add(user.image);

  return NextResponse.json({ images: Array.from(images) });
}

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapCrosspost } from "@/libs/supabase";

async function premiumUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const { data } = await supabase.from("users").select("has_access").eq("id", session.user.id).single();
  return data?.has_access ? session.user.id : null;
}

export async function GET(_req: NextRequest) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { data, error } = await supabase
    .from("crossposts")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (data ?? []).map(mapCrosspost) });
}

export async function POST(req: NextRequest) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("crossposts")
    .insert({
      user_id: userId,
      kind: body.kind === "video" ? "video" : "image",
      media: Array.isArray(body.media) ? body.media : [],
      caption: body.caption ?? "",
      platforms: Array.isArray(body.platforms) ? body.platforms : [],
      settings: body.settings ?? {},
      status: "draft",
      results: {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: mapCrosspost(data) }, { status: 201 });
}

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { data, error } = await supabase
    .from("crossposts").select().eq("id", params.id).eq("user_id", userId).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: mapCrosspost(data) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.kind !== undefined) updates.kind = body.kind === "video" ? "video" : "image";
  if (body.media !== undefined) updates.media = Array.isArray(body.media) ? body.media : [];
  if (body.caption !== undefined) updates.caption = body.caption;
  if (body.platforms !== undefined) updates.platforms = Array.isArray(body.platforms) ? body.platforms : [];
  if (body.settings !== undefined) updates.settings = body.settings ?? {};

  const { data, error } = await supabase
    .from("crossposts").update(updates).eq("id", params.id).eq("user_id", userId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: mapCrosspost(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await premiumUserId();
  if (!userId) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { error } = await supabase.from("crossposts").delete().eq("id", params.id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}

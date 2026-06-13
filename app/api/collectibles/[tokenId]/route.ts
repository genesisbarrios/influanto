import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

// DELETE /api/collectibles/:tokenId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { error } = await supabase
    .from("collectibles")
    .delete()
    .eq("token_id", params.tokenId)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/collectibles/:tokenId
export async function PATCH(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const allowed = ["title", "description", "artist", "genres", "bpm", "lyrics", "release_date", "price_usd"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("collectibles")
    .update(updates)
    .eq("token_id", params.tokenId)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

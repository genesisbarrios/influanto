import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // Only touch fields that were sent, so partial updates (e.g. syncing publishing
  // details from a split sheet) don't wipe the rest of the contact
  const update: Record<string, string> = {};
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.email !== undefined) update.email = String(body.email).trim().toLowerCase();
  for (const key of ["role", "phone", "publisher", "publishing_percent"]) {
    if (body[key] !== undefined) update[key] = String(body[key] ?? "").trim();
  }

  const { data, error } = await supabase
    .from("collaborator_contacts")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("collaborator_contacts")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { resolveUserIdsByEmails } from "@/libs/supabase";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const { data, error } = await supabase
    .from("split_sheets")
    .select()
    .eq("id", params.id)
    .or(`user_id.eq.${uid},shared_user_ids.cs.{${uid}}`)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const sharedIds = (await resolveUserIdsByEmails((body.contributors ?? []).map((c: any) => c?.contact)))
    .filter((id) => id !== session.user.id);

  const { data, error } = await supabase
    .from("split_sheets")
    .update({
      title: body.title ?? "",
      date: body.date ?? "",
      artists: body.artists ?? "",
      state_country: body.stateCountry ?? "",
      contributors: body.contributors ?? [],
      publishing: body.publishing ?? [],
      shared_user_ids: sharedIds,
      ...(body.status && { status: body.status }),
    })
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
    .from("split_sheets")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}

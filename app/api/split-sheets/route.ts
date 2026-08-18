import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { resolveUserIdsByEmails } from "@/libs/supabase";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  // Sheets the user owns OR is a listed contributor on (shared_user_ids).
  const { data, error } = await supabase
    .from("split_sheets")
    .select()
    .or(`user_id.eq.${uid},shared_user_ids.cs.{${uid}}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

const FREE_SPLIT_SHEET_LIMIT = 5;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRow } = await supabase.from("users").select("has_access").eq("id", session.user.id).single();
  if (!userRow?.has_access) {
    const { count } = await supabase
      .from("split_sheets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);
    if ((count ?? 0) >= FREE_SPLIT_SHEET_LIMIT) {
      return NextResponse.json(
        { error: `Free plan is limited to ${FREE_SPLIT_SHEET_LIMIT} split sheets. Upgrade to create more.` },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  // Contributors whose contact email maps to an Influanto account get access too.
  const sharedIds = (await resolveUserIdsByEmails((body.contributors ?? []).map((c: any) => c?.contact)))
    .filter((id) => id !== session.user.id);

  const { data, error } = await supabase
    .from("split_sheets")
    .insert({
      user_id: session.user.id,
      title: body.title ?? "",
      date: body.date ?? "",
      artists: body.artists ?? "",
      state_country: body.stateCountry ?? "",
      contributors: body.contributors ?? [],
      publishing: body.publishing ?? [],
      shared_user_ids: sharedIds,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

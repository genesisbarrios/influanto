import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { resolveUserIdsByEmails } from "@/libs/supabase";
import { syncCollaboratorContacts } from "@/libs/collaboratorContacts";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  // Sheets the user owns OR is a listed contributor on (shared_user_ids).
  // Delivery tracking per recipient comes along for the list's status line
  // (never the signing tokens), and only on sheets the user owns.
  const list = (columns: string) => supabase
    .from("split_sheets")
    .select(columns)
    .or(`user_id.eq.${uid},shared_user_ids.cs.{${uid}}`)
    .order("created_at", { ascending: false });
  let { data, error } = await list("*, split_sheet_signers(id, contributor_name, contributor_email, last_sent_at, opened_at, clicked_at, viewed_at, edited_at, signed_at)");
  // Before the tracking migration has run, the extra columns don't exist yet
  if (error) ({ data, error } = await list("*"));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map(({ split_sheet_signers, ...sheet }: any) => ({
    ...sheet,
    signers: sheet.user_id === uid ? split_sheet_signers ?? [] : [],
  }));
  return NextResponse.json({ data: rows });
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

  // Keep collaborator contacts in step with the sheet (signed or not). The sheet
  // is already saved, so a contact sync failure is reported but not fatal.
  let contactsError: string | undefined;
  try {
    await syncCollaboratorContacts(session.user.id, body.contributors, body.publishing);
  } catch (e: any) {
    console.error("split sheet contact sync failed:", e?.message);
    contactsError = "Sheet saved, but contacts could not be updated";
  }
  return NextResponse.json({ data, contactsError }, { status: 201 });
}

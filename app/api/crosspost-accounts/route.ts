import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapCrosspostAccount } from "@/libs/supabase";

const VALID = ["instagram", "tiktok", "youtube"];

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("crosspost_accounts").select().eq("user_id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (data ?? []).map(mapCrosspostAccount) });
}

// Connect (or update) a platform account. Until OAuth per platform is live, this
// accepts a handle + optional credentials (e.g. a token) for advanced users.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!VALID.includes(body.platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crosspost_accounts")
    .upsert(
      {
        user_id: session.user.id,
        platform: body.platform,
        handle: String(body.handle ?? "").trim(),
        credentials: body.credentials ?? {},
        connected: true,
      },
      { onConflict: "user_id,platform" }
    )
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: mapCrosspostAccount(data) }, { status: 201 });
}

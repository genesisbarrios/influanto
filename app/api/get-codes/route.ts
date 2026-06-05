import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapQRCodes } from "@/libs/supabase";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("qr_codes")
      .select()
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) throw error;

    // Always return 200 — empty array when no codes so the UI shows the Create button
    return NextResponse.json({ data: data ? [mapQRCodes(data)] : [] }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapUser } from "@/libs/supabase";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  try {
    const { data, error } = await supabase.from("users").select();
    if (error) throw error;
    return NextResponse.json({ data: (data ?? []).map(mapUser) }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

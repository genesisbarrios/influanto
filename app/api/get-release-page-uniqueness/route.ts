import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: 'Invalid or missing "name" query parameter' },
      { status: 400 }
    );
  }

  try {
    const { data } = await supabase
      .from("release_pages")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    return NextResponse.json({ isUnique: !data }, { status: 200 });
  } catch (error) {
    console.error("Error checking name uniqueness:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

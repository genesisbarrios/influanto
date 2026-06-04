import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapReleasePage } from "@/libs/supabase";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("release_pages")
      .select()
      .eq("user_id", session.user.id);

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "No Pages Created Yet.. Create Your First Release Page!", data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ data: data.map(mapReleasePage) }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Nothing Found.. Create Your First Release Page!", data: null },
      { status: 500 }
    );
  }
}

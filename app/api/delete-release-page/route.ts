import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase from "@/libs/supabase";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Please Sign In." }, { status: 401 });
  }

  const { id } = await req.json();
  const userId = session.user.id;

  try {
    const { data, error } = await supabase
      .from("release_pages")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Release page not found or you don't have permission to delete it." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Release page deleted successfully." }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

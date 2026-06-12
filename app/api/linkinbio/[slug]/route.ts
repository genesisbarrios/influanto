import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase, { mapUser, mapLinkInBio } from "@/libs/supabase";

// Always serve fresh data — never cache this public lookup.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params?.slug;
  if (!slug) {
    return NextResponse.json({ error: "Slug Required." }, { status: 400 });
  }

  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select()
      .eq("username", slug)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Not Found." }, { status: 404 });
    }

    const { data: linkInBio } = await supabase
      .from("link_in_bio")
      .select()
      .eq("user_id", user.id)
      .single();

    return NextResponse.json(
      { data: { user: mapUser(user), linkInBio: linkInBio ? mapLinkInBio(linkInBio) : null } },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase, { mapUser, mapReleasePage } from "@/libs/supabase";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params?.slug;
  if (!slug) {
    return NextResponse.json({ error: "Slug Required." }, { status: 400 });
  }

  try {
    const { data: releasePage, error: rpError } = await supabase
      .from("release_pages")
      .select()
      .eq("name", slug)
      .single();

    if (rpError || !releasePage) {
      return NextResponse.json({ error: "Release Page Not Found." }, { status: 404 });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select()
      .eq("id", releasePage.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User Not Found." }, { status: 404 });
    }

    return NextResponse.json(
      { data: { releasePage: mapReleasePage(releasePage), user: mapUser(user) } },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

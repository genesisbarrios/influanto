import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase, { mapPublicUser, mapLinkInBio } from "@/libs/supabase";
import { isNewsletterFull } from "@/libs/newsletter-limit";

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

    const newsletterFull = await isNewsletterFull(user.id);

    // EPK link: their chosen Influanto EPK (by id, so slug changes don't break it) or a custom URL
    let epkUrl = "";
    const epk = user.epk_link;
    if (epk?.enabled) {
      if (epk.pageId) {
        const { data: page } = await supabase
          .from("release_pages")
          .select("slug")
          .eq("id", epk.pageId)
          .eq("user_id", user.id)
          .eq("page_type", "epk")
          .maybeSingle();
        if (page?.slug) epkUrl = `/epk/${encodeURIComponent(page.slug)}`;
      } else if (epk.url) {
        epkUrl = epk.url;
      }
    }

    return NextResponse.json(
      { data: { user: { ...mapPublicUser(user), newsletterFull, epkUrl }, linkInBio: linkInBio ? mapLinkInBio(linkInBio) : null } },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

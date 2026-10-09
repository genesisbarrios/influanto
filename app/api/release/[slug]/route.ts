import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import supabase, { mapPublicUser, mapReleasePage, findReleasePageBySlug } from "@/libs/supabase";
import { isNewsletterFull } from "@/libs/newsletter-limit";
import { resolveEpkReleases } from "@/libs/epkReleases";

// Always serve fresh data — never cache this public lookup.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params?.slug;
  if (!slug) {
    return NextResponse.json({ error: "Slug Required." }, { status: 400 });
  }

  try {
    const { data: releasePage, error: rpError } = await findReleasePageBySlug(slug);

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

    const newsletterFull = await isNewsletterFull(user.id);

    const page: any = mapReleasePage(releasePage);
    if (page.pageType === "epk") page.epkReleases = await resolveEpkReleases(releasePage.user_id, releasePage.epk);

    return NextResponse.json(
      { data: { releasePage: page, user: { ...mapPublicUser(user), newsletterFull } } },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

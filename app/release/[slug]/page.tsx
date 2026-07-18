import type { Metadata } from "next";
import supabase, { mapUser, mapReleasePage } from "@/libs/supabase";
import { getSEOTags } from "@/libs/seo";
import ReleasePageClient from "./ReleasePageClient";

// Always serve fresh data — a release-page edit should be reflected in the next share.
export const dynamic = "force-dynamic";

const fallbackImageUrl =
  "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;

  const { data: releasePageRow } = await supabase
    .from("release_pages")
    .select()
    .eq("name", slug)
    .single();
  const releasePage = mapReleasePage(releasePageRow);

  let user = null;
  if (releasePage) {
    const { data: userRow } = await supabase
      .from("users")
      .select()
      .eq("id", releasePage.userId)
      .single();
    user = mapUser(userRow);
  }

  const songName = releasePage?.name || slug;
  const username = user?.username || slug;
  const title = `Stream ${songName} by ${username}`;
  const description =
    releasePage?.description || `Listen to ${songName} by ${username} on Influanto.`;
  const image = releasePage?.image || user?.image || fallbackImageUrl;
  const url = `https://influanto.com/release/${slug}`;

  return getSEOTags({
    title,
    description,
    canonicalUrlRelative: `/release/${slug}`,
    openGraph: {
      title,
      description,
      url,
      type: "music.song",
      images: [{ url: image }],
    },
  });
}

export default function Page() {
  return <ReleasePageClient />;
}

import type { Metadata } from "next";
import supabase, { mapUser, mapReleasePage, findReleasePageBySlug } from "@/libs/supabase";
import { getSEOTags } from "@/libs/seo";

// Link-preview / SEO metadata shared by /release/[slug] and /epk/[slug].
// EPK pages canonicalize to /epk/<slug>, release pages to /release/<slug>.

const fallbackImageUrl =
  "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

export async function buildReleaseMetadata(slug: string): Promise<Metadata> {


  const { data: releasePageRow } = await findReleasePageBySlug(slug);
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
  const isEpk = releasePage?.pageType === "epk";
  const title = isEpk ? `${songName} — Electronic Press Kit (EPK)` : `Stream ${songName} by ${username}`;
  const description =
    releasePage?.description ||
    (isEpk ? `${songName}'s electronic press kit: bio, music, videos, shows, photos, and booking contact.` : `Listen to ${songName} by ${username} on Influanto.`);
  const image = releasePage?.image || user?.image || fallbackImageUrl;
  const base = isEpk ? "epk" : "release";
  const url = `https://www.influanto.com/${base}/${releasePage?.slug || slug}`;

  return getSEOTags({
    title,
    description,
    canonicalUrlRelative: `/${base}/${releasePage?.slug || slug}`,
    openGraph: {
      title,
      description,
      url,
      type: isEpk ? "profile" : "music.song",
      images: [{ url: image }],
    },
  });
}

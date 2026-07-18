import type { Metadata } from "next";
import supabase, { mapUser } from "@/libs/supabase";
import { getSEOTags } from "@/libs/seo";
import LinkInBioClient from "./LinkInBioClient";

// Always serve fresh data — a profile edit should be reflected in the next share.
export const dynamic = "force-dynamic";

const fallbackImageUrl =
  "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

export async function generateMetadata({
  params,
}: {
  params: { linkinbio: string };
}): Promise<Metadata> {
  const username = params.linkinbio;

  const { data: userRow } = await supabase
    .from("users")
    .select()
    .eq("username", username)
    .single();
  const user = mapUser(userRow);

  const title = `${username}'s Link In Bio`;
  const description = `Check out ${username}'s links on Influanto.`;
  const image = user?.image || fallbackImageUrl;
  const url = `https://influanto.com/${username}`;

  return getSEOTags({
    title,
    description,
    canonicalUrlRelative: `/${username}`,
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      images: [{ url: image }],
    },
  });
}

export default function Page() {
  return <LinkInBioClient />;
}

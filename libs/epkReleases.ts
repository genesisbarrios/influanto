import supabase from "@/libs/supabase";
import { withEpkDefaults, type EpkReleaseCard } from "@/libs/epk";

// Turn an EPK's selected releases into cards for the public page. Release pages
// are looked up live (only the EPK owner's own, non-EPK pages), so a cover or
// title change on the release page shows up on the EPK automatically.
export async function resolveEpkReleases(userId: string, epk: any): Promise<EpkReleaseCard[]> {
  const releases = withEpkDefaults(epk).releases;
  const ids = releases.flatMap((r) => (r.kind === "page" ? [r.id] : []));
  const pages = new Map<string, any>();
  if (ids.length) {
    const { data } = await supabase
      .from("release_pages")
      .select("id, name, image, slug, page_type")
      .eq("user_id", userId)
      .in("id", ids);
    for (const p of data ?? []) if (p.page_type !== "epk") pages.set(p.id, p);
  }
  return releases.flatMap((r): EpkReleaseCard[] => {
    if (r.kind === "custom") return [{ title: r.title, image: r.image, url: r.url, internal: false }];
    const p = pages.get(r.id);
    return p ? [{ title: p.name, image: p.image || "", url: `/release/${p.slug}`, internal: true }] : [];
  });
}

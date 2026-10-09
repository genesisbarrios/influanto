import type { Metadata } from "next";
import { buildReleaseMetadata } from "@/libs/releaseMetadata";
import ReleasePageClient from "./ReleasePageClient";

// Always serve fresh data — a release-page edit should be reflected in the next share.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return buildReleaseMetadata(params.slug);
}

export default function Page() {
  return <ReleasePageClient />;
}

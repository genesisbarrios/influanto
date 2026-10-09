import type { Metadata } from "next";
import { buildReleaseMetadata } from "@/libs/releaseMetadata";
import ReleasePageClient from "@/app/release/[slug]/ReleasePageClient";

// EPKs are release pages with page_type "epk"; same client, EPK-friendly URL.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return buildReleaseMetadata(params.slug);
}

export default function Page() {
  return <ReleasePageClient />;
}

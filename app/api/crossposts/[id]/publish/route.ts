import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import supabase, { mapCrosspost } from "@/libs/supabase";
import { publishToPlatform, PublishResult } from "@/libs/crosspost/publish";
import { Platform } from "@/libs/crosspost/constants";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { data: post, error } = await supabase
    .from("crossposts").select().eq("id", params.id).eq("user_id", userId).single();
  if (error || !post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!post.media?.length) return NextResponse.json({ error: "Add media before publishing" }, { status: 400 });
  if (!post.platforms?.length) return NextResponse.json({ error: "Select at least one platform" }, { status: 400 });

  // Connected accounts for this user, keyed by platform
  const { data: accounts } = await supabase
    .from("crosspost_accounts").select().eq("user_id", userId);
  const byPlatform = new Map<string, any>();
  (accounts ?? []).forEach((a: any) => byPlatform.set(a.platform, a));

  const results: Record<string, PublishResult> = {};
  for (const platform of post.platforms as Platform[]) {
    const acct = byPlatform.get(platform);
    results[platform] = await publishToPlatform(platform, {
      account: acct ? { platform, handle: acct.handle, connected: acct.connected, credentials: acct.credentials } : null,
      post: { kind: post.kind, media: post.media, caption: post.caption ?? "" },
      settings: (post.settings?.[platform] ?? {}),
    });
  }

  // Roll up an overall status
  const statuses = Object.values(results).map(r => r.status);
  const overall =
    statuses.every(s => s === "published") ? "published"
    : statuses.some(s => s === "published") ? "partial"
    : statuses.some(s => s === "pending") ? "pending"
    : "failed";

  const { data: updated } = await supabase
    .from("crossposts")
    .update({ results, status: overall, updated_at: new Date().toISOString() })
    .eq("id", params.id).eq("user_id", userId)
    .select().single();

  return NextResponse.json({ data: mapCrosspost(updated), results, status: overall });
}

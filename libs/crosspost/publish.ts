import { Platform, PLATFORM_LABEL } from "./constants";

// ── Publish dispatcher ────────────────────────────────────────────────────────
// Each platform's real Content Publishing API is wired in here as its developer
// app is approved. Until then a connected account returns "pending" and an
// unconnected one returns "skipped", so the UI can show accurate per-platform
// status without anything half-working.

export interface PublishContext {
  account: { platform: Platform; handle: string; connected: boolean; credentials?: any } | null;
  post: { kind: "image" | "video"; media: { url: string; width?: number; height?: number; duration?: number }[]; caption: string };
  settings: Record<string, any>;
}

export interface PublishResult {
  status: "published" | "failed" | "skipped" | "pending";
  url?: string;
  error?: string;
}

// Toggle on per-platform once its app is approved + credentials are real.
const LIVE: Record<Platform, boolean> = {
  instagram: false,
  tiktok: false,
  youtube: false,
};

export async function publishToPlatform(platform: Platform, ctx: PublishContext): Promise<PublishResult> {
  const label = PLATFORM_LABEL[platform];
  if (!ctx.account || !ctx.account.connected) {
    return { status: "skipped", error: `Connect ${label} to publish here` };
  }
  if (!LIVE[platform]) {
    return { status: "pending", error: `${label} publishing is pending app approval` };
  }
  try {
    switch (platform) {
      case "instagram": return await publishInstagram(ctx);
      case "tiktok": return await publishTikTok(ctx);
      case "youtube": return await publishYouTube(ctx);
    }
  } catch (e: any) {
    return { status: "failed", error: e?.message || "Publish failed" };
  }
}

// ── Per-platform adapters ─────────────────────────────────────────────────────
// Implemented as the documented request shapes; enabled via LIVE[] once the
// platform's app + tokens are in place. media[0].url must be a public URL.

async function publishInstagram(_ctx: PublishContext): Promise<PublishResult> {
  // Instagram Graph API — two-step container then publish:
  //   POST /{ig-user-id}/media           { image_url | video_url, media_type: 'REELS', caption }
  //   POST /{ig-user-id}/media_publish   { creation_id }
  // Requires an IG Business account + long-lived page token in account.credentials.
  return { status: "pending", error: "Instagram publishing not enabled yet" };
}

async function publishTikTok(_ctx: PublishContext): Promise<PublishResult> {
  // TikTok Content Posting API (Direct Post):
  //   POST /v2/post/publish/video/init/   { post_info, source_info: { source: 'PULL_FROM_URL', video_url } }
  //   (photo posts use /v2/post/publish/content/init/)
  // Requires audited app + user access token (open_id) in account.credentials.
  return { status: "pending", error: "TikTok publishing not enabled yet" };
}

async function publishYouTube(_ctx: PublishContext): Promise<PublishResult> {
  // YouTube Data API v3 videos.insert (resumable upload of the fetched bytes):
  //   snippet { title, description, tags }, status { privacyStatus }
  // #Shorts + vertical <=3min is auto-detected as a Short.
  // Requires OAuth access token (youtube.upload) in account.credentials.
  return { status: "pending", error: "YouTube publishing not enabled yet" };
}

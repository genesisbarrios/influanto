// Shared crossposting metadata: platforms, what each accepts, and the
// aspect-ratio / duration specs used for validation + 1-click auto-crop.

export type Platform = "instagram" | "tiktok" | "youtube";
export type PostKind = "image" | "video";

export interface PlatformMeta {
  key: Platform;
  label: string;
  icon: string;
  kinds: PostKind[]; // which post kinds this platform accepts
  videoLabel?: string; // e.g. "Reels", "Shorts"
}

export const PLATFORMS: PlatformMeta[] = [
  { key: "instagram", label: "Instagram", icon: "📸", kinds: ["image", "video"], videoLabel: "Reels" },
  { key: "tiktok", label: "TikTok", icon: "🎵", kinds: ["image", "video"] },
  { key: "youtube", label: "YouTube", icon: "▶️", kinds: ["video"], videoLabel: "Shorts" },
];

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// Platforms that can receive a given post kind.
export function platformsForKind(kind: PostKind): PlatformMeta[] {
  return PLATFORMS.filter(p => p.kinds.includes(kind));
}

// Accepted aspect ratios (width/height) per kind. Used to validate + suggest crop.
export const IMAGE_RATIOS: { label: string; ratio: number }[] = [
  { label: "1:1 (square)", ratio: 1 },
  { label: "4:5 (portrait)", ratio: 4 / 5 },
  { label: "1.91:1 (landscape)", ratio: 1.91 },
];

// Recommended vertical ratio for Reels / TikTok / Shorts.
export const VIDEO_RATIO = { label: "9:16 (vertical)", ratio: 9 / 16 };

// Max video duration (seconds) the platform accepts for the short-form surface.
export const MAX_VIDEO_SECONDS: Record<Platform, number> = {
  instagram: 90, // Reels
  tiktok: 600, // up to 10 min via API
  youtube: 180, // Shorts (<= 3 min)
};

export const RATIO_TOLERANCE = 0.04; // how far off a ratio can be before we warn

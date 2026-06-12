import {
  Platform, PostKind, PLATFORM_LABEL, IMAGE_RATIOS, VIDEO_RATIO,
  MAX_VIDEO_SECONDS, RATIO_TOLERANCE,
} from "./constants";

export interface MediaMeta {
  width?: number;
  height?: number;
  duration?: number; // seconds, video only
}

export interface Warning {
  platform: Platform;
  message: string;
}

// Closest accepted image ratio, for the auto-crop suggestion.
export function closestImageRatio(width: number, height: number) {
  const r = width / height;
  return IMAGE_RATIOS.reduce((best, cur) =>
    Math.abs(cur.ratio - r) < Math.abs(best.ratio - r) ? cur : best
  );
}

// Returns per-platform warnings for the given media + selected platforms.
export function validateMedia(kind: PostKind, media: MediaMeta, platforms: Platform[]): Warning[] {
  const out: Warning[] = [];
  const { width, height, duration } = media;
  if (!width || !height) return out;
  const ratio = width / height;

  for (const p of platforms) {
    const label = PLATFORM_LABEL[p];
    if (kind === "image") {
      const fits = IMAGE_RATIOS.some(r => Math.abs(r.ratio - ratio) <= RATIO_TOLERANCE);
      if (!fits) {
        const best = closestImageRatio(width, height);
        out.push({ platform: p, message: `Image is ${ratio.toFixed(2)}:1 — ${label} prefers ${best.label}. Auto-crop available.` });
      }
    } else {
      // Video — short-form surfaces want 9:16 vertical
      if (Math.abs(ratio - VIDEO_RATIO.ratio) > RATIO_TOLERANCE * 2) {
        out.push({ platform: p, message: `Video is ${ratio.toFixed(2)}:1 — ${label} prefers ${VIDEO_RATIO.label}.` });
      }
      if (duration && duration > MAX_VIDEO_SECONDS[p]) {
        out.push({ platform: p, message: `Video is ${Math.round(duration)}s — ${label} max is ${MAX_VIDEO_SECONDS[p]}s.` });
      }
    }
  }
  return out;
}

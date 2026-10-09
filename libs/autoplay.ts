// Link-in-bio "autoplay song": a SoundCloud track link or a direct audio file.

export type AutoplaySource = "soundcloud" | "audio";

export function getAutoplaySource(url: string | null | undefined): AutoplaySource | null {
  const u = String(url || "").trim();
  if (!/^https:\/\//i.test(u)) return null;
  if (/^https:\/\/(www\.|m\.)?soundcloud\.com\/[^/?#]+\/[^/?#]+/i.test(u) || /^https:\/\/on\.soundcloud\.com\/[A-Za-z0-9]+/i.test(u)) return "soundcloud";
  if (/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac)(\?|#|$)/i.test(u)) return "audio";
  return null;
}

// Fired by anything on the page that starts its own media; the player pauses on it
export const PAUSE_MUSIC_EVENT = "influanto:pause-music";

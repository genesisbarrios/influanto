import { normalizeUrl } from "@/libs/urls";

// Streaming links built from the artist's profile (the same ones the Link in Bio
// shows). EPKs use these instead of per-page streaming inputs.

// Platform rows the release page editor offers as built-in inputs
export const PREDEFINED_LINK_NAMES = ["Spotify", "Apple Music", "Tidal", "YouTube Music", "SoundCloud", "Pandora", "Amazon Music", "Bandcamp"];

export function profileStreamingLinks(user: any): { name: string; url: string }[] {
  if (!user) return [];
  const links: [string, string | undefined, (v: string) => string][] = [
    ["Spotify", user.spotify, (v) => `https://open.spotify.com/artist/${v}`],
    ["Apple Music", user.appleMusic, (v) => `https://music.apple.com/artist/${v}`],
    ["Tidal", user.tidal, (v) => `https://tidal.com/artist/${v}`],
    ["YouTube Music", user.youtubeMusic, (v) => `https://music.youtube.com/channel/${v}`],
    ["Amazon Music", user.amazonMusic, (v) => `https://music.amazon.com/${v}`],
    ["SoundCloud", user.soundcloud, (v) => `https://soundcloud.com/${v}`],
    ["Deezer", user.deezer, (v) => `https://deezer.com/${v}`],
    ["Pandora", user.pandora, (v) => `https://pandora.com/${v}`],
    ["Bandcamp", user.bandcamp, (v) => normalizeUrl(v)],
    ["Sound.xyz", user.soundxyz, (v) => `https://sound.xyz/${v}`],
  ];
  // Profile fields hold IDs/handles, but tolerate a full URL pasted in
  return links
    .filter(([, v]) => v && String(v).trim())
    .map(([name, v, build]) => {
      const val = String(v).trim();
      return { name, url: /^https?:\/\//i.test(val) ? val : build(val.replace(/^\/+/, "")) };
    });
}

// EPK music: profile streaming links + the page's own custom (non-platform) links
export function epkMusicLinks(user: any, pageLinks: { name: string; url: string }[] = []) {
  const custom = pageLinks.filter((l) => l?.url && !PREDEFINED_LINK_NAMES.includes(l.name));
  return [...profileStreamingLinks(user), ...custom];
}

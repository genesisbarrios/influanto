// Turn a YouTube or Vimeo link into an embeddable player URL. Playlists embed
// as the whole playlist: YouTube links with ?list= (optionally starting at the
// linked video) and Vimeo showcases/albums.

export function getVideoEmbedUrl(link: string | null | undefined): string | null {
  const url = String(link || "").trim();
  if (!url) return null;

  // YouTube
  if (/(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url)) {
    const video = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    const list = url.match(/[?&]list=([a-zA-Z0-9_-]+)/)?.[1];
    if (video && list) return `https://www.youtube.com/embed/${video}?list=${list}`;
    if (list) return `https://www.youtube.com/embed/videoseries?list=${list}`;
    if (video) return `https://www.youtube.com/embed/${video}`;
    return null;
  }

  // Vimeo
  if (/vimeo\.com/i.test(url)) {
    const showcase = url.match(/vimeo\.com\/(?:showcase|album)\/(\d+)/i)?.[1];
    if (showcase) return `https://vimeo.com/showcase/${showcase}/embed`;
    const m = url.match(/(?:player\.vimeo\.com\/video\/|vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/)?)(\d+)(?:\/([a-f0-9]+))?/i);
    if (m) {
      const hash = m[2] || url.match(/[?&]h=([a-f0-9]+)/i)?.[1];
      return `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${hash}` : ""}`;
    }
  }
  return null;
}

export const isEmbeddableVideo = (link: string | null | undefined) => !!getVideoEmbedUrl(link);

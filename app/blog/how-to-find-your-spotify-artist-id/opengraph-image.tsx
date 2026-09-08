import { renderBlogOgImage, blogOgImageSize, blogOgImageContentType } from "@/libs/blog-og-image";

export const runtime = "edge";
export const size = blogOgImageSize;
export const contentType = blogOgImageContentType;

export default async function Image() {
  return renderBlogOgImage({
    title: "How to Find Your Spotify Artist ID (and Apple, Tidal, Amazon, Pandora, Deezer, Qobuz)",
    gradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
    category: "Distribution",
  });
}

import { renderBlogOgImage, blogOgImageSize, blogOgImageContentType } from "@/libs/blog-og-image";

export const runtime = "edge";
export const size = blogOgImageSize;
export const contentType = blogOgImageContentType;

export default async function Image() {
  return renderBlogOgImage({
    title: "Why Indie Artists Should Use Release Pages Instead of Pasting Links",
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)",
    category: "Releases",
  });
}

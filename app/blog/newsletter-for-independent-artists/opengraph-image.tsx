import { renderBlogOgImage, blogOgImageSize, blogOgImageContentType } from "@/libs/blog-og-image";

export const runtime = "edge";
export const size = blogOgImageSize;
export const contentType = blogOgImageContentType;

export default async function Image() {
  return renderBlogOgImage({
    title: "Why Every Independent Artist Needs a Newsletter",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0ea5e9 100%)",
    category: "Marketing",
  });
}

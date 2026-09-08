import { renderBlogOgImage, blogOgImageSize, blogOgImageContentType } from "@/libs/blog-og-image";

export const runtime = "edge";
export const size = blogOgImageSize;
export const contentType = blogOgImageContentType;

export default async function Image() {
  return renderBlogOgImage({
    title: "Why Every Independent Artist Needs a Link in Bio",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)",
    category: "Marketing",
  });
}

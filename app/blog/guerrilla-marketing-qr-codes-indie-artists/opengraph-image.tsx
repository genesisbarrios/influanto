import { renderBlogOgImage, blogOgImageSize, blogOgImageContentType } from "@/libs/blog-og-image";

export const runtime = "edge";
export const size = blogOgImageSize;
export const contentType = blogOgImageContentType;

export default async function Image() {
  return renderBlogOgImage({
    title: "Guerrilla Marketing for Indie Artists: Using QR Codes to Market in the Real World",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)",
    category: "Marketing",
  });
}

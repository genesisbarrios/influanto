import { renderBlogOgImage, blogOgImageSize, blogOgImageContentType } from "@/libs/blog-og-image";

export const runtime = "edge";
export const size = blogOgImageSize;
export const contentType = blogOgImageContentType;

export default async function Image() {
  return renderBlogOgImage({
    title: "How to Set Up a Meta Pixel for Your Music (and Test It)",
    gradient: "linear-gradient(135deg, #0b1f4d 0%, #1d4ed8 50%, #0866ff 100%)",
    category: "Marketing",
  });
}

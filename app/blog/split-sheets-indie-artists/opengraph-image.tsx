import { renderBlogOgImage, blogOgImageSize, blogOgImageContentType } from "@/libs/blog-og-image";

export const runtime = "edge";
export const size = blogOgImageSize;
export const contentType = blogOgImageContentType;

export default async function Image() {
  return renderBlogOgImage({
    title: "Why Split Sheets Are Non-Negotiable for Indie Music Collaborations",
    gradient: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #d97706 100%)",
    category: "Business",
  });
}

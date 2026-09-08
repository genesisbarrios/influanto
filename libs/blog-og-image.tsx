import { ImageResponse } from "next/og";

export const blogOgImageSize = { width: 1200, height: 630 };
export const blogOgImageContentType = "image/png";

// Renders a per-post Open Graph / Twitter card image that mirrors that post's
// own header gradient and category badge, instead of one generic site-wide
// card for every article.
export function renderBlogOgImage({
  title,
  gradient,
  category,
}: {
  title: string;
  gradient: string;
  category: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: gradient,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: "#ffffff", letterSpacing: 1 }}>
            influanto
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "rgba(255,255,255,0.75)",
              marginBottom: 20,
            }}
          >
            {category}
          </span>
          <span
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            {title}
          </span>
        </div>
      </div>
    ),
    { ...blogOgImageSize }
  );
}

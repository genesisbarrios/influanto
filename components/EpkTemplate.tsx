"use client";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFileArrowDown, faFilePdf, faLocationDot, faChevronLeft, faChevronRight, faXmark, faQuoteLeft } from "@fortawesome/free-solid-svg-icons";
import { getYouTubeId, withEpkDefaults } from "@/libs/epk";

// Public electronic press kit layout for release pages with page_type "epk".
// The release page's streaming-link rows and featured video are passed in so
// they look identical to a normal release page.

export default function EpkTemplate({
  page,
  textColor,
  linksColor,
  cardColor,
  font,
  featuredVideo,
  listenLinks,
  fallbackImage,
}: {
  page: any;
  textColor: string;
  linksColor: string;
  cardColor: string;
  font: string;
  featuredVideo: ReactNode;
  listenLinks: ReactNode;
  fallbackImage: string;
}) {
  const epk = withEpkDefaults(page.epk);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [pdfState, setPdfState] = useState<"idle" | "working" | "error">("idle");

  const downloadPdf = async () => {
    setPdfState("working");
    try {
      const { downloadEpkPdf } = await import("@/libs/epkPdf");
      await downloadEpkPdf(page, `https://www.influanto.com/epk/${page.slug}`, linksColor);
      setPdfState("idle");
    } catch (e) {
      console.error(e);
      setPdfState("error");
    }
  };
  const card: CSSProperties = { background: cardColor || "rgba(255,255,255,0.1)", borderRadius: 12, padding: "1rem 1.25rem" };
  const h2: CSSProperties = { fontSize: "1.35rem", fontWeight: 800, margin: "2.25rem 0 0.9rem", color: textColor, fontFamily: font };
  const button: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15, color: "#fff", background: linksColor };
  const bookingHref = epk.bookingEmail ? `mailto:${epk.bookingEmail}?subject=${encodeURIComponent(`Booking inquiry: ${page.name}`)}` : "";
  const extraVideos = epk.videos.map(getYouTubeId).filter(Boolean) as string[];

  const step = useCallback((d: number) => setLightbox((i) => (i === null ? i : (i + d + epk.gallery.length) % epk.gallery.length)), [epk.gallery.length]);
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, step]);

  return (
    <div className="responsive-container" style={{ margin: "0 auto", color: textColor, fontFamily: font, textAlign: "left" }}>
      {/* Hero */}
      <div style={{ textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.image || fallbackImage}
          onError={(e) => (e.currentTarget.src = fallbackImage)}
          alt={page.name}
          style={{ width: 180, height: 180, objectFit: "cover", borderRadius: "50%", display: "inline-block", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
        />
        <p style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", opacity: 0.7, margin: "14px 0 4px", fontWeight: 700 }}>Electronic Press Kit</p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)", fontWeight: 900, lineHeight: 1.1, margin: 0, fontFamily: font, color: textColor }}>{page.name}</h1>
        {page.description && <p style={{ fontSize: "1.1rem", opacity: 0.85, margin: "10px auto 0", maxWidth: 560 }}>{page.description}</p>}
        {(epk.genre || epk.location) && (
          <p style={{ margin: "12px 0 0", opacity: 0.8, fontSize: 15 }}>
            {epk.genre}
            {epk.genre && epk.location && " · "}
            {epk.location && <><FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 5 }} />{epk.location}</>}
          </p>
        )}
        {(bookingHref || epk.pressKitUrl) && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
            {bookingHref && <a href={bookingHref} style={button}><FontAwesomeIcon icon={faEnvelope} />Booking</a>}
            {epk.pressKitUrl && (
              <a href={epk.pressKitUrl} target="_blank" rel="noopener noreferrer" style={{ ...button, background: "transparent", color: textColor, border: `2px solid ${linksColor}` }}>
                <FontAwesomeIcon icon={faFileArrowDown} />Press Kit
              </a>
            )}
          </div>
        )}
      </div>

      {/* Highlights */}
      {epk.highlights.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
          {epk.highlights.map((h, i) => (
            <span key={i} style={{ ...card, padding: "6px 14px", borderRadius: 99, fontSize: 14, fontWeight: 600 }}>{h}</span>
          ))}
        </div>
      )}

      {/* Bio */}
      {epk.bio && (
        <section>
          <h2 style={h2}>Bio</h2>
          <div style={{ ...card, whiteSpace: "pre-line", lineHeight: 1.7, fontSize: 16 }}>{epk.bio}</div>
        </section>
      )}

      {/* Videos */}
      {(featuredVideo || extraVideos.length > 0) && (
        <section>
          <h2 style={h2}>Videos</h2>
          {featuredVideo}
          {extraVideos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {extraVideos.map((id) => (
                <div key={id} style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 12, overflow: "hidden", background: "#000" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${id}`}
                    title="Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Listen */}
      {page.links?.some((l: any) => l?.url) && (
        <section>
          <h2 style={h2}>Listen</h2>
          {listenLinks}
        </section>
      )}

      {/* Venues */}
      {epk.venues.length > 0 && (
        <section>
          <h2 style={h2}>Venues & Shows</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {epk.venues.map((v, i) => (
              <div key={i} style={card}>
                <p style={{ margin: 0, fontWeight: 700 }}>{v.name}</p>
                {(v.city || v.date) && <p style={{ margin: "2px 0 0", fontSize: 14, opacity: 0.75 }}>{[v.city, v.date].filter(Boolean).join(" · ")}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {epk.gallery.length > 0 && (
        <section>
          <h2 style={h2}>Gallery</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {epk.gallery.map((src, i) => (
              <button key={src} type="button" onClick={() => setLightbox(i)} style={{ padding: 0, border: 0, background: "none", cursor: "zoom-in" }} aria-label={`Open photo ${i + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${page.name} photo ${i + 1}`} loading="lazy" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 10, display: "block" }} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Press */}
      {epk.pressQuotes.length > 0 && (
        <section>
          <h2 style={h2}>Press</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {epk.pressQuotes.map((q, i) => (
              <figure key={i} style={{ ...card, margin: 0 }}>
                <FontAwesomeIcon icon={faQuoteLeft} style={{ opacity: 0.4, fontSize: 18 }} />
                <blockquote style={{ margin: "6px 0 8px", fontSize: 16, lineHeight: 1.6, fontStyle: "italic" }}>{q.quote}</blockquote>
                {q.source && (
                  <figcaption style={{ fontWeight: 700, fontSize: 14 }}>
                    — {q.url ? <a href={q.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>{q.source}</a> : q.source}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Closing booking CTA */}
      {bookingHref && (
        <div style={{ ...card, textAlign: "center", marginTop: 36 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 18 }}>Booking & Inquiries</p>
          <a href={bookingHref} style={button}><FontAwesomeIcon icon={faEnvelope} />{epk.bookingEmail}</a>
        </div>
      )}

      {/* Download as PDF */}
      <div style={{ textAlign: "center", marginTop: 28 }}>
        <button type="button" onClick={downloadPdf} disabled={pdfState === "working"} style={{ ...button, border: 0, cursor: pdfState === "working" ? "wait" : "pointer", opacity: pdfState === "working" ? 0.7 : 1 }}>
          <FontAwesomeIcon icon={faFilePdf} />{pdfState === "working" ? "Building PDF…" : "Download PDF"}
        </button>
        {pdfState === "error" && <p style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>Couldn&apos;t build the PDF — please try again.</p>}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={epk.gallery[lightbox]} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "88vh", borderRadius: 8, objectFit: "contain" }} />
          {[
            { icon: faXmark, label: "Close", style: { top: 16, right: 16 }, act: () => setLightbox(null) },
            ...(epk.gallery.length > 1
              ? [
                  { icon: faChevronLeft, label: "Previous", style: { left: 12, top: "50%" }, act: () => step(-1) },
                  { icon: faChevronRight, label: "Next", style: { right: 12, top: "50%" }, act: () => step(1) },
                ]
              : []),
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              aria-label={b.label}
              onClick={(e) => { e.stopPropagation(); b.act(); }}
              style={{ position: "absolute", ...b.style, width: 44, height: 44, borderRadius: 99, border: 0, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, cursor: "pointer" } as CSSProperties}
            >
              <FontAwesomeIcon icon={b.icon} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFileArrowDown, faFilePdf, faLocationDot, faChevronLeft, faChevronRight, faXmark, faQuoteLeft } from "@fortawesome/free-solid-svg-icons";
import { withEpkDefaults } from "@/libs/epk";
import { getVideoEmbedUrl } from "@/libs/videoEmbed";

// Public electronic press kit layout for release pages with page_type "epk".
// Desktop: 90% width, two columns — bio, videos, and music on the left; booking,
// highlights, venues, and press on the right — with the gallery full width below.
// Phones stack everything in one column.

export interface EpkMusicLink { name: string; url: string }

export default function EpkTemplate({
  page,
  textColor,
  linksColor,
  cardColor,
  font,
  musicLinks,
  listenLinks,
  fallbackImage,
}: {
  page: any;
  textColor: string;
  linksColor: string;
  cardColor: string;
  font: string;
  musicLinks: EpkMusicLink[];
  listenLinks: ReactNode;
  fallbackImage: string;
}) {
  const epk = withEpkDefaults(page.epk);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [pdfState, setPdfState] = useState<"idle" | "working" | "error">("idle");

  const card: CSSProperties = { background: cardColor || "rgba(255,255,255,0.1)", borderRadius: 12, padding: "1rem 1.25rem" };
  const h2: CSSProperties = { fontSize: "1.35rem", fontWeight: 800, margin: "0 0 0.9rem", color: textColor, fontFamily: font };
  const button: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 18px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15, color: "#fff", background: linksColor, border: 0, cursor: "pointer" };
  const outlineButton: CSSProperties = { ...button, background: "transparent", color: textColor, border: `2px solid ${linksColor}` };
  const bookingHref = epk.bookingEmail ? `mailto:${epk.bookingEmail}?subject=${encodeURIComponent(`Booking inquiry: ${page.name}`)}` : "";
  const videos = Array.from(new Set([page.video, ...epk.videos].map(getVideoEmbedUrl).filter(Boolean) as string[]));

  const downloadPdf = async () => {
    setPdfState("working");
    try {
      const { downloadEpkPdf } = await import("@/libs/epkPdf");
      await downloadEpkPdf({ ...page, links: musicLinks }, `https://www.influanto.com/epk/${page.slug}`, linksColor);
      setPdfState("idle");
    } catch (e) {
      console.error(e);
      setPdfState("error");
    }
  };

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
    <div className="epk-wrap" style={{ color: textColor, fontFamily: font, textAlign: "left" }}>
      <style>{`
        .epk-wrap { width: 90%; max-width: 1400px; margin: 0 auto; }
        .epk-cols { display: grid; grid-template-columns: minmax(0, 1fr); gap: 28px; margin-top: 32px; }
        .epk-col { display: flex; flex-direction: column; gap: 28px; min-width: 0; }
        .epk-videos { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
        @media (min-width: 900px) {
          .epk-cols { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 36px; }
          .epk-videos.multi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .epk-videos.multi > :first-child { grid-column: 1 / -1; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.image || fallbackImage}
          onError={(e) => (e.currentTarget.src = fallbackImage)}
          alt={page.name}
          style={{ width: 180, height: 180, objectFit: "cover", borderRadius: "50%", display: "inline-block", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
        />
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 900, lineHeight: 1.1, margin: "14px 0 0", fontFamily: font, color: textColor }}>{page.name}</h1>
        <p style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", opacity: 0.7, margin: "6px 0 0", fontWeight: 700 }}>Electronic Press Kit</p>
        {page.description && <p style={{ fontSize: "1.1rem", opacity: 0.85, margin: "12px auto 0", maxWidth: 640 }}>{page.description}</p>}
        {(epk.genre || epk.location) && (
          <p style={{ margin: "10px 0 0", opacity: 0.8, fontSize: 15 }}>
            {epk.genre}
            {epk.genre && epk.location && " · "}
            {epk.location && <><FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 5 }} />{epk.location}</>}
          </p>
        )}
        {(bookingHref || epk.pressKitUrl) && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
            {bookingHref && <a href={bookingHref} style={button}><FontAwesomeIcon icon={faEnvelope} />Booking</a>}
            {epk.pressKitUrl && <a href={epk.pressKitUrl} target="_blank" rel="noopener noreferrer" style={outlineButton}><FontAwesomeIcon icon={faFileArrowDown} />Press Kit</a>}
          </div>
        )}
      </div>

      <div className="epk-cols">
        {/* Left: bio, videos, music */}
        <div className="epk-col">
          {epk.bio && (
            <section>
              <h2 style={h2}>Bio</h2>
              <div style={{ ...card, whiteSpace: "pre-line", lineHeight: 1.7, fontSize: 16 }}>{epk.bio}</div>
            </section>
          )}

          {videos.length > 0 && (
            <section>
              <h2 style={h2}>Videos</h2>
              <div className={`epk-videos${videos.length > 1 ? " multi" : ""}`}>
                {videos.map((src) => (
                  <div key={src} style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 12, overflow: "hidden", background: "#000" }}>
                    <iframe
                      src={src}
                      title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {musicLinks.length > 0 && (
            <section>
              <h2 style={h2}>Listen</h2>
              {listenLinks}
            </section>
          )}
        </div>

        {/* Right: booking, highlights, venues, press */}
        <div className="epk-col">
          <section style={{ ...card, textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 18 }}>Booking & Inquiries</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bookingHref && <a href={bookingHref} style={{ ...button, width: "100%", boxSizing: "border-box", overflowWrap: "anywhere" }}><FontAwesomeIcon icon={faEnvelope} />{epk.bookingEmail}</a>}
              <button type="button" onClick={downloadPdf} disabled={pdfState === "working"} style={{ ...button, width: "100%", cursor: pdfState === "working" ? "wait" : "pointer", opacity: pdfState === "working" ? 0.7 : 1 }}>
                <FontAwesomeIcon icon={faFilePdf} />{pdfState === "working" ? "Building EPK…" : "Download EPK"}
              </button>
              {epk.pressKitUrl && <a href={epk.pressKitUrl} target="_blank" rel="noopener noreferrer" style={{ ...outlineButton, width: "100%", boxSizing: "border-box" }}><FontAwesomeIcon icon={faFileArrowDown} />Press Kit / Rider</a>}
            </div>
            {pdfState === "error" && <p style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>Couldn&apos;t build the EPK — please try again.</p>}
          </section>

          {epk.highlights.length > 0 && (
            <section>
              <h2 style={h2}>Highlights</h2>
              <ul style={{ ...card, listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {epk.highlights.map((h, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontWeight: 600 }}>
                    <span style={{ color: linksColor, fontSize: 12, lineHeight: 1 }}>●</span>{h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {epk.venues.length > 0 && (
            <section>
              <h2 style={h2}>Venues & Shows</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
                {epk.venues.map((v, i) => (
                  <div key={i} style={card}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{v.name}</p>
                    {(v.city || v.date) && <p style={{ margin: "2px 0 0", fontSize: 14, opacity: 0.75 }}>{[v.city, v.date].filter(Boolean).join(" · ")}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

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
        </div>
      </div>

      {/* Gallery: full width */}
      {epk.gallery.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h2 style={h2}>Gallery</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {epk.gallery.map((src, i) => (
              <button key={src} type="button" onClick={() => setLightbox(i)} style={{ padding: 0, border: 0, background: "none", cursor: "zoom-in" }} aria-label={`Open photo ${i + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${page.name} photo ${i + 1}`} loading="lazy" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 10, display: "block" }} />
              </button>
            ))}
          </div>
        </section>
      )}

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

import { withEpkDefaults } from "@/libs/epk";
import { isEmbeddableVideo } from "@/libs/videoEmbed";
import { sanitizeFilename } from "@/libs/urls";

// Builds a downloadable PDF of an EPK page in the browser (jsPDF is loaded on
// demand by the caller's click handler).

type Rgb = [number, number, number];

// Load an image as a JPEG data URL, center-cropped to `square` px if given.
// Returns null if it can't be loaded (e.g. the host blocks cross-origin use).
async function loadImage(src: string, square?: number): Promise<{ data: string; w: number; h: number } | null> {
  if (!src) return null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    if (square) {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      canvas.width = canvas.height = square;
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, square, square);
    } else {
      const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    return { data: canvas.toDataURL("image/jpeg", 0.85), w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

function hexToRgb(color: string | undefined, fallback: Rgb): Rgb {
  const m = String(color || "").match(/^#?([0-9a-f]{6})/i);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function downloadEpkPdf(page: any, pageUrl: string, accentColor?: string) {
  const { default: jsPDF } = await import("jspdf");
  const epk = withEpkDefaults(page.epk);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const accent = hexToRgb(accentColor, [37, 99, 235]);
  let y = 0;

  const ensure = (needed: number) => {
    if (y + needed > H - 60) { doc.addPage(); y = M; }
  };
  const heading = (text: string) => {
    ensure(100); // keep a heading on the same page as the start of its section
    y += 14;
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...accent);
    doc.text(text.toUpperCase(), M, y);
    doc.setDrawColor(...accent).setLineWidth(1.2).line(M, y + 6, W - M, y + 6);
    y += 24;
    doc.setTextColor(30, 30, 30);
  };
  const paragraph = (text: string, size = 11, lineH = 15) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(40, 40, 40);
    for (const line of doc.splitTextToSize(text, W - 2 * M) as string[]) {
      ensure(lineH);
      doc.text(line, M, y);
      y += lineH;
    }
  };
  const link = (label: string, href: string, shownText = href) => {
    ensure(16);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(30, 30, 30);
    doc.text(label, M, y);
    const lw = doc.getTextWidth(label + "  ");
    doc.setFont("helvetica", "normal").setTextColor(...accent);
    const shown = (doc.splitTextToSize(shownText, W - 2 * M - lw) as string[])[0];
    doc.textWithLink(shown, M + lw, y, { url: href });
    y += 17;
  };

  // ── Header band with photo ──────────────────────────────────────────────
  const bandH = 190;
  doc.setFillColor(...accent).rect(0, 0, W, bandH, "F");
  const photo = await loadImage(page.image, 400);
  const photoSize = 130;
  if (photo) doc.addImage(photo.data, "JPEG", M, 30, photoSize, photoSize);
  const tx = photo ? M + photoSize + 24 : M;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(10).text("ELECTRONIC PRESS KIT", tx, 52);
  doc.setFontSize(28);
  const nameLines = doc.splitTextToSize(page.name || "", W - tx - M) as string[];
  doc.text(nameLines.slice(0, 2), tx, 84);
  let hy = 84 + nameLines.slice(0, 2).length * 30;
  doc.setFont("helvetica", "normal").setFontSize(11.5);
  const meta = [epk.genre, epk.location].filter(Boolean).join("  ·  ");
  if (meta) { doc.text(meta, tx, hy); hy += 16; }
  if (page.description) {
    doc.text((doc.splitTextToSize(page.description, W - tx - M) as string[]).slice(0, 2), tx, hy);
  }
  y = bandH + 30;

  // Contact line
  if (epk.bookingEmail) link("Booking:", `mailto:${epk.bookingEmail}`, epk.bookingEmail);
  if (epk.pressKitUrl) link("Press kit / rider:", epk.pressKitUrl);
  link("Online EPK:", pageUrl);

  // ── Sections ────────────────────────────────────────────────────────────
  if (epk.highlights.length) {
    heading("Highlights");
    doc.setFont("helvetica", "normal").setFontSize(11);
    for (const h of epk.highlights) paragraph(`•  ${h}`, 11, 16);
  }

  if (epk.bio) {
    heading("Bio");
    for (const para of epk.bio.split(/\n\s*\n/)) { paragraph(para.trim()); y += 6; }
  }

  const music = (page.links || []).filter((l: any) => l?.url);
  if (music.length) {
    heading("Music");
    for (const l of music) link(`${l.name || "Listen"}:`, l.url);
  }

  const videos = Array.from(new Set([page.video, ...epk.videos].filter((v) => isEmbeddableVideo(v)))) as string[];
  if (videos.length) {
    heading("Videos");
    videos.forEach((v, i) => link(`${/[?&]list=|showcase|album/i.test(v) ? "Playlist" : "Video"} ${i + 1}:`, v));
  }

  if (epk.venues.length) {
    heading("Venues & Shows");
    const colW = (W - 2 * M) / 2;
    epk.venues.forEach((v, i) => {
      const col = i % 2;
      if (col === 0) ensure(32);
      const x = M + col * colW;
      doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(30, 30, 30);
      doc.text((doc.splitTextToSize(v.name, colW - 12) as string[])[0], x, y);
      const sub = [v.city, v.date].filter(Boolean).join(" · ");
      if (sub) doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(110, 110, 110).text(sub, x, y + 13);
      if (col === 1 || i === epk.venues.length - 1) y += 32;
    });
  }

  if (epk.pressQuotes.length) {
    heading("Press");
    for (const q of epk.pressQuotes) {
      doc.setFont("helvetica", "italic").setFontSize(11.5).setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(`“${q.quote}”`, W - 2 * M - 14) as string[];
      ensure(lines.length * 16 + 24);
      doc.setDrawColor(...accent).setLineWidth(2.5).line(M, y - 10, M, y + lines.length * 16 - 8);
      lines.forEach((ln) => { doc.text(ln, M + 14, y); y += 16; });
      if (q.source) {
        doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(90, 90, 90);
        if (q.url) doc.textWithLink(`— ${q.source}`, M + 14, y, { url: q.url });
        else doc.text(`— ${q.source}`, M + 14, y);
        y += 14;
      }
      y += 10;
    }
  }

  if (epk.gallery.length) {
    heading("Gallery");
    const cols = 3, gap = 10;
    const size = (W - 2 * M - gap * (cols - 1)) / cols;
    const imgs = await Promise.all(epk.gallery.map((src) => loadImage(src, 600)));
    let col = 0;
    for (const img of imgs) {
      if (!img) continue;
      if (col === 0) ensure(size + gap);
      doc.addImage(img.data, "JPEG", M + col * (size + gap), y, size, size);
      col = (col + 1) % cols;
      if (col === 0) y += size + gap;
    }
    if (col !== 0) y += size + gap;
  }

  // ── Footer on every page ────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(140, 140, 140);
    doc.text(`${page.name} — Electronic Press Kit`, M, H - 28);
    doc.text(`${i} / ${pages}`, W - M, H - 28, { align: "right" });
    doc.text("Made with influanto.com", W / 2, H - 28, { align: "center" });
  }

  doc.save(`${sanitizeFilename(page.name || "") || "artist"}_EPK.pdf`);
}

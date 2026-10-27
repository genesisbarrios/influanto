import { getYouTubeId, withEpkDefaults } from "@/libs/epk";
import { isEmbeddableVideo } from "@/libs/videoEmbed";
import { sanitizeFilename } from "@/libs/urls";

// Builds a downloadable PDF of an EPK page in the browser (jsPDF is loaded on
// demand by the caller's click handler). It mirrors the public page: the page's
// background (color, pattern, or photo), text/link/card colors, translucent
// rounded cards, round artist photo, and headings set in the page's font
// (rendered to images, since jsPDF only ships Helvetica/Times/Courier).
// Text and links stay real, so the PDF is selectable and clickable.

export interface EpkPdfStyle { textColor: string; linksColor: string; cardColor: string; font: string }

type Rgb = [number, number, number];
interface Color { rgb: Rgb; a: number }
type Img = HTMLImageElement;

// Resolve any CSS color (named, hex, rgb/rgba) via the canvas parser
function parseColor(css: string | undefined, fallback: string): Color {
  const ctx = document.createElement("canvas").getContext("2d")!;
  const read = (c: string) => {
    ctx.fillStyle = "#010203";
    ctx.fillStyle = c;
    return ctx.fillStyle as string;
  };
  let v = css ? read(css) : "#010203";
  if (v === "#010203" && css?.replace(/\s/g, "").toLowerCase() !== "#010203") v = read(fallback);
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], a: 1 };
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  const [r, g, b, a = "1"] = (m?.[1] || "0,0,0").split(",").map((s) => s.trim());
  return { rgb: [+r, +g, +b], a: +a };
}

const cssColor = ({ rgb, a }: Color) => `rgba(${rgb.join(",")},${a})`;

function loadImg(src: string | undefined): Promise<Img | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = src;
  });
}

// Cover-crop an image to w×h pt as a JPEG data URL (rounding is done with a
// PDF clipping path when it's placed, so photos stay small JPEGs, not PNGs)
function coverJpeg(img: Img, w: number, h: number, scale = 2): string | null {
  try {
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = cw; canvas.height = ch;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    canvas.getContext("2d")!.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null; // tainted canvas (host blocks cross-origin use)
  }
}

// Render a line of text in the page's (web) font to a transparent PNG.
// Shrinks to fit maxW. Returns its size in pt.
function textImage(text: string, font: string, sizePt: number, weight: number, color: Color, maxW: number, minSize = sizePt * 0.6) {
  const scale = 4;
  const ctx = document.createElement("canvas").getContext("2d")!;
  let size = sizePt;
  const setFont = () => { ctx.font = `${weight} ${size * scale}px ${font}`; };
  setFont();
  while (ctx.measureText(text).width / scale > maxW && size > minSize) { size -= 0.5; setFont(); }
  let shown = text;
  while (ctx.measureText(shown).width / scale > maxW && shown.length > 1) shown = shown.slice(0, -2) + "…";
  const m = ctx.measureText(shown);
  const ascent = Math.max(m.actualBoundingBoxAscent || 0, size * scale * 0.8);
  const descent = Math.max(m.actualBoundingBoxDescent || 0, size * scale * 0.25);
  const canvas = ctx.canvas;
  canvas.width = Math.ceil(m.width) + 4;
  canvas.height = Math.ceil(ascent + descent) + 4;
  setFont();
  ctx.fillStyle = cssColor(color);
  ctx.textBaseline = "alphabetic";
  ctx.fillText(shown, 2, ascent + 2);
  return { data: canvas.toDataURL("image/png"), w: canvas.width / scale, h: canvas.height / scale };
}

// The page background as one full-page JPEG: body color, then its pattern
// (tiled) or photo (cover). Read from the live page so it matches exactly.
async function pageBackground(W: number, H: number): Promise<string> {
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  const cs = getComputedStyle(document.body);
  const bg = parseColor(cs.backgroundColor, "#000000");
  ctx.fillStyle = bg.a === 0 ? "#000000" : cssColor(bg);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const url = cs.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
  const img = await loadImg(url);
  if (img) {
    try {
      if (cs.backgroundSize === "cover") {
        const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      } else {
        const pattern = ctx.createPattern(img, "repeat")!;
        pattern.setTransform(new DOMMatrix().scale(scale * 0.75)); // CSS px → pt
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } catch { /* keep the plain color */ }
  }
  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    // Photo host blocked cross-origin use: fall back to the color alone
    ctx.fillStyle = bg.a === 0 ? "#000000" : cssColor(bg);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }
}

// jsPDF's built-in family closest to the page's font
const bodyFamily = (font: string) =>
  /monospace|mono|courier/i.test(font) ? "courier" : /(^|[^-])serif|lora|playfair|abril|dm serif/i.test(font) ? "times" : "helvetica";

export async function downloadEpkPdf(page: any, pageUrl: string, style: EpkPdfStyle) {
  const { default: jsPDF } = await import("jspdf");
  const epk = withEpkDefaults(page.epk);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36, CW = W - 2 * M, PAD = 16, R = 10, GAP = 10;
  const BOTTOM = H - 48;
  const text = parseColor(style.textColor, "#ffffff");
  const accent = parseColor(style.linksColor, "#2563eb");
  const card = parseColor(style.cardColor, "rgba(255,255,255,0.1)");
  const family = bodyFamily(style.font);
  try { await document.fonts?.load(`800 32px ${style.font}`); } catch { /* generic family */ }

  // ── Assets ───────────────────────────────────────────────────────────────
  const releases: any[] = Array.isArray(page.epkReleases) ? page.epkReleases : [];
  const videos = Array.from(new Set([page.video, ...epk.videos].filter((v) => isEmbeddableVideo(v)))) as string[];
  const [bgData, photo, galleryImgs, releaseImgs, videoImgs] = await Promise.all([
    pageBackground(W, H),
    loadImg(page.image),
    Promise.all(epk.gallery.map(loadImg)),
    Promise.all(releases.map((r) => loadImg(r.image))),
    Promise.all(videos.map((v) => { const id = getYouTubeId(v); return loadImg(id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ""); })),
  ]);

  // ── Drawing helpers ──────────────────────────────────────────────────────
  const GState = (doc as any).GState;
  const withAlpha = (a: number, fn: () => void) => {
    if (a >= 1) return fn();
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: a, "stroke-opacity": a }));
    fn();
    doc.restoreGraphicsState();
  };
  const paintBg = () => doc.addImage(bgData, "JPEG", 0, 0, W, H, "epk-bg", "FAST");
  const setText = (size: number, weight: "normal" | "bold" | "italic" | "bolditalic" = "normal") => {
    doc.setFont(family, weight).setFontSize(size).setTextColor(...text.rgb);
  };
  const say = (str: string, x: number, y: number, opts: { alpha?: number; align?: "left" | "center" | "right"; charSpace?: number } = {}) =>
    withAlpha(opts.alpha ?? 1, () => doc.text(str, x, y, { baseline: "top", align: opts.align, charSpace: opts.charSpace }));
  const box = (x: number, y: number, w: number, h: number, c = card, r = R) =>
    withAlpha(c.a, () => doc.setFillColor(...c.rgb).roundedRect(x, y, w, h, r, r, "F"));

  // Place a JPEG clipped to a rounded rect, or a circle
  const photoAt = (data: string, x: number, y: number, w: number, h: number, radius: number | "circle") => {
    doc.saveGraphicsState();
    if (radius === "circle") doc.circle(x + w / 2, y + h / 2, Math.min(w, h) / 2, null as any);
    else doc.roundedRect(x, y, w, h, radius, radius, null as any);
    doc.clip().discardPath();
    doc.addImage(data, "JPEG", x, y, w, h);
    doc.restoreGraphicsState();
  };

  let y = M;
  paintBg();
  const newPage = () => { doc.addPage(); paintBg(); y = M; };
  const ensure = (h: number) => { if (y + h > BOTTOM) newPage(); };

  // Section heading in the page font, kept with at least `keep` pt of what follows
  const heading = (label: string, keep = 70) => {
    const img = textImage(label, style.font, 17, 800, text, CW);
    ensure(img.h + 10 + keep);
    doc.addImage(img.data, "PNG", M, y, img.w, img.h);
    y += img.h + 10;
  };

  // A card made of rows; splits across pages between rows, one card per page
  type Row = { h: number; draw: (top: number) => void };
  const flowCard = (rows: Row[], pad = PAD) => {
    let i = 0;
    while (i < rows.length) {
      ensure(pad * 2 + rows[i].h);
      const start = i;
      let h = pad * 2;
      while (i < rows.length && (i === start || y + h + rows[i].h <= BOTTOM)) h += rows[i++].h;
      box(M, y, CW, h);
      let top = y + pad;
      for (let k = start; k < i; k++) { rows[k].draw(top); top += rows[k].h; }
      y += h;
      if (i < rows.length) newPage();
    }
  };
  const textRows = (str: string, size: number, lineH: number, x: number, w: number, weight: "normal" | "bold" | "italic" = "normal", alpha = 1): Row[] => {
    setText(size, weight);
    return (doc.splitTextToSize(str, w) as string[]).map((line) => ({
      h: lineH,
      draw: (top) => { setText(size, weight); say(line, x, top, { alpha }); },
    }));
  };
  const space = (h: number): Row => ({ h, draw: () => {} });

  // Pill buttons (like the page's buttons); wraps onto new lines within w
  type Pill = { label: string; url: string; outline?: boolean };
  const pillRows = (pills: Pill[], x0: number, w: number, center = false): Row[] => {
    const ph = 24;
    doc.setFont(family, "bold").setFontSize(10);
    const widths = pills.map((p) => Math.min(w, doc.getTextWidth(p.label) + 28));
    const lines: number[][] = [[]];
    let lw = 0;
    widths.forEach((pw, i) => {
      if (lw && lw + GAP + pw > w) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push(i);
      lw += (lw ? GAP : 0) + pw;
    });
    return lines.map((idx, li) => ({
      h: ph + (li < lines.length - 1 ? 8 : 0),
      draw: (top) => {
        const total = idx.reduce((s, i) => s + widths[i], 0) + GAP * (idx.length - 1);
        let x = center ? x0 + (w - total) / 2 : x0;
        for (const i of idx) {
          const p = pills[i], pw = widths[i];
          if (p.outline) withAlpha(1, () => doc.setDrawColor(...accent.rgb).setLineWidth(1.5).roundedRect(x, top, pw, ph, 6, 6, "S"));
          else box(x, top, pw, ph, accent, 6);
          doc.setFont(family, "bold").setFontSize(10).setTextColor(...(p.outline ? text.rgb : ([255, 255, 255] as Rgb)));
          const label = (doc.splitTextToSize(p.label, pw - 20) as string[])[0];
          doc.text(label, x + pw / 2, top + ph / 2, { align: "center", baseline: "middle" });
          doc.link(x, top, pw, ph, { url: p.url });
          x += pw + GAP;
        }
      },
    }));
  };

  // Grid of equal cells; ensures each grid row fits on the page
  const grid = <T,>(items: T[], cols: number, cellH: (w: number) => number, draw: (item: T, x: number, top: number, w: number, h: number) => void) => {
    const w = (CW - GAP * (cols - 1)) / cols;
    const h = cellH(w);
    for (let i = 0; i < items.length; i += cols) {
      ensure(h);
      items.slice(i, i + cols).forEach((it, c) => draw(it, M + c * (w + GAP), y, w, h));
      y += h + GAP;
    }
    y += 18 - GAP;
  };

  const bookingHref = epk.bookingEmail ? `mailto:${epk.bookingEmail}?subject=${encodeURIComponent(`Booking inquiry: ${page.name}`)}` : "";

  // ── Profile card: round photo, name, bio, genre · location, buttons ──────
  {
    const photoSize = 72;
    const photoData = photo ? coverJpeg(photo, photoSize, photoSize, 3) : null;
    const nameX = M + PAD + (photoData ? photoSize + 16 : 0);
    const name = textImage(page.name || "", style.font, 28, 900, text, M + CW - PAD - nameX, 16);
    const rows: Row[] = [{
      h: Math.max(photoData ? photoSize : 0, name.h + 22),
      draw: (top) => {
        if (photoData) photoAt(photoData, M + PAD, top, photoSize, photoSize, "circle");
        const ty = top + Math.max(0, ((photoData ? photoSize : 0) - (name.h + 22)) / 2);
        doc.addImage(name.data, "PNG", nameX, ty, name.w, name.h);
        setText(8, "bold");
        say("ELECTRONIC PRESS KIT", nameX, ty + name.h + 6, { alpha: 0.7, charSpace: 2 });
      },
    }];
    if (epk.bio) {
      rows.push(space(14));
      epk.bio.split(/\n\s*\n/).forEach((para, i) => {
        if (i) rows.push(space(8));
        rows.push(...textRows(para.trim(), 11, 16, M + PAD, CW - 2 * PAD));
      });
    }
    const meta = [epk.genre, epk.location].filter(Boolean).join("  ·  ");
    if (meta) rows.push(space(10), ...textRows(meta, 11, 15, M + PAD, CW - 2 * PAD, "bold", 0.85));
    const pills: Pill[] = [];
    if (bookingHref) pills.push({ label: "Booking", url: bookingHref });
    if (epk.pressKitUrl) pills.push({ label: "Press Kit", url: epk.pressKitUrl, outline: true });
    pills.push({ label: "View online EPK", url: pageUrl, outline: true });
    rows.push(space(14), ...pillRows(pills, M + PAD, CW - 2 * PAD));
    flowCard(rows, 18);
    y += 24;
  }

  // ── Highlights ────────────────────────────────────────────────────────────
  if (epk.highlights.length) {
    heading("Highlights");
    const rows: Row[] = [];
    epk.highlights.forEach((h, i) => {
      if (i) rows.push(space(6));
      const lines = textRows(h, 11, 15, M + PAD + 16, CW - 2 * PAD - 16, "bold");
      const first = lines[0];
      lines[0] = { h: first.h, draw: (top) => { box(M + PAD + 2, top + 3.5, 6, 6, accent, 3); first.draw(top); } };
      rows.push(...lines);
    });
    flowCard(rows);
    y += 24;
  }

  // ── Videos: thumbnails with a play button, linked ─────────────────────────
  if (videos.length) {
    heading("Videos", 150);
    grid(videos.map((v, i) => ({ v, img: videoImgs[i] })), 2, (w) => w * 0.5625, ({ v, img }, x, top, w, h) => {
      const data = img ? coverJpeg(img, w, h) : null;
      if (data) photoAt(data, x, top, w, h, R);
      else {
        box(x, top, w, h, { rgb: [0, 0, 0], a: 1 });
        doc.setFont(family, "bold").setFontSize(9).setTextColor(255, 255, 255);
        say(/vimeo/i.test(v) ? "Watch on Vimeo" : "Watch video", x + w / 2, top + h / 2 + 26, { align: "center", alpha: 0.8 });
      }
      withAlpha(0.85, () => doc.setFillColor(...accent.rgb).circle(x + w / 2, top + h / 2, 18, "F"));
      doc.setFillColor(255, 255, 255).triangle(x + w / 2 - 6, top + h / 2 - 9, x + w / 2 - 6, top + h / 2 + 9, x + w / 2 + 10, top + h / 2, "F");
      doc.link(x, top, w, h, { url: v });
    });
    y += 6;
  }

  // ── Live performances: small cards ────────────────────────────────────────
  if (epk.venues.length) {
    heading("Live Performances", 50);
    grid(epk.venues, 3, () => 44, (v, x, top, w, h) => {
      box(x, top, w, h);
      setText(10.5, "bold");
      say((doc.splitTextToSize(v.name, w - 20) as string[])[0], x + 10, top + 10);
      const sub = [v.city, v.date].filter(Boolean).join(" · ");
      if (sub) { setText(9); say((doc.splitTextToSize(sub, w - 20) as string[])[0], x + 10, top + 25, { alpha: 0.75 }); }
    });
    y += 6;
  }

  // ── Press quotes ──────────────────────────────────────────────────────────
  if (epk.pressQuotes.length) {
    heading("Press");
    epk.pressQuotes.forEach((q) => {
      const rows: Row[] = [{
        h: 18,
        draw: (top) => { doc.setFont("times", "bold").setFontSize(28).setTextColor(...text.rgb); say("“", M + PAD, top - 4, { alpha: 0.4 }); },
      }];
      rows.push(...textRows(q.quote, 11.5, 17, M + PAD, CW - 2 * PAD, "italic"));
      if (q.source) {
        rows.push(space(4), {
          h: 14,
          draw: (top) => {
            setText(10, "bold");
            say(`— ${q.source}`, M + PAD, top);
            if (q.url) doc.link(M + PAD, top, doc.getTextWidth(`— ${q.source}`), 12, { url: q.url });
          },
        });
      }
      flowCard(rows);
      y += GAP;
    });
    y += 14;
  }

  // ── Listen: streaming / custom links as buttons ──────────────────────────
  const music = (page.links || []).filter((l: any) => l?.url);
  if (music.length) {
    heading("Listen", 40);
    for (const row of pillRows(music.map((l: any) => ({ label: l.name || "Listen", url: l.url })), M, CW)) {
      ensure(row.h);
      row.draw(y);
      y += row.h;
    }
    y += 24;
  }

  // ── Releases: cover art grid with titles ──────────────────────────────────
  if (releases.length) {
    heading("Releases", 160);
    grid(releases.map((r, i) => ({ r, img: releaseImgs[i] })), 4, (w) => w + 34, ({ r, img }, x, top, w) => {
      const href = r.internal ? `https://www.influanto.com${r.url}` : r.url;
      const data = img ? coverJpeg(img, w, w) : null;
      if (data) photoAt(data, x, top, w, w, R);
      else box(x, top, w, w);
      setText(10, "bold");
      (doc.splitTextToSize(r.title || "", w) as string[]).slice(0, 2).forEach((ln, li) => say(ln, x + w / 2, top + w + 7 + li * 12, { align: "center" }));
      doc.link(x, top, w, w + 30, { url: href });
    });
    y += 6;
  }

  // ── Gallery ───────────────────────────────────────────────────────────────
  const gallery = galleryImgs.map((img) => (img ? coverJpeg(img, 176, 176, 2.5) : null)).filter(Boolean) as string[];
  if (gallery.length) {
    heading("Gallery", 180);
    grid(gallery, 3, (w) => w, (data, x, top, w) => photoAt(data, x, top, w, w, R));
    y += 6;
  }

  // ── Booking & Inquiries ───────────────────────────────────────────────────
  {
    const pills: Pill[] = [];
    if (bookingHref) pills.push({ label: epk.bookingEmail, url: bookingHref });
    if (epk.pressKitUrl) pills.push({ label: "Press Kit / Rider", url: epk.pressKitUrl, outline: true });
    pills.push({ label: "View online EPK", url: pageUrl, outline: true });
    const title = textImage("Booking & Inquiries", style.font, 15, 800, text, CW - 2 * PAD);
    flowCard([
      { h: title.h + 12, draw: (top) => doc.addImage(title.data, "PNG", M + (CW - title.w) / 2, top, title.w, title.h) },
      ...pillRows(pills, M + PAD, CW - 2 * PAD, true),
    ], 18);
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    setText(8);
    say(`${page.name} — Electronic Press Kit`, M, H - 30, { alpha: 0.6 });
    say("Made with influanto.com", W / 2, H - 30, { alpha: 0.6, align: "center" });
    say(`${i} / ${pages}`, W - M, H - 30, { alpha: 0.6, align: "right" });
  }

  doc.save(`${sanitizeFilename(page.name || "") || "artist"}_EPK.pdf`);
}

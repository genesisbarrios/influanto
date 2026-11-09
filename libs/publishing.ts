// Shared split-sheet publishing details: one row per writer, with their IPI,
// PRO, and publisher (+ publisher IPI). Used by the dashboard editor, the public
// generator, the signing page, PDFs, emails and the collaborator-contact sync,
// so every surface reads and writes the same shape.
import type jsPDF from "jspdf";

export interface PublishingRow {
  contributorName: string; // writer name (kept as contributorName for existing sheets)
  writerIpi: string;
  pro: string;
  publisher: string;
  publisherIpi: string;
  percent: string;
}

export const BLANK_PUBLISHING_ROW: PublishingRow = {
  contributorName: "", writerIpi: "", pro: "", publisher: "", publisherIpi: "", percent: "",
};

// Performing rights organizations, most common first. "Other" lets users type one in.
export const PRO_OPTIONS = [
  "ASCAP", "BMI", "SESAC", "GMR", "SOCAN", "PRS for Music", "APRA AMCOS", "GEMA", "SACEM",
  "SGAE", "SIAE", "SACM", "SADAIC", "SAYCO", "UBC", "ABRAMUS", "IMRO", "SAMRO", "COSON",
  "BUMA/STEMRA", "SABAM", "SUISA", "AKM", "STIM", "KODA", "TONO", "Teosto", "JASRAC",
  "KOMCA", "CASH", "IPRS", "MCSC", "Not affiliated",
];

const s = (v: unknown) => String(v ?? "").trim();

// IPI name numbers are 9–11 digits; people often paste them with spaces or dashes.
export const cleanIpi = (v: unknown) => s(v).replace(/[^\d]/g, "");

export function ipiWarning(v: unknown): string | null {
  const raw = s(v);
  if (!raw) return null;
  const digits = cleanIpi(raw);
  return /^\d{9,11}$/.test(digits) ? null : "IPI numbers are 9–11 digits";
}

export function normalizePublishingRow(p: any): PublishingRow {
  return {
    contributorName: s(p?.contributorName),
    writerIpi: cleanIpi(p?.writerIpi),
    pro: s(p?.pro),
    publisher: s(p?.publisher),
    publisherIpi: cleanIpi(p?.publisherIpi),
    percent: s(p?.percent).replace(/%$/, ""),
  };
}

export const hasPublishingData = (p: any) =>
  !!(s(p?.contributorName) || s(p?.writerIpi) || s(p?.pro) || s(p?.publisher) || s(p?.publisherIpi) || s(p?.percent));

// Escape for HTML emails.
export const escapeHtml = (v: unknown) =>
  s(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── PDF ─────────────────────────────────────────────────────────────────────
// Draws the "Publishing Details" table and returns the new y position.
const COLS: { key: keyof PublishingRow; label: string; x: number; w: number }[] = [
  { key: "contributorName", label: "Writer", x: 10, w: 40 },
  { key: "writerIpi", label: "Writer IPI #", x: 50, w: 27 },
  { key: "pro", label: "PRO", x: 77, w: 26 },
  { key: "publisher", label: "Publisher", x: 103, w: 45 },
  { key: "publisherIpi", label: "Publisher IPI #", x: 148, w: 28 },
  { key: "percent", label: "Pub %", x: 176, w: 24 },
];

export function drawPublishingTable(doc: jsPDF, rows: any[], y: number, pageHeight: number): number {
  const publishing = (rows ?? []).filter(hasPublishingData).map(normalizePublishingRow);
  if (!publishing.length) return y;
  const prevSize = doc.getFontSize();

  y += 6;
  if (y + 20 > pageHeight - 20) { doc.addPage(); y = 20; }
  doc.setFontSize(12); doc.setTextColor(0);
  doc.text("Publishing Details:", 10, y); y += 5;

  const header = () => {
    doc.setFontSize(9);
    doc.setFillColor(243, 244, 246);
    COLS.forEach((c) => doc.rect(c.x, y, c.w, 8, "F"));
    COLS.forEach((c) => doc.text(c.label, c.x + 2, y + 5.5));
    y += 8;
  };
  header();

  publishing.forEach((p) => {
    const cells = COLS.map((c) => {
      const v = c.key === "percent" ? (p.percent ? `${p.percent}%` : "") : p[c.key];
      return doc.splitTextToSize(v || "", c.w - 3) as string[];
    });
    const h = Math.max(1, ...cells.map((l) => l.length)) * 5 + 3;
    if (y + h > pageHeight - 20) { doc.addPage(); y = 20; header(); }
    COLS.forEach((c, i) => {
      doc.rect(c.x, y, c.w, h);
      doc.text(cells[i], c.x + 2, y + 5.5);
    });
    y += h;
  });

  doc.setFontSize(prevSize);
  return y;
}

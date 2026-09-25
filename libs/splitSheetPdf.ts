// Shared split-sheet PDF layout — used both client-side (instant download on
// the sign page) and server-side (emailed copies), so the two never drift
// apart. jsPDF's core drawing calls (text/rect/addImage with an explicit
// format) work identically in the browser and in Node.
import jsPDF from "jspdf";
import { sanitizeFilename } from "@/libs/urls";

export interface SplitSheetPdfContributor {
  name: string;
  role: string;
  ownership: string;
  contact: string;
  signature: string;
  signatureDate: string;
}
export interface SplitSheetPdfPublishing {
  contributorName: string;
  publisher: string;
  percent: string;
}
export interface SplitSheetPdfData {
  title: string;
  date: string;
  artists: string;
  stateCountry: string;
  contributors: SplitSheetPdfContributor[];
  publishing: SplitSheetPdfPublishing[];
}

export function buildSplitSheetPdf(
  sheet: SplitSheetPdfData,
  overrideSignature?: { name: string; data: string }
): jsPDF {
  const doc = new jsPDF();
  const contributors = sheet.contributors ?? [];
  const publishing = sheet.publishing ?? [];
  const ph = doc.internal.pageSize.getHeight();
  let y = 0;

  doc.setFontSize(10); doc.setTextColor(100);
  const brand = "influanto";
  doc.text(brand, doc.internal.pageSize.getWidth() - doc.getTextWidth(brand) - 10, 10);
  doc.setFontSize(16); doc.setTextColor(0);
  doc.text("SPLIT SHEET AGREEMENT", 10, 15);
  doc.setFontSize(12);
  doc.text(`Song Title: ${sheet.title}`, 10, 30);
  doc.text(`Date: ${sheet.date}`, 10, 40);
  doc.text(`Artist(s): ${sheet.artists}`, 10, 50);
  doc.text("Primary Contributors:", 10, 60);
  y = 65;

  const headers = () => {
    doc.setFillColor(243, 244, 246);
    [[10,40],[50,50],[100,15],[115,75]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
    doc.text("Name",12,y+6); doc.text("Role",52,y+6); doc.text("Own%",102,y+6); doc.text("Contact",117,y+6);
    y += 8;
  };
  headers();

  contributors.forEach(c => {
    const h = Math.max(Math.ceil((c.name||"").length/18), Math.ceil((c.role||"").length/25), Math.ceil((c.contact||"").length/32), 1) * 8;
    if (y + h > ph - 20) { doc.addPage(); y = 20; headers(); }
    [[10,40],[50,50],[100,15],[115,75]].forEach(([x,w]) => doc.rect(x, y, w, h));
    doc.text(c.name||"",12,y+6,{maxWidth:38}); doc.text(c.role||"",52,y+6,{maxWidth:48});
    doc.text(c.ownership ? `${c.ownership}%`:"",102,y+6); doc.text(c.contact||"",117,y+6,{maxWidth:73});
    y += h;
  });

  if (publishing.length) {
    y += 6; if (y+20 > ph-20) { doc.addPage(); y=20; }
    doc.text("Publishing Details:", 10, y); y += 5;
    doc.setFillColor(243,244,246);
    [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
    doc.text("Contributor",12,y+6); doc.text("Publisher",72,y+6); doc.text("%",132,y+6); y += 8;
    publishing.forEach(p => {
      const h = Math.max(Math.ceil((p.contributorName||"").length/30), Math.ceil((p.publisher||"").length/30), 1) * 8;
      if (y+h > ph-20) { doc.addPage(); y=20; }
      [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, h));
      doc.text(p.contributorName||"",12,y+6,{maxWidth:58}); doc.text(p.publisher||"",72,y+6,{maxWidth:58});
      doc.text(p.percent ? `${p.percent}%`:"",132,y+6); y += h;
    });
  }

  // Signatures
  y += 8; if (y+20 > ph-20) { doc.addPage(); y=20; }
  doc.text("Signatures:", 10, y); y += 5;
  [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, 8, "F"));
  doc.text("Name",12,y+6); doc.text("Signature",72,y+6); doc.text("Date",132,y+6); y += 8;

  contributors.forEach(c => {
    const h = 20; if (y+h > ph-20) { doc.addPage(); y=20; }
    [[10,60],[70,60],[130,60]].forEach(([x,w]) => doc.rect(x, y, w, h));
    doc.text(c.name||"",12,y+6,{maxWidth:58});
    const sigData = overrideSignature && (c.name||"").toLowerCase() === overrideSignature.name.toLowerCase()
      ? overrideSignature.data
      : c.signature;
    if (sigData) { try { doc.addImage(sigData,"PNG",72,y+2,56,h-4); } catch { /* malformed signature data — skip the image */ } }
    const sigDate = overrideSignature && (c.name||"").toLowerCase() === overrideSignature.name.toLowerCase()
      ? new Date().toLocaleDateString("en-US")
      : c.signatureDate;
    doc.text(sigDate||"",132,y+6,{maxWidth:58}); y += h;
  });

  // Agreement terms (matches the on-screen terms)
  y += 10; if (y+30 > ph-20) { doc.addPage(); y=20; }
  doc.setFontSize(12); doc.setTextColor(0);
  doc.text("Agreement Terms:", 10, y); y += 6;
  doc.setFontSize(10); doc.setTextColor(60);
  const termsText =
    `Each contributor agrees to the ownership percentages of the composition and master recording specified above. ` +
    `All royalties will be distributed accordingly. Dispute resolution under the laws of ${sheet.stateCountry || "[State/Country]"}. ` +
    `By signing, all parties acknowledge their contributions are accurately reflected.`;
  doc.splitTextToSize(termsText, 190).forEach((line: string) => {
    if (y+6 > ph-20) { doc.addPage(); y=20; }
    doc.text(line, 10, y); y += 6;
  });
  doc.setTextColor(0);

  return doc;
}

export function splitSheetPdfFilename(sheet: { title: string; date?: string }, signed = true): string {
  const filenameParts = [sanitizeFilename(sheet.title || "") || "split-sheet", "splitsheet", "influanto"];
  if (sheet.date) filenameParts.push(sanitizeFilename(sheet.date));
  if (signed) filenameParts.push("signed");
  return `${filenameParts.join("_")}.pdf`;
}

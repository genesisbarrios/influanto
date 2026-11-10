import type { jsPDF } from "jspdf";

// Ownership donut chart + legend for split sheet PDFs. Pure jsPDF vector shapes
// (no canvas), so it works in the browser and on the server (emailed PDFs).
// Colors match the on-screen chart in the dashboard.

const PALETTE = ["#2563eb", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#8b5cf6", "#84cc16"];

export function ownershipSlices(contributors: { name?: string; ownership?: string | number }[] = []) {
  return contributors
    .filter((c) => c?.name)
    .map((c) => ({ name: String(c.name), value: parseFloat(String(c.ownership ?? "").replace("%", "")) || 0 }))
    .filter((c) => c.value > 0);
}

// Draws "Ownership Split:" + the chart starting at y; returns the y below it.
// Laid out like the on-screen chart: a centered donut, each slice labelled
// "Name 50%" beside it in its color, and a legend underneath where a colored
// dot shows which slice each name is.
export function drawOwnershipPie(doc: jsPDF, contributors: { name?: string; ownership?: string | number }[], y: number): number {
  const slices = ownershipSlices(contributors);
  if (!slices.length) return y;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const r = 24;
  const labelGap = 5; // label distance outside the donut
  const color = (i: number) => PALETTE[i % PALETTE.length];

  // Legend rows (wrapped, centered) are measured first so the block fits on the page
  doc.setFontSize(9);
  const legendItems = slices.map((s) => `${s.name}`);
  const itemW = legendItems.map((t) => Math.min(doc.getTextWidth(t), 70) + 9);
  const rows: number[][] = [[]];
  let rowW = 0;
  itemW.forEach((w, i) => {
    if (rowW + w > 180 && rows[rows.length - 1].length) { rows.push([]); rowW = 0; }
    rows[rows.length - 1].push(i); rowW += w;
  });
  const legendHeight = rows.length * 6;

  const needed = 6 + 2 * (r + labelGap + 6) + legendHeight + 6;
  y += 10;
  if (y + needed > pageHeight - 20) { doc.addPage(); y = 20; }

  doc.setFontSize(12); doc.setTextColor(0);
  doc.text("Ownership Split:", 10, y);
  y += 6;

  const cx = pageWidth / 2, cy = y + r + labelGap + 6;
  const total = slices.reduce((s, x) => s + x.value, 0);
  let angle = -Math.PI / 2; // start at 12 o'clock, clockwise like the screen chart
  const mids: number[] = [];
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  slices.forEach((s, i) => {
    const sweep = (s.value / total) * Math.PI * 2;
    mids.push(angle + sweep / 2);
    // Polygon: center → points along the arc (~2° apart) → back to center
    const steps = Math.max(2, Math.ceil((sweep * 180) / Math.PI / 2));
    const pts: [number, number][] = [[cx, cy]];
    for (let k = 0; k <= steps; k++) {
      const a = angle + (sweep * k) / steps;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const deltas = pts.slice(1).map((p, k) => [p[0] - pts[k][0], p[1] - pts[k][1]]);
    doc.setFillColor(color(i));
    doc.lines(deltas, cx, cy, [1, 1], "FD", true);
    angle += sweep;
  });
  // Donut hole
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, r * 0.45, "F");

  // Slice labels: colored dot + "Name 50%" just outside the middle of each slice.
  // Labels on the same side are nudged apart so small slices don't overlap.
  doc.setFontSize(9);
  const labels = slices.map((s, i) => {
    const a = mids[i];
    const right = Math.cos(a) >= 0;
    return { i, right, x: cx + (r + labelGap) * Math.cos(a), y: cy + (r + labelGap) * Math.sin(a), text: `${s.name} ${s.value}%` };
  });
  const minGap = 4.5;
  [true, false].forEach((side) => {
    const group = labels.filter((l) => l.right === side).sort((a, b) => a.y - b.y);
    for (let k = 1; k < group.length; k++) {
      if (group[k].y - group[k - 1].y < minGap) group[k].y = group[k - 1].y + minGap;
    }
  });
  // A nudged label stays on the ring around the donut (so it never covers it)
  const ring = r + labelGap;
  labels.forEach((l) => {
    const dy = l.y - cy;
    const dx = Math.abs(dy) < ring ? Math.sqrt(ring * ring - dy * dy) : 0;
    l.x = l.right ? cx + Math.max(dx, 1) : cx - Math.max(dx, 1);
  });
  labels.forEach((l) => {
    const maxW = (l.right ? pageWidth - 10 - l.x : l.x - 10) - 2;
    let text = l.text;
    while (text.length > 4 && doc.getTextWidth(text) > maxW) text = text.slice(0, -2);
    if (text !== l.text) text = text.replace(/.$/, "…");
    const w = doc.getTextWidth(text);
    doc.setTextColor(color(l.i));
    doc.text(text, l.right ? l.x : l.x - w, l.y + 1);
  });

  // Legend under the chart: colored dot + name, centered rows
  let ly = cy + r + labelGap + 8;
  doc.setFontSize(9);
  rows.forEach((row) => {
    const width = row.reduce((sum, i) => sum + itemW[i], 0);
    let lx = (pageWidth - width) / 2;
    row.forEach((i) => {
      doc.setFillColor(color(i));
      doc.circle(lx + 1.5, ly - 1.1, 1.5, "F");
      doc.setTextColor(color(i));
      doc.text(legendItems[i], lx + 4.5, ly, { maxWidth: 70 });
      lx += itemW[i];
    });
    ly += 6;
  });

  if (Math.round(total) !== 100) {
    doc.setFontSize(8.5); doc.setTextColor(180, 40, 40);
    const note = `Note: ownership adds up to ${total}%, not 100%.`;
    doc.text(note, (pageWidth - doc.getTextWidth(note)) / 2, ly);
    ly += 5;
  }
  doc.setTextColor(0);
  return ly + 2;
}

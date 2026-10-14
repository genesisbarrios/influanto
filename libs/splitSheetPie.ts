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
export function drawOwnershipPie(doc: jsPDF, contributors: { name?: string; ownership?: string | number }[], y: number): number {
  const slices = ownershipSlices(contributors);
  if (!slices.length) return y;
  const pageHeight = doc.internal.pageSize.getHeight();
  const r = 26;
  const legendHeight = slices.length * 7;
  const needed = 10 + Math.max(2 * r, legendHeight) + 8;
  y += 10;
  if (y + needed > pageHeight - 20) { doc.addPage(); y = 20; }

  doc.setFontSize(12); doc.setTextColor(0);
  doc.text("Ownership Split:", 10, y);
  y += 6;

  const cx = 10 + r, cy = y + r;
  const total = slices.reduce((s, x) => s + x.value, 0);
  let angle = -Math.PI / 2; // start at 12 o'clock
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  slices.forEach((s, i) => {
    const sweep = (s.value / total) * Math.PI * 2;
    // Polygon: center → points along the arc (~2° apart) → back to center
    const steps = Math.max(2, Math.ceil((sweep * 180) / Math.PI / 2));
    const pts: [number, number][] = [[cx, cy]];
    for (let k = 0; k <= steps; k++) {
      const a = angle + (sweep * k) / steps;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const deltas = pts.slice(1).map((p, k) => [p[0] - pts[k][0], p[1] - pts[k][1]]);
    doc.setFillColor(PALETTE[i % PALETTE.length]);
    doc.lines(deltas, cx, cy, [1, 1], "FD", true);
    angle += sweep;
  });
  // Donut hole
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, r * 0.45, "F");

  // Legend
  const lx = cx + r + 14;
  let ly = cy - legendHeight / 2 + 4;
  doc.setFontSize(10);
  slices.forEach((s, i) => {
    doc.setFillColor(PALETTE[i % PALETTE.length]);
    doc.rect(lx, ly - 3.2, 4, 4, "F");
    doc.setTextColor(30);
    doc.text(`${s.name} — ${s.value}%`, lx + 7, ly, { maxWidth: 190 - (lx + 7) });
    ly += 7;
  });
  if (Math.round(total) !== 100) {
    doc.setFontSize(8.5); doc.setTextColor(180, 40, 40);
    doc.text(`Note: ownership adds up to ${total}%, not 100%.`, lx, ly + 2);
  }
  doc.setTextColor(0);
  return cy + Math.max(r, legendHeight / 2) + 8;
}

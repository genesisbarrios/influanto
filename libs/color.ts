// Helpers for color controls that pair a hex <input type="color"> with an
// opacity slider. Values are stored as a plain hex when fully opaque, or as
// an rgba() string when partially transparent — both are valid CSS colors,
// so no schema change is needed (the field stays a text column).

export function parseColorValue(value: string | null | undefined, fallbackHex = "#ffffff"): { hex: string; opacity: number } {
  if (!value) return { hex: fallbackHex, opacity: 100 };
  const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (m) {
    const hex = "#" + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("");
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    return { hex, opacity: Math.round(a * 100) };
  }
  if (/^#?[0-9a-fA-F]{6}$/.test(value)) return { hex: value.startsWith("#") ? value : "#" + value, opacity: 100 };
  return { hex: fallbackHex, opacity: 100 };
}

export function combineColor(hex: string, opacity: number): string {
  if (opacity >= 100) return hex;
  const h = hex.replace("#", "");
  const parts = h.match(/.{2}/g);
  if (!parts) return hex;
  const [r, g, b] = parts.map((x) => parseInt(x, 16));
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
}

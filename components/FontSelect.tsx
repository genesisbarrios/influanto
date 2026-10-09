"use client";
import { useEffect, type CSSProperties } from "react";
import { FONT_OPTIONS, loadAllFonts } from "@/libs/fonts";

// Font dropdown shared by the Link in Bio, Release Page, and EPK editors.
// Each option previews in its own font.
export default function FontSelect({
  value,
  onChange,
  className = "input input-sm w-40",
  style,
}: {
  value: string | undefined;
  onChange: (font: string) => void;
  className?: string;
  style?: CSSProperties;
}) {
  useEffect(() => { loadAllFonts(); }, []);
  const current = value || "sans-serif";
  const known = FONT_OPTIONS.some((f) => f.value === current);

  return (
    <select value={current} onChange={(e) => onChange(e.target.value)} className={className} style={{ fontFamily: current, ...style }}>
      {!known && <option value={current}>{current}</option>}
      {FONT_OPTIONS.map((f) => (
        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
      ))}
    </select>
  );
}

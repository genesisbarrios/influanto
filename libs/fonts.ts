// Fonts offered in the Link in Bio / Release Page / EPK style dropdowns.
// `value` is the CSS font-family stored on the page; Google fonts also carry
// the family spec used to load them from Google Fonts on the public page.

export interface FontOption { label: string; value: string; google?: string }

export const FONT_OPTIONS: FontOption[] = [
  { label: "Sans Serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Cursive", value: "cursive" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Inter", value: "'Inter', sans-serif", google: "Inter:wght@400;700" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", google: "Montserrat:wght@400;700" },
  { label: "Poppins", value: "'Poppins', sans-serif", google: "Poppins:wght@400;700" },
  { label: "Roboto", value: "'Roboto', sans-serif", google: "Roboto:wght@400;700" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif", google: "Space+Grotesk:wght@400;700" },
  { label: "Syne", value: "'Syne', sans-serif", google: "Syne:wght@400;700" },
  { label: "Unbounded", value: "'Unbounded', sans-serif", google: "Unbounded:wght@400;700" },
  { label: "Oswald", value: "'Oswald', sans-serif", google: "Oswald:wght@400;700" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif", google: "Bebas+Neue" },
  { label: "Anton", value: "'Anton', sans-serif", google: "Anton" },
  { label: "Archivo Black", value: "'Archivo Black', sans-serif", google: "Archivo+Black" },
  { label: "Righteous", value: "'Righteous', sans-serif", google: "Righteous" },
  { label: "Orbitron", value: "'Orbitron', sans-serif", google: "Orbitron:wght@400;700" },
  { label: "Playfair Display", value: "'Playfair Display', serif", google: "Playfair+Display:wght@400;700" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif", google: "DM+Serif+Display" },
  { label: "Abril Fatface", value: "'Abril Fatface', serif", google: "Abril+Fatface" },
  { label: "Lora", value: "'Lora', serif", google: "Lora:wght@400;700" },
  { label: "Space Mono", value: "'Space Mono', monospace", google: "Space+Mono:wght@400;700" },
  { label: "Courier Prime", value: "'Courier Prime', monospace", google: "Courier+Prime:wght@400;700" },
  { label: "Press Start 2P", value: "'Press Start 2P', monospace", google: "Press+Start+2P" },
  { label: "Permanent Marker", value: "'Permanent Marker', cursive", google: "Permanent+Marker" },
  { label: "Pacifico", value: "'Pacifico', cursive", google: "Pacifico" },
  { label: "Caveat", value: "'Caveat', cursive", google: "Caveat:wght@400;700" },
];

const GOOGLE_CSS = "https://fonts.googleapis.com/css2";

function injectStylesheet(id: string, href: string) {
  if (typeof document === "undefined" || document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

// Load the Google font behind a stored font-family value (no-op for generic families)
export function loadFont(value: string | null | undefined) {
  const opt = FONT_OPTIONS.find((f) => f.value === value);
  if (opt?.google) injectStylesheet(`gf-${opt.google}`, `${GOOGLE_CSS}?family=${opt.google}&display=swap`);
}

// Load every Google font at once so the dropdown can preview them
export function loadAllFonts() {
  const families = FONT_OPTIONS.filter((f) => f.google).map((f) => `family=${f.google}`).join("&");
  injectStylesheet("gf-all-fonts", `${GOOGLE_CSS}?${families}&display=swap`);
}

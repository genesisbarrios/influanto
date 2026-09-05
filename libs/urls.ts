// Normalizes a user-entered URL so it always resolves as absolute.
// A bare domain like "instagram.com/me" renders fine as text but is
// useless in an <a href> — the browser treats it as a relative path
// against the current page. This prepends https:// whenever no
// scheme is present, and blocks dangerous schemes like javascript:.
export function normalizeUrl(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ""; // unknown/unsafe scheme (e.g. javascript:)
  return `https://${u}`;
}

// Bandcamp artist links use a subdomain (artist.bandcamp.com), not a path
// like most platforms (instagram.com/artist) — so a bare handle needs its
// own domain built, not just a protocol prepended. Also accepts a full
// bandcamp.com URL or an artist's custom domain unchanged (just normalized).
export function normalizeBandcampLink(value: string): string {
  let v = String(value ?? "").trim().replace(/\s+/g, "");
  if (!v) return "";
  v = v.replace(/^@/, "");
  // Already a URL or a domain (bandcamp.com or a custom domain) — keep as-is.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) || v.includes(".")) {
    return normalizeUrl(v);
  }
  // Bare handle — build the artist's bandcamp subdomain.
  const handle = v.split(/[\/?#]/)[0];
  return handle ? `https://${handle}.bandcamp.com` : "";
}

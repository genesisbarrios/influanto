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

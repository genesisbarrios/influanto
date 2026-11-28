// Fields placed on a document's pages: where a signer signs, or a box of text
// (filled in by a signer when they sign, or by the sender before sending).
// Positions are fractions of the page (0-1, from the top-left corner), so they
// line up whatever size the page is drawn at.

export type FieldType = "signature" | "text";

export type DocField = {
  id: string;
  type: FieldType;
  page: number; // 1-based
  x: number;
  y: number;
  w: number;
  h: number;
  /** the signer's email, or "me" for text the sender fills in before sending */
  assignee: string;
  label?: string;
  /** text the sender filled in (assignee "me") */
  value?: string;
};

export const MAX_FIELDS = 100;
export const MAX_FIELD_TEXT = 300;

export const DEFAULT_SIZE: Record<FieldType, { w: number; h: number }> = {
  signature: { w: 0.3, h: 0.07 },
  text: { w: 0.3, h: 0.04 },
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Checks fields sent from the browser. Returns the cleaned list, or an error.
 * `signers` are the document's signer emails (lowercase).
 */
export function cleanFields(input: unknown, pageCount: number, signers: string[]): { fields: DocField[] } | { error: string } {
  if (!Array.isArray(input)) return { fields: [] };
  if (input.length > MAX_FIELDS) return { error: `A document can have up to ${MAX_FIELDS} fields` };
  const out: DocField[] = [];
  for (const f of input as any[]) {
    const type: FieldType = f?.type === "text" ? "text" : f?.type === "signature" ? "signature" : (null as any);
    if (!type) return { error: "Unknown field type" };
    const page = Math.round(num(f.page));
    if (!(page >= 1 && page <= Math.max(1, pageCount))) return { error: "A field is on a page that doesn't exist" };
    const w = clamp01(num(f.w)), h = clamp01(num(f.h));
    const x = clamp01(num(f.x)), y = clamp01(num(f.y));
    if (![x, y, w, h].every(Number.isFinite) || w < 0.01 || h < 0.01) return { error: "A field has a bad size" };
    const assignee = String(f.assignee || "").trim().toLowerCase();
    if (assignee === "me") {
      if (type !== "text") return { error: "Only text fields can be filled in by you" };
    } else if (!signers.includes(assignee)) {
      return { error: "Every field needs to be assigned to one of the signers" };
    }
    const value = assignee === "me" ? String(f.value || "").slice(0, MAX_FIELD_TEXT) : undefined;
    if (assignee === "me" && !value?.trim()) return { error: "Fill in the text fields assigned to you, or remove them" };
    out.push({
      id: String(f.id || "").replace(/[^\w-]/g, "").slice(0, 40) || Math.random().toString(36).slice(2, 10),
      type,
      page,
      x: Math.min(x, 1 - w),
      y: Math.min(y, 1 - h),
      w,
      h,
      assignee,
      label: String(f.label || "").slice(0, 60) || undefined,
      ...(value !== undefined ? { value } : {}),
    });
  }
  return { fields: out };
}

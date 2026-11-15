// Split sheet math shared by the editor, the PDFs, the signing flow and
// analytics, so they all agree on "fully signed" and on when the master and
// publishing splits differ. Safe to import on the client.

type ContributorLike = { name?: string; ownership?: string | number; signature?: string; contact?: string };
type PublishingLike = { contributorName?: string; percent?: string | number };

export type Slice = { name: string; value: number };

const pct = (v: unknown) => parseFloat(String(v ?? "").replace("%", "")) || 0;
const key = (name: string) => name.trim().toLowerCase();

/** Master (recording) ownership per contributor. */
export function masterSlices(contributors: ContributorLike[] = []): Slice[] {
  return contributors
    .filter((c) => c?.name?.trim())
    .map((c) => ({ name: String(c.name).trim(), value: pct(c.ownership) }))
    .filter((s) => s.value > 0);
}

/** Publishing (composition) share per writer, summed when a writer has several rows. */
export function publishingSlices(publishing: PublishingLike[] = []): Slice[] {
  const byWriter = new Map<string, Slice>();
  for (const p of publishing) {
    const name = String(p?.contributorName ?? "").trim();
    const value = pct(p?.percent);
    if (!name || value <= 0) continue;
    const existing = byWriter.get(key(name));
    if (existing) existing.value += value;
    else byWriter.set(key(name), { name, value });
  }
  return Array.from(byWriter.values());
}

/**
 * True only when publishing %s are filled in and don't match the master %s
 * (then the sheet shows a second, publishing pie). When every publishing
 * writer matches a contributor by name, compare person by person; otherwise
 * (a renamed or unnamed row) compare the percentages themselves, so identical
 * splits always get a single pie. Values less than 0.1% apart count as equal (rounding).
 */
export function splitsDiffer(contributors: ContributorLike[] = [], publishing: PublishingLike[] = []): boolean {
  const pub = publishingSlices(publishing);
  const unnamedPub = publishing.filter((p) => !String(p?.contributorName ?? "").trim() && pct(p?.percent) > 0).map((p) => pct(p.percent));
  if (!pub.length && !unnamedPub.length) return false;
  const masterList = masterSlices(contributors);
  const master = new Map(masterList.map((s) => [key(s.name), s.value]));
  const same = (a: number, b: number) => Math.abs(a - b) < 0.1;

  if (!unnamedPub.length && pub.length === master.size && pub.every((s) => master.has(key(s.name)))) {
    return pub.some((s) => !same(master.get(key(s.name))!, s.value));
  }
  const a = masterList.map((s) => s.value).sort((x, y) => x - y);
  const b = [...pub.map((s) => s.value), ...unnamedPub].sort((x, y) => x - y);
  return a.length !== b.length || a.some((v, i) => !same(v, b[i]));
}

/** Signatures across every contributor on the sheet, the owner included. */
export function signatureProgress(contributors: ContributorLike[] = []) {
  const named = contributors.filter((c) => c?.name?.trim());
  return { signed: named.filter((c) => !!c.signature).length, total: named.length };
}

export function isFullySigned(contributors: ContributorLike[] = []) {
  const { signed, total } = signatureProgress(contributors);
  return total > 0 && signed === total;
}

/** Email addresses found in contributor contact fields (which may also hold phones or handles). */
export function contributorEmails(contributors: ContributorLike[] = []): string[] {
  const out: string[] = [];
  for (const c of contributors) {
    for (const m of String(c?.contact ?? "").match(/[^\s@,;<>()]+@[^\s@,;<>()]+\.[a-z]{2,}/gi) ?? []) out.push(m.toLowerCase());
  }
  return out;
}

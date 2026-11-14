// Custom domains for Pro accounts: a user points their own domain (e.g.
// links.genwav.xyz) at Influanto and it serves their Link in Bio. Domains are
// attached to the Vercel project through the Vercel API, which also issues the
// SSL certificate once DNS is in place.

// Vercel Hobby allows 50 domains per project; influanto.com and www take two.
export const CUSTOM_DOMAIN_LIMIT = Number(process.env.CUSTOM_DOMAIN_LIMIT) || 48;

// The records a user adds at their registrar
export const CNAME_TARGET = "cname.vercel-dns.com";
export const A_RECORD_IP = "76.76.21.21";

// Our own hosts — never routed as a custom domain
export function isAppHost(host: string): boolean {
  return (
    host === "influanto.com" ||
    host.endsWith(".influanto.com") ||
    host.endsWith(".vercel.app") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

// "https://Links.Genwav.xyz/path" -> "links.genwav.xyz"; "" when it isn't a usable hostname
export function normalizeDomain(input: unknown): string {
  let s = String(input ?? "").trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].split(":")[0].replace(/\.$/, "");
  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  if (s.length > 253 || !new RegExp(`^(?:${label}\\.)+[a-z]{2,63}$`).test(s)) return "";
  if (isAppHost(s)) return "";
  return s;
}

// A subdomain (links.genwav.xyz) uses a CNAME; a root domain (genwav.xyz) uses an A record.
// Two-part country suffixes like .co.uk are treated as subdomains here, so
// those users are shown the CNAME and Vercel's own check covers the rest.
export function dnsRecordFor(domain: string) {
  const parts = domain.split(".");
  if (parts.length <= 2) return { type: "A", name: "@", value: A_RECORD_IP };
  return { type: "CNAME", name: parts.slice(0, -2).join("."), value: CNAME_TARGET };
}

// ── Vercel API ──────────────────────────────────────────────────────────────

function vercelConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) throw new Error("Custom domains aren't configured (VERCEL_API_TOKEN / VERCEL_PROJECT_ID)");
  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID };
}

async function vercel(path: string, init: { method?: string; body?: string; headers?: Record<string, string> } = {}) {
  const { token, teamId } = vercelConfig();
  const url = `https://api.vercel.com${path}${teamId ? `${path.includes("?") ? "&" : "?"}teamId=${teamId}` : ""}`;
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function addProjectDomain(domain: string) {
  const { projectId } = vercelConfig();
  const r = await vercel(`/v10/projects/${projectId}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  // Already on this project (e.g. a retry) is fine
  if (r.ok || r.body?.error?.code === "domain_already_exists") return;
  if (r.body?.error?.code === "domain_already_in_use") throw new Error("That domain is already connected to another site on Vercel.");
  throw new Error(r.body?.error?.message || "Could not add the domain");
}

export async function removeProjectDomain(domain: string) {
  const { projectId } = vercelConfig();
  const r = await vercel(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`, { method: "DELETE" });
  if (!r.ok && r.status !== 404) throw new Error(r.body?.error?.message || "Could not remove the domain");
}

export interface DomainStatus {
  verified: boolean;     // Vercel accepted ownership and DNS points at us
  // TXT records Vercel asks for when the domain is also used on another Vercel account
  verification: { type: string; domain: string; value: string }[];
}

export async function getDomainStatus(domain: string): Promise<DomainStatus> {
  const { projectId } = vercelConfig();
  const name = encodeURIComponent(domain);
  let project = await vercel(`/v9/projects/${projectId}/domains/${name}`);
  if (project.ok && !project.body?.verified) {
    // Ask Vercel to re-check ownership now instead of waiting for its own retry
    const v = await vercel(`/v9/projects/${projectId}/domains/${name}/verify`, { method: "POST" });
    if (v.ok) project = v;
  }
  const config = await vercel(`/v6/domains/${name}/config`);
  const ownershipOk = !!project.body?.verified;
  const dnsOk = config.ok && config.body?.misconfigured === false;
  return {
    verified: ownershipOk && dnsOk,
    verification: (project.body?.verification ?? []).map((v: any) => ({ type: v.type, domain: v.domain, value: v.value })),
  };
}

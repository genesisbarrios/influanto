"use client";
import { useEffect, useState } from "react";
import apiClient from "@/libs/api";

interface DomainInfo {
  domain: string | null;
  verified?: boolean;
  dns?: { type: string; name: string; value: string };
  verification?: { type: string; domain: string; value: string }[];
  checkError?: string;
}

// Pro: connect your own domain (e.g. links.yourname.com) to your Link in Bio
export default function CustomDomainCard({ hasAccess, textColor, font }: { hasAccess?: boolean; textColor?: string; font?: string }) {
  const [info, setInfo] = useState<DomainInfo | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const r: any = await apiClient.get("/custom-domain");
      setInfo(r.data);
    } catch { setInfo({ domain: null }); }
  };
  useEffect(() => { if (hasAccess) load(); }, [hasAccess]);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true); setError("");
    try { const r: any = await fn(); setInfo(r.data); }
    catch (e: any) { setError(e?.response?.data?.error || e?.message || "Something went wrong"); }
    finally { setBusy(false); }
  };

  const connect = () => run(() => apiClient.post("/custom-domain", { domain: input }));
  const recheck = () => run(() => apiClient.get("/custom-domain"));
  const remove = () => {
    if (!confirm(`Disconnect ${info?.domain}?`)) return;
    run(() => apiClient.delete("/custom-domain"));
  };

  return (
    <div>
      <h2 className="text-base sm:text-xl font-bold mb-1 leading-tight" style={{ color: textColor, fontFamily: font || "inherit" }}>
        Custom domain <span className="badge badge-sm badge-primary align-middle ml-1">Pro</span>
      </h2>

      {!hasAccess ? (
        <p className="text-sm text-gray-500">
          Use your own domain, like <b>links.yourname.com</b>, for your Link in Bio.{" "}
          <a href="/#pricing" className="text-indigo-600 underline">Upgrade to Pro</a>
        </p>
      ) : !info ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !info.domain ? (
        <>
          <p className="text-sm text-gray-500 mb-2">Use your own domain for your Link in Bio. A subdomain like <b>links.yourname.com</b> is easiest.</p>
          <div className="flex gap-2 flex-wrap">
            <input
              className="input input-sm input-bordered flex-1 min-w-[200px]"
              placeholder="links.yourname.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) connect(); }}
            />
            <button type="button" className="btn btn-sm btn-primary" disabled={busy || !input.trim()} onClick={connect}>
              {busy ? "Connecting…" : "Connect"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <a href={`https://${info.domain}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 underline break-all">{info.domain}</a>
            {info.verified
              ? <span className="badge badge-sm badge-success text-white">Live</span>
              : <span className="badge badge-sm badge-warning">Waiting for DNS</span>}
          </div>

          {!info.verified && info.dns && (
            <div className="text-sm text-gray-600 mb-2">
              <p className="mb-1">Add this record where you manage your domain (GoDaddy, Namecheap, Cloudflare…):</p>
              <div className="overflow-x-auto">
                <table className="table table-xs bg-gray-50 rounded">
                  <thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead>
                  <tbody>
                    <tr><td>{info.dns.type}</td><td>{info.dns.name}</td><td className="font-mono break-all">{info.dns.value}</td></tr>
                    {(info.verification ?? []).map((v) => (
                      <tr key={v.domain + v.value}><td>{v.type}</td><td className="break-all">{v.domain}</td><td className="font-mono break-all">{v.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-1">DNS changes can take a few minutes (sometimes up to a few hours). We set up HTTPS automatically once it&apos;s found.</p>
            </div>
          )}
          {info.checkError && <p className="text-xs text-red-500 mb-2">{info.checkError}</p>}

          <div className="flex gap-2">
            {!info.verified && <button type="button" className="btn btn-sm" disabled={busy} onClick={recheck}>{busy ? "Checking…" : "Check again"}</button>}
            <button type="button" className="btn btn-sm btn-ghost text-red-600" disabled={busy} onClick={remove}>Disconnect</button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}

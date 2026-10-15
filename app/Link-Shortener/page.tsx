"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolJoinSidebar, { useShowJoinSidebar, toolPaneClass } from "@/components/ToolJoinSidebar";
import AdSlot from "@/components/AdSlot";
import SeoContent from "@/components/SeoContent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck, faTrash, faLink } from "@fortawesome/free-solid-svg-icons";

const SHORT_BASE = "https://www.influanto.com/s/";

type ShortLink = { code: string; url: string; clicks: number; created_at?: string };

export default function LinkShortenerPage() {
  const showSidebar = useShowJoinSidebar();
  const { status } = useSession();
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => { setMissing(new URLSearchParams(window.location.search).has("missing")); }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/short-links").then((r) => (r.ok ? r.json() : null)).then((j) => j?.data && setLinks(j.data)).catch(() => {});
  }, [status]);

  const shorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (status !== "authenticated") { signIn(undefined, { callbackUrl: "/Link-Shortener" }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/short-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, alias }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Couldn't shorten that link");
      setLinks((prev) => [j.data, ...prev]);
      setUrl(""); setAlias("");
      copy(j.data.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(SHORT_BASE + code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
    }).catch(() => {});
  };

  const remove = async (code: string) => {
    if (!confirm("Delete this short link? Anyone using it will stop being redirected.")) return;
    const res = await fetch(`/api/short-links/${code}`, { method: "DELETE" });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.code !== code));
  };

  return (
    <>
      <Suspense><Header /></Suspense>
      <div id="shortener-bg" style={{ display: "flex", flexDirection: "column", minHeight: "80vh", width: "100%" }}>
        <div style={{ background: "#f9fafb", color: "#181b20" }} className={toolPaneClass(showSidebar, "p-6 sm:p-8")}>
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-center">Free Link Shortener</h1>
            <p className="text-center opacity-80 mb-6">Turn long links into short <span className="font-mono">influanto.com/s/…</span> links you can share anywhere — and see how many people click.</p>

            {missing && <p className="mb-4 text-sm text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">That short link doesn&apos;t exist (it may have been deleted).</p>}

            <form onSubmit={shorten} className="bg-white rounded-xl shadow p-4 sm:p-5 space-y-3">
              <label className="block text-sm font-semibold">Long link</label>
              <input type="url" required className="input input-bordered w-full bg-white text-black" placeholder="https://open.spotify.com/track/…" value={url} onChange={(e) => setUrl(e.target.value)} />
              <label className="block text-sm font-semibold">Custom alias <span className="font-normal opacity-60">(optional)</span></label>
              <div className="flex items-stretch rounded-lg border border-gray-300 overflow-hidden bg-white">
                <span className="px-3 flex items-center text-sm text-gray-500 bg-gray-50 border-r border-gray-300 whitespace-nowrap">influanto.com/s/</span>
                <input className="flex-1 min-w-0 px-3 py-2 outline-none text-black bg-white" placeholder="my-new-single" value={alias} onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={40} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="btn btn-primary w-full">
                <FontAwesomeIcon icon={faLink} className="mr-2" />{busy ? "Shortening…" : status === "authenticated" ? "Shorten link" : "Sign up free to shorten"}
              </button>
              {status !== "authenticated" && <p className="text-xs text-center opacity-60">A free account keeps your links safe from spam and lets you track clicks.</p>}
            </form>

            {links.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-bold mb-2">Your links</h2>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l.code} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <a href={SHORT_BASE + l.code} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 break-all">influanto.com/s/{l.code}</a>
                        <p className="text-xs text-gray-500 truncate">{l.url}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{l.clicks} click{l.clicks === 1 ? "" : "s"}</span>
                      <button type="button" onClick={() => copy(l.code)} className="btn btn-sm btn-ghost" aria-label="Copy short link"><FontAwesomeIcon icon={copied === l.code ? faCheck : faCopy} /></button>
                      <button type="button" onClick={() => remove(l.code)} className="btn btn-sm btn-ghost text-red-500" aria-label="Delete short link"><FontAwesomeIcon icon={faTrash} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <ToolJoinSidebar show={showSidebar} />
      </div>

      <AdSlot className="max-w-4xl mx-auto px-4 py-6" />
      <SeoContent
        sections={[
          {
            heading: "Short Links for Your Music",
            body: (
              <p>Long streaming, merch, and pre-save links look messy in a bio, a caption, or on a flyer. A short link is easier to share, easier to type, and you can see how many people clicked it. Pair it with a <a href="/qr-code-generator" className="link link-primary">QR code</a> for posters and merch tables.</p>
            ),
          },
        ]}
        faqs={[
          { q: "Is the link shortener free?", a: "Yes. A free Influanto account can create up to 25 short links with click counts. Influanto Pro removes the limit." },
          { q: "Why do I need an account?", a: "Open link shorteners get abused for spam and phishing. Requiring a free account keeps influanto.com links trustworthy, and it lets you see and manage your links." },
          { q: "Can I choose the short link's name?", a: "Yes. Add a custom alias like influanto.com/s/my-new-single, as long as it isn't already taken." },
          { q: "Do short links expire?", a: "No. Your short links keep working until you delete them." },
        ]}
        related={[
          { href: "/qr-code-generator", label: "QR code generator" },
          { href: "/link-in-bio", label: "Link in bio for musicians" },
          { href: "/tools", label: "More free music tools" },
        ]}
      />

      <style>{`
        #shortener-bg { background: #638bcf !important; }
        @media (min-width: 640px) { #shortener-bg { flex-direction: row !important; } }
      `}</style>
      <Footer />
    </>
  );
}

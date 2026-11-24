"use client";

import React, { useEffect, useRef, useState } from "react";
import apiClient from "@/libs/api";
import posthog from "posthog-js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faPaperPlane, faTrash, faDownload, faEye, faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import { openUpgrade } from "@/components/UpgradeModal";

const MAX_MB = 20;
const MAX_SIGNERS = 10;

type Signer = { id: string; name: string; email: string; signed_at: string | null; viewed_at: string | null; last_sent_at: string | null };
type Doc = {
  id: string;
  title: string;
  message: string;
  status: "draft" | "sent" | "completed";
  page_count: number;
  created_at: string;
  completed_at: string | null;
  document_signers: Signer[];
};
type Contact = { id: string; name: string; email: string };

const errorText = (e: any, fallback: string) => e?.response?.data?.error || e?.message || fallback;

async function fileLink(id: string, which: "original" | "signed", download = false) {
  const r = await fetch(`/api/documents/${id}?file=${which}${download ? "&download=1" : ""}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Could not open the file");
  return d as { url: string; filename: string };
}

// Any PDF sent out for e-signature: upload, add signers, track who signed,
// download the signed copy (with a signature certificate page at the end).
export default function Documents() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlertRaw] = useState("");
  const [alertOk, setAlertOk] = useState(false);
  const setAlert = (m: string, ok = false) => { setAlertRaw(m); setAlertOk(ok); };
  const [sendFor, setSendFor] = useState<Doc | null>(null);
  const [preview, setPreview] = useState<Doc | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/documents");
      const d = await r.json();
      if (r.ok) setDocs(d.data ?? []);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
    apiClient.get("/collaborator-contacts").then((r: any) => setContacts(r.data ?? [])).catch(() => {});
  }, []);

  const upload = async (file: File) => {
    setAlert("");
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return setAlert("Choose a PDF file.");
    if (file.size > MAX_MB * 1024 * 1024) return setAlert(`PDFs can be up to ${MAX_MB} MB.`);
    setUploading(true);
    try {
      const u = await fetch("/api/documents/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ size: file.size }) });
      const ud = await u.json();
      if (!u.ok) throw new Error(ud.error || "Upload failed");
      const put = await fetch(ud.uploadUrl, { method: "PUT", headers: { "content-type": "application/pdf", "x-upsert": "true" }, body: file });
      if (!put.ok) throw new Error("Upload failed. Try again.");
      const title = file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
      const c = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, path: ud.path }) });
      const cd = await c.json();
      if (!c.ok) {
        if (cd.upgrade) openUpgrade("documents", cd.error);
        throw new Error(cd.error || "Upload failed");
      }
      setDocs((list) => [cd.data, ...list]);
      setOpen(cd.data.id);
      posthog.capture("document_uploaded", { pages: cd.data.page_count });
      setAlert("Uploaded. Add the people who need to sign.", true);
    } catch (e: any) {
      setAlert(errorText(e, "Upload failed"));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const rename = async (doc: Doc, title: string) => {
    const t = title.trim();
    if (!t || t === doc.title) return;
    setDocs((list) => list.map((d) => (d.id === doc.id ? { ...d, title: t } : d)));
    await fetch(`/api/documents/${doc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t }) }).catch(() => {});
  };

  const remove = async (doc: Doc) => {
    if (!confirm(`Delete "${doc.title}"? Signing links stop working and the files are removed.`)) return;
    const r = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    if (r.ok) setDocs((list) => list.filter((d) => d.id !== doc.id));
    else setAlert("Couldn't delete it. Try again.");
  };

  const download = async (doc: Doc, which: "original" | "signed") => {
    try {
      const { url } = await fileLink(doc.id, which, true);
      window.location.href = url;
    } catch (e: any) {
      setAlert(errorText(e, "Couldn't download it"));
    }
  };

  const badge = (d: Doc) => {
    const signed = d.document_signers.filter((s) => s.signed_at).length;
    const total = d.document_signers.length;
    if (d.status === "completed") return <span className="badge badge-sm badge-success">signed</span>;
    if (!total) return <span className="badge badge-sm badge-ghost">draft</span>;
    return <span className="badge badge-sm badge-info">{signed}/{total} signed</span>;
  };

  return (
    <div className="p-4 bg-white shadow rounded-md text-black">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Documents</h2>
        <div className="ml-auto">
          <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button className="btn btn-primary btn-sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
            <FontAwesomeIcon icon={faFilePdf} /> {uploading ? "Uploading…" : "Upload PDF"}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">Upload any PDF (a contract, a release form, an agreement) and send it to be signed. Everyone gets the signed copy, with a signature certificate on the last page.</p>

      {alert && <div className={`alert mb-4 text-sm ${alertOk ? "alert-success" : "alert-error"}`}>{alert}</div>}

      {!loaded ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
          No documents yet. Upload a PDF to send it for signature.
        </div>
      ) : (
        <ul className="divide-y border rounded-lg">
          {docs.map((d) => (
            <li key={d.id} className="p-3">
              <div className="flex items-start gap-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === d.id ? null : d.id)}>
                  <p className="font-medium truncate">{d.title}</p>
                  <p className="text-xs text-gray-500">
                    {d.page_count ? `${d.page_count} page${d.page_count === 1 ? "" : "s"} · ` : ""}
                    {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </button>
                {badge(d)}
              </div>

              {open === d.id && (
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-medium">
                    Title
                    <input
                      className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white font-normal"
                      defaultValue={d.title}
                      onBlur={(e) => rename(d, e.target.value)}
                    />
                  </label>

                  {d.document_signers.length > 0 && (
                    <ul className="text-sm space-y-1">
                      {d.document_signers.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate">{s.name || s.email} <span className="text-xs text-gray-400">{s.name ? s.email : ""}</span></span>
                          <span className={`text-xs whitespace-nowrap ${s.signed_at ? "text-green-600" : "text-gray-500"}`}>
                            {s.signed_at ? `Signed ${new Date(s.signed_at).toLocaleDateString()}` : s.viewed_at ? "Opened" : s.last_sent_at ? "Sent" : "Not sent"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-xs btn-outline" onClick={() => setPreview(d)}><FontAwesomeIcon icon={faEye} /> Preview</button>
                    {d.status !== "completed" && (
                      <button className="btn btn-xs btn-primary" onClick={() => setSendFor(d)}>
                        <FontAwesomeIcon icon={faPaperPlane} /> {d.document_signers.length ? "Add signers / remind" : "Send for signature"}
                      </button>
                    )}
                    {d.status === "completed" && (
                      <button className="btn btn-xs btn-success" onClick={() => download(d, "signed")}><FontAwesomeIcon icon={faDownload} /> Signed copy</button>
                    )}
                    <button className="btn btn-xs btn-outline" onClick={() => download(d, "original")}><FontAwesomeIcon icon={faDownload} /> Original</button>
                    <button className="btn btn-xs btn-ghost text-red-500 ml-auto" onClick={() => remove(d)}><FontAwesomeIcon icon={faTrash} /> Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {sendFor && (
        <SendDocumentDialog
          doc={sendFor}
          contacts={contacts}
          onClose={() => setSendFor(null)}
          onSent={(msg) => { setSendFor(null); setAlert(msg, true); load(); }}
        />
      )}

      {preview && (
        <PdfPreviewModal
          title={preview.title}
          load={async () => {
            const which = preview.status === "completed" ? "signed" : "original";
            const { url, filename } = await fileLink(preview.id, which);
            const r = await fetch(url);
            if (!r.ok) throw new Error("Could not open the PDF");
            return { blob: await r.blob(), filename };
          }}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function SendDocumentDialog({ doc, contacts, onClose, onSent }: { doc: Doc; contacts: Contact[]; onClose: () => void; onSent: (msg: string) => void }) {
  const already = new Map(doc.document_signers.map((s) => [s.email.toLowerCase(), s]));
  // pending signers are pre-ticked, so this doubles as "remind"
  const [rows, setRows] = useState<{ name: string; email: string }[]>(
    doc.document_signers.filter((s) => !s.signed_at).map((s) => ({ name: s.name, email: s.email }))
  );
  const [message, setMessage] = useState(doc.message || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const has = (email: string) => rows.some((r) => r.email.trim().toLowerCase() === email.toLowerCase());
  const toggleContact = (c: Contact) =>
    setRows((r) => (has(c.email) ? r.filter((x) => x.email.trim().toLowerCase() !== c.email.toLowerCase()) : [...r, { name: c.name, email: c.email }]));
  const update = (i: number, k: "name" | "email", v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const send = async () => {
    setError("");
    const list = rows.filter((r) => r.email.trim());
    if (!list.length) return setError("Add at least one person to sign.");
    setSending(true);
    try {
      const r = await fetch(`/api/documents/${doc.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signers: list, message }),
      });
      const d = await r.json();
      if (!r.ok && r.status !== 207) throw new Error(d.error || "Couldn't send it");
      posthog.capture("document_sent", { signers: list.length });
      onSent(d.errors?.length ? `${d.message}. Some failed: ${d.errors.join("; ")}` : d.message);
    } catch (e: any) {
      setError(e?.message || "Couldn't send it");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col text-black" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">Send for signature</h3>
            <p className="text-sm text-gray-500 truncate">{doc.title}</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {contacts.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">From your contacts</p>
              <div className="flex flex-wrap gap-1.5">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    className={`px-2.5 py-1 rounded-full text-xs border ${has(c.email) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-300"}`}
                    onClick={() => toggleContact(c)}
                  >
                    {c.name || c.email}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium mb-1">Signers</p>
            <div className="space-y-2">
              {rows.map((r, i) => {
                const signed = already.get(r.email.trim().toLowerCase())?.signed_at;
                return (
                  <div key={i} className="flex gap-2">
                    <input className="w-2/5 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white" placeholder="Name" value={r.name} onChange={(e) => update(i, "name", e.target.value)} />
                    <input className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white" placeholder="email@example.com" type="email" value={r.email} onChange={(e) => update(i, "email", e.target.value)} />
                    <button className="text-gray-400 hover:text-red-500 px-1" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label="Remove"><FontAwesomeIcon icon={faXmark} /></button>
                    {signed && <span className="text-xs text-green-600 self-center">signed</span>}
                  </div>
                );
              })}
            </div>
            {rows.length + doc.document_signers.filter((s) => s.signed_at).length < MAX_SIGNERS && (
              <button className="mt-2 text-xs text-indigo-600" onClick={() => setRows((r) => [...r, { name: "", email: "" }])}>
                <FontAwesomeIcon icon={faPlus} /> Add someone
              </button>
            )}
          </div>

          <label className="block text-xs font-medium">
            Message (optional)
            <textarea className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-normal" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Here's the agreement we talked about." />
          </label>
          <p className="text-xs text-gray-400">Each person gets their own signing link by email. People who already got it are sent a reminder.</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-primary" disabled={sending} onClick={send}>
            <FontAwesomeIcon icon={faPaperPlane} /> {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

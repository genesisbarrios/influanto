"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkSlash, faCircleCheck, faDownload } from "@fortawesome/free-solid-svg-icons";
import SignatureCanvas from "@/components/SignatureCanvas";
import { PdfPages } from "@/components/PdfPreviewModal";

type Data = {
  document: { title: string; message: string; pages: number; from: string; fileUrl: string | null; completed: boolean; signed: number; total: number };
  signer: { name: string; email: string; signedAt: string | null };
  consentText: string;
};

// Public page a signer opens from their email: read the PDF, draw a
// signature, type their name, agree to sign electronically.
export default function SignDocumentPage() {
  const token = useParams()?.token as string;
  const [data, setData] = useState<Data | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [viewerFailed, setViewerFailed] = useState(false);
  const [signature, setSignature] = useState("");
  const [typedName, setTypedName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState<{ completed: boolean } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/documents/sign/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "This signing link doesn't work.");
        setData(d);
        setTypedName(d.signer.name || "");
        if (d.document.fileUrl) {
          const f = await fetch(d.document.fileUrl);
          if (f.ok) setBlob(await f.blob());
        }
      })
      .catch((e) => setError(e?.message || "This signing link doesn't work."));
  }, [token]);

  const submit = async () => {
    setFormError("");
    if (!signature) return setFormError("Draw your signature and tap Save Signature.");
    if (typedName.trim().length < 2) return setFormError("Type your full name.");
    if (!consent) return setFormError("Tick the box to agree to sign electronically.");
    setSubmitting(true);
    try {
      const r = await fetch(`/api/documents/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData: signature, typedName: typedName.trim(), consent }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't save your signature.");
      setDone({ completed: !!d.completed });
    } catch (e: any) {
      setFormError(e?.message || "Couldn't save your signature.");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-black">
        <div className="max-w-md text-center">
          <FontAwesomeIcon icon={faLinkSlash} className="text-3xl text-gray-400" />
          <p className="mt-3 font-semibold">{error}</p>
          <p className="mt-1 text-sm text-gray-500">Ask the sender to send it again.</p>
        </div>
      </main>
    );
  }
  if (!data) return <main className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading…</main>;

  const { document: doc, signer } = data;
  const alreadySigned = !!signer.signedAt;

  return (
    <main className="min-h-screen bg-gray-50 text-black pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <p className="text-xs text-gray-500">Powered by <a href="https://influanto.com" className="text-indigo-600">Influanto</a></p>
        <h1 className="mt-2 text-2xl font-bold break-words">{doc.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {doc.from ? <>From <strong>{doc.from}</strong> · </> : null}
          {doc.pages ? `${doc.pages} page${doc.pages === 1 ? "" : "s"} · ` : ""}
          {doc.signed} of {doc.total} signed
        </p>
        {doc.message && <div className="mt-4 rounded-lg border bg-white p-4 text-sm whitespace-pre-wrap">{doc.message}</div>}

        <div className="mt-5 rounded-xl border bg-gray-100 h-[70vh] overflow-hidden">
          {blob && !viewerFailed ? (
            <PdfPages blob={blob} onFail={() => setViewerFailed(true)} />
          ) : doc.fileUrl ? (
            <iframe src={doc.fileUrl} title={doc.title} className="w-full h-full border-0" />
          ) : (
            <p className="p-6 text-sm text-gray-500">The document couldn&apos;t be loaded.</p>
          )}
        </div>
        {doc.fileUrl && (
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-600">
            <FontAwesomeIcon icon={faDownload} /> Open the PDF
          </a>
        )}

        <div className="mt-8 rounded-xl border bg-white p-5">
          {done || alreadySigned ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faCircleCheck} className="text-4xl text-green-500" />
              <p className="mt-3 font-semibold">{alreadySigned && !done ? "You've already signed this document." : "Signed. Thank you!"}</p>
              <p className="mt-1 text-sm text-gray-500">
                {done?.completed || doc.completed
                  ? "Everyone has signed. The signed copy is on its way to your email."
                  : "You'll get the signed copy by email once everyone has signed."}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Sign as {signer.name || signer.email}</h2>
              <p className="text-xs text-gray-500 mb-4">{signer.email}</p>

              <label className="block text-sm font-medium mb-1">Your signature</label>
              {signature ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signature} alt="Your signature" className="h-20 rounded border bg-white" />
                  <button className="text-xs text-gray-500 underline" onClick={() => setSignature("")}>Redo</button>
                </div>
              ) : (
                <SignatureCanvas onSave={setSignature} />
              )}

              <label className="block text-sm font-medium mt-5 mb-1">Type your full name</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                autoComplete="name"
              />

              <label className="mt-5 flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-sm mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>{data.consentText}</span>
              </label>

              {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
              <button className="btn btn-primary w-full mt-5" disabled={submitting} onClick={submit}>
                {submitting ? "Signing…" : "Sign document"}
              </button>
              <p className="mt-2 text-xs text-gray-400 text-center">Your name, email, the time and your IP address are added to a signature certificate at the end of the document.</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

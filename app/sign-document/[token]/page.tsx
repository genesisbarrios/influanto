"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkSlash, faCircleCheck, faDownload } from "@fortawesome/free-solid-svg-icons";
import SignatureCanvas from "@/components/SignatureCanvas";
import { PdfPages } from "@/components/PdfPreviewModal";
import PdfFieldPages from "@/components/PdfFieldPages";
import type { DocField } from "@/libs/documentFields";

type Data = {
  document: { title: string; message: string; pages: number; from: string; fileUrl: string | null; completed: boolean; signed: number; total: number };
  signer: { name: string; email: string; signedAt: string | null };
  fields?: DocField[];
  consentText: string;
};

/** The drawn signature cropped to the ink, so it fills the boxes on the page. */
function trimSignature(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
      let x0 = width, y0 = height, x1 = -1, y1 = -1;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0) return resolve("");
      const pad = 6;
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(width - 1, x1 + pad); y1 = Math.min(height - 1, y1 + pad);
      const out = document.createElement("canvas");
      out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
      out.getContext("2d")!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
      resolve(out.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

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
  const [values, setValues] = useState<Record<string, string>>({});
  const saveSignature = async (d: string) => setSignature(await trimSignature(d));

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
    const missing = (data?.fields ?? []).filter((f) => f.type === "text" && !values[f.id]?.trim());
    if (missing.length) {
      document.getElementById(`field-${missing[0].id}`)?.focus();
      return setFormError(`Fill in ${missing.length === 1 ? "the text field" : `the ${missing.length} text fields`} on the document.`);
    }
    if (!signature) return setFormError("Draw your signature and tap Save Signature.");
    if (typedName.trim().length < 2) return setFormError("Type your full name.");
    if (!consent) return setFormError("Tick the box to agree to sign electronically.");
    setSubmitting(true);
    try {
      const r = await fetch(`/api/documents/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData: signature, typedName: typedName.trim(), consent, values }),
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
  const myFields = !alreadySigned && !done ? data.fields ?? [] : [];

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

        {myFields.length > 0 && (
          <p className="mt-5 text-sm text-indigo-700">
            Fill in the highlighted {myFields.some((f) => f.type === "text") ? "fields" : "boxes"} on the document. Your signature goes in each signature box once you&apos;ve drawn it below.
          </p>
        )}
        <div className="mt-2 rounded-xl border bg-gray-100 h-[70vh] overflow-hidden">
          {blob && !viewerFailed && myFields.length > 0 ? (
            <div className="h-full overflow-y-auto p-2">
              <PdfFieldPages
                blob={blob}
                onFail={() => setViewerFailed(true)}
                overlay={(page) =>
                  myFields.filter((f) => f.page === page).map((f) => {
                    const box = { left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%` };
                    return f.type === "text" ? (
                      <input
                        key={f.id}
                        id={`field-${f.id}`}
                        className="absolute rounded-sm border border-indigo-500 bg-indigo-50/80 px-1 text-[clamp(10px,1.6vw,14px)] text-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400"
                        style={box}
                        placeholder={f.label || "Type here"}
                        maxLength={300}
                        value={values[f.id] || ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                      />
                    ) : (
                      <button
                        key={f.id}
                        type="button"
                        className="absolute flex items-center justify-center rounded-sm border border-indigo-500 bg-indigo-50/80 text-[10px] sm:text-xs font-semibold text-indigo-700"
                        style={box}
                        onClick={() => document.getElementById("signature-pad")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                      >
                        {signature ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={signature} alt="Your signature" className="max-w-full max-h-full object-contain" />
                        ) : (
                          "✍ Sign here"
                        )}
                      </button>
                    );
                  })
                }
              />
            </div>
          ) : blob && !viewerFailed ? (
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

              {/* the document couldn't be drawn: fill the text fields here instead */}
              {(viewerFailed || !blob) && myFields.some((f) => f.type === "text") && (
                <div className="mb-5 space-y-2">
                  {myFields.filter((f) => f.type === "text").map((f, i) => (
                    <label key={f.id} className="block text-sm font-medium">
                      {f.label || `Text field ${i + 1}`} <span className="text-xs text-gray-400 font-normal">(page {f.page})</span>
                      <input
                        id={`field-${f.id}`}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white font-normal"
                        maxLength={300}
                        value={values[f.id] || ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
              )}

              <label id="signature-pad" className="block text-sm font-medium mb-1">Your signature</label>
              {signature ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signature} alt="Your signature" className="h-20 rounded border bg-white" />
                  <button className="text-xs text-gray-500 underline" onClick={() => setSignature("")}>Redo</button>
                </div>
              ) : (
                <SignatureCanvas onSave={saveSignature} />
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

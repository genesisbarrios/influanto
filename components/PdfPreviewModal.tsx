"use client";
import React, { useEffect, useState } from "react";
import type jsPDF from "jspdf";

// Shows a generated PDF in the page, with Download / Open in new tab, so it can
// be checked without downloading it first.
export default function PdfPreviewModal({ build, title, onClose }: {
  build: () => { doc: jsPDF; filename: string };
  title?: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("split-sheet.pdf");
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    try {
      const { doc, filename } = build();
      objectUrl = URL.createObjectURL(doc.output("blob"));
      setUrl(objectUrl);
      setFilename(filename);
    } catch (e: any) {
      setError(e?.message || "Could not build the PDF");
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col text-black" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold truncate">{title || "PDF preview"}</h3>
          <div className="flex gap-2">
            {url && <a className="btn btn-sm btn-primary" href={url} download={filename}>Download</a>}
            {url && <a className="btn btn-sm btn-outline" href={url} target="_blank" rel="noopener noreferrer">Open in new tab</a>}
            <button className="btn btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 rounded-b-xl overflow-hidden">
          {error ? (
            <p className="p-6 text-sm text-red-500">{error}</p>
          ) : url ? (
            <iframe src={url} title={title || "PDF preview"} className="w-full h-full border-0" />
          ) : (
            <p className="p-6 text-sm text-gray-500">Building preview…</p>
          )}
        </div>
      </div>
    </div>
  );
}

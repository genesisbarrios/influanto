"use client";
import React, { useEffect, useRef, useState } from "react";
import type jsPDF from "jspdf";

// Phones show a PDF in an iframe zoomed in (iOS) or not at all (Android), so
// there the pages are drawn with pdf.js instead, fitted to the screen width.
// Loaded from the CDN on first use so it isn't in the main bundle.
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build";
let pdfjsLib: Promise<any> | null = null;
function loadPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = import(/* webpackIgnore: true */ `${PDFJS}/pdf.min.mjs`).then((lib: any) => {
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.mjs`;
      return lib;
    });
    pdfjsLib.catch(() => { pdfjsLib = null; });
  }
  return pdfjsLib;
}

/** Every page of the PDF as an image the width of its container. Calls onFail if it can't. */
export function PdfPages({ blob, onFail }: { blob: Blob; onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lib = await loadPdfjs();
        const pdf = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const width = box.current?.clientWidth || window.innerWidth;
        // sharp enough to pinch-zoom into
        const ratio = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
        const out: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          out.push(canvas.toDataURL("image/png"));
          if (cancelled) return;
          setPages([...out]);
        }
        pdf.destroy?.();
      } catch (e) {
        console.error("PDF preview failed:", e);
        if (!cancelled) onFail();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  return (
    <div ref={box} className="h-full overflow-y-auto p-2 space-y-2">
      {pages.length === 0 && <p className="p-4 text-sm text-gray-500">Building preview…</p>}
      {pages.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt={`Page ${i + 1}`} className="block w-full h-auto bg-white shadow" />
      ))}
    </div>
  );
}

// Shows a generated PDF in the page, with Download / Open in new tab, so it can
// be checked without downloading it first.
export default function PdfPreviewModal({ build, load, title, onClose }: {
  /** a PDF made in the browser (split sheets) */
  build?: () => { doc: jsPDF; filename: string };
  /** or an existing file (documents) */
  load?: () => Promise<{ blob: Blob; filename: string }>;
  title?: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("split-sheet.pdf");
  const [error, setError] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  // phones and tablets: draw the pages ourselves (see PdfPages)
  const [drawPages, setDrawPages] = useState(false);
  useEffect(() => {
    setDrawPages(window.matchMedia("(max-width: 767px), (pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    let objectUrl = "";
    let gone = false;
    const show = (b: Blob, name: string) => {
      if (gone) return;
      setBlob(b);
      objectUrl = URL.createObjectURL(b);
      setUrl(objectUrl);
      setFilename(name);
    };
    try {
      if (build) {
        const { doc, filename } = build();
        show(doc.output("blob"), filename);
      } else if (load) {
        load().then((r) => show(r.blob, r.filename)).catch((e: any) => !gone && setError(e?.message || "Could not open the PDF"));
      }
    } catch (e: any) {
      setError(e?.message || "Could not build the PDF");
    }
    return () => { gone = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
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
          ) : url && drawPages && blob ? (
            <PdfPages blob={blob} onFail={() => setDrawPages(false)} />
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

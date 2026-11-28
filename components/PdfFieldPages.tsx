"use client";
import React, { useEffect, useRef, useState } from "react";
import { loadPdfjs } from "@/components/PdfPreviewModal";

/**
 * Every page of a PDF drawn as an image, each in its own box so things can be
 * laid over it (document fields). `overlay(page)` is drawn on top of page
 * `page` (1-based), positioned in percentages of that page.
 */
export default function PdfFieldPages({
  blob,
  overlay,
  onPageClick,
  onFail,
  className = "",
}: {
  blob: Blob;
  overlay?: (page: number) => React.ReactNode;
  /** a click on an empty part of a page, as fractions of the page (0-1) */
  onPageClick?: (page: number, x: number, y: number) => void;
  onFail?: () => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lib = await loadPdfjs();
        const pdf = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const width = Math.max(600, box.current?.clientWidth || 800);
        const ratio = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1));
        const out: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          out.push(canvas.toDataURL("image/jpeg", 0.85));
          if (cancelled) return;
          setPages([...out]);
        }
        pdf.destroy?.();
      } catch (e) {
        console.error("PDF pages failed:", e);
        if (!cancelled) onFail?.();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  return (
    <div ref={box} className={`space-y-3 ${className}`}>
      {pages.length === 0 && <p className="p-4 text-sm text-gray-500">Loading the document…</p>}
      {pages.map((src, i) => (
        <div
          key={i}
          className="relative bg-white shadow select-none"
          onClick={(e) => {
            if (!onPageClick || e.target !== e.currentTarget.firstChild) return;
            const r = e.currentTarget.getBoundingClientRect();
            onPageClick(i + 1, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Page ${i + 1}`} className="block w-full h-auto" draggable={false} />
          {overlay?.(i + 1)}
          <span className="absolute bottom-1 right-2 text-[10px] text-gray-400 pointer-events-none">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

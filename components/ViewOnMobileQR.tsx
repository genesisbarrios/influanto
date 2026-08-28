"use client";
/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";

interface Props {
  url: string;
  label?: string;
}

// Small "scan to view on mobile" QR badge, pinned to the bottom-right corner.
// Desktop only — visiting your own page's QR code on the phone you're already
// holding wouldn't make sense, so the caller hides this below the lg breakpoint.
export default function ViewOnMobileQR({ url, label = "View on mobile" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("qr-code-styling").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const QRCodeStyling = mod.default || mod;
      containerRef.current.innerHTML = "";
      const qr = new (QRCodeStyling as any)({
        width: 84,
        height: 84,
        type: "canvas",
        data: url,
        margin: 0,
        dotsOptions: { color: "#14141c", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "extra-rounded", color: "#14141c" },
        cornersDotOptions: { type: "dot", color: "#14141c" },
      });
      qr.append(containerRef.current);
      setReady(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [url]);

  if (!url) return null;

  return (
    <div
      className="hidden lg:flex fixed bottom-6 right-6 z-30 flex-col items-center gap-1.5 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2.5"
      aria-hidden={!ready}
    >
      <div ref={containerRef} style={{ width: 84, height: 84 }} />
      <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{label}</span>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSession } from "next-auth/react";

// Google AdSense on the free music tool pages and blog. Shown to signed-out
// visitors and free accounts, never to Pro (hasAccess). Ads appear only where an
// <AdSlot /> is placed, at a fixed banner size (728x90, 320x100 on phones). The
// script loads only when a slot ID exists (NEXT_PUBLIC_ADSENSE_TOOLS_SLOT), so
// pages never load AdSense just for Auto ads. Keep Auto ads OFF in the AdSense
// account, or Google adds its own anchor/full-screen ads wherever the script runs.

import { ADSENSE_CLIENT, ADSENSE_TOOLS_SLOT } from "@/libs/ads";

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

// One plan lookup per page load, shared by every slot on the page
let planPromise: Promise<boolean> | null = null;
function fetchIsPro(): Promise<boolean> {
  planPromise ??= fetch("/api/get-user", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => !!j?.data?.hasAccess)
    .catch(() => false);
  return planPromise;
}

// true once we know the visitor should see ads; false while unknown (no flash for Pro users)
export function useShowAds(): boolean {
  const { status } = useSession();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ADSENSE_CLIENT || status === "loading") return;
    if (status === "unauthenticated") { setShow(true); return; }
    let alive = true;
    fetchIsPro().then((isPro) => alive && setShow(!isPro));
    return () => { alive = false; };
  }, [status]);
  return show;
}

function loadAdsense() {
  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

export default function AdSlot({
  slot = ADSENSE_TOOLS_SLOT,
  className = "",
  style,
}: {
  slot?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const show = useShowAds();
  const pushed = useRef(false);

  useEffect(() => {
    if (!show || !slot || pushed.current) return;
    loadAdsense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch { /* ad blocked or not ready — leave the space empty */ }
  }, [show, slot]);

  if (!show || !slot) return null;
  return (
    <div className={className} style={{ textAlign: "center", ...style }}>
      <p style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#9ca3af", margin: "0 0 4px" }}>Advertisement</p>
      {/* Exact size per screen width (Google's documented CSS sizing for responsive units) */}
      <style>{`
        .influanto-ad { display: inline-block; width: 320px; height: 100px; }
        @media (min-width: 768px) { .influanto-ad { width: 728px; height: 90px; } }
      `}</style>
      <ins
        className="adsbygoogle influanto-ad"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
      />
      <a href="/#pricing" style={{ display: "inline-block", fontSize: 11, marginTop: 4, color: "#6b7280" }}>Go ad-free with Influanto Pro</a>
    </div>
  );
}

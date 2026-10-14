"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSession } from "next-auth/react";

// Google AdSense on the free music tool pages. Shown to signed-out visitors and
// free accounts, never to Pro (hasAccess). The AdSense script only loads where a
// slot renders; without a slot ID (NEXT_PUBLIC_ADSENSE_TOOLS_SLOT) it loads the
// script alone so AdSense Auto ads can place ads.

import { ADSENSE_CLIENT } from "@/libs/ads";

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
  slot = process.env.NEXT_PUBLIC_ADSENSE_TOOLS_SLOT || "",
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
    if (!show || pushed.current) return;
    loadAdsense();
    if (!slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch { /* ad blocked or not ready — leave the space empty */ }
  }, [show, slot]);

  // No ad unit yet: just load the script (lets AdSense "Auto ads" place ads)
  if (!show || !slot) return null;
  return (
    <div className={className} style={{ textAlign: "center", ...style }}>
      <p style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", opacity: 0.5, margin: "0 0 4px" }}>Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <a href="/#pricing" style={{ display: "inline-block", fontSize: 11, opacity: 0.6, marginTop: 4, color: "inherit" }}>Go ad-free with Influanto Pro</a>
    </div>
  );
}

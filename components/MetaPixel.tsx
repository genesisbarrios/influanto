"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// Pixels already init'd on this page load — a visitor can move between artists'
// pages without a full reload, and each artist's pixel needs its own init.
const initializedPixels = new Set<string>();

// Attached to every event so they can be told apart in Events Manager
// (e.g. one pixel shared between a link in bio and a release page).
function pageParams() {
  if (typeof window === "undefined") return {};
  return { page_name: document.title, page_path: window.location.pathname };
}

// ── Public helpers — call these anywhere after the pixel has loaded ───────────

export function fbTrack(event: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, { ...pageParams(), ...params });
  }
}

export function fbTrackCustom(event: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", event, { ...pageParams(), ...params });
  }
}

// Convenience wrappers used across both public pages
export function trackLinkClick(linkName: string, linkUrl: string, platform?: string) {
  fbTrackCustom("LinkClick", { link_name: linkName, link_url: linkUrl, platform: platform ?? "custom" });
}

export function trackStreamingClick(platform: string, url: string) {
  fbTrackCustom("StreamingClick", { platform, url });
  fbTrack("Lead", { content_name: platform }); // also fire standard Lead for audience building
}

export function trackMerchClick(productTitle: string, productUrl: string) {
  fbTrackCustom("MerchClick", { content_name: productTitle, content_type: "product", url: productUrl });
  fbTrack("ViewContent", { content_name: productTitle, content_type: "product" });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  pixelId: string;
  contentName: string;
  contentType: "link_in_bio" | "release_page";
}

export default function MetaPixel({ pixelId, contentName, contentType }: Props) {
  useEffect(() => {
    if (!pixelId) return;

    // Bootstrap the FB Pixel snippet (no-op if fbq already exists)
    (function (f: any, b: Document, e: string, v: string) {
      if (f.fbq) return;
      const n: any = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode!.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    if (!initializedPixels.has(pixelId)) {
      window.fbq("init", pixelId);
      initializedPixels.add(pixelId);
    }

    fbTrack("PageView");
    fbTrack("ViewContent", { content_name: contentName, content_type: contentType });
  }, [pixelId, contentName, contentType]);

  if (!pixelId) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}

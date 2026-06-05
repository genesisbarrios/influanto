"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// ── Public helpers — call these anywhere after the pixel has loaded ───────────

export function fbTrack(event: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params);
  }
}

export function fbTrackCustom(event: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", event, params);
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

    // Already loaded — just fire PageView again (SPA navigation)
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
      window.fbq("track", "ViewContent", {
        content_name: contentName,
        content_type: contentType,
      });
      return;
    }

    // Bootstrap the FB Pixel snippet
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

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    window.fbq("track", "ViewContent", {
      content_name: contentName,
      content_type: contentType,
    });
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

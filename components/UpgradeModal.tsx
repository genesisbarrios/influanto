"use client";
// "Get Pro" popup shown whenever a free account hits a plan limit (QR codes,
// release pages, EPKs, split sheets, newsletters, contacts, short links,
// custom domains). Anything can open it with openUpgrade(); API limit errors
// that carry `upgrade: true` open it automatically (see libs/api.ts).
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";

const EVENT = "influanto:upgrade";

type Detail = { reason: string; message?: string };

/** Show the upgrade popup. `reason` is a short key for analytics (e.g. "qr_codes"). */
export function openUpgrade(reason: string, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Detail>(EVENT, { detail: { reason, message } }));
}

const PERKS = [
  "50 release pages & 50 EPKs",
  "50 dynamic QR codes with scan analytics",
  "Unlimited split sheets",
  "Unlimited newsletters & mailing list contacts",
  "Custom domain for your pages",
  "Analytics on everything",
];

export default function UpgradeModal() {
  const [detail, setDetail] = useState<Detail | null>(null);
  const pro = config.stripe.plans.find((p) => p.mode === "subscription" && p.isFeatured) || config.stripe.plans[1];
  const forever = config.stripe.plans.find((p) => p.mode === "payment");

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<Detail>).detail;
      setDetail(d);
      posthog.capture("upgrade_popup_shown", { reason: d.reason });
    };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDetail(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setDetail(null)} role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pb-5 pt-6 text-white" style={{ background: "linear-gradient(135deg, #2e5596 0%, #1f7fb8 55%, #09ecf3 100%)" }}>
          <button type="button" onClick={() => setDetail(null)} className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close">✕</button>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Free plan limit reached</p>
          <h2 id="upgrade-title" className="mt-1 text-2xl font-extrabold leading-tight">Unlock more with Influanto Pro</h2>
          {detail.message && <p className="mt-2 text-sm text-white/90">{detail.message}</p>}
        </div>

        <div className="px-6 py-5">
          <ul className="space-y-2">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#09ecf3]/20 text-[10px] font-bold text-[#2e5596]">✓</span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-[#09ecf3]/40 bg-[#09ecf3]/5 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold">{pro.name}</span>
              <span>
                {pro.priceAnchor ? <span className="mr-1.5 text-sm text-gray-400 line-through">${pro.priceAnchor}</span> : null}
                <span className="text-2xl font-extrabold">${pro.price}</span>
                <span className="text-sm text-gray-500">/mo</span>
              </span>
            </div>
            <div className="mt-3 [&_button]:w-full">
              <ButtonCheckout mode="subscription" priceId={pro.priceId} buttonText="Influanto Pro" />
            </div>
          </div>

          {forever && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-3">
              <div>
                <p className="text-sm font-semibold">{forever.name}</p>
                <p className="text-xs text-gray-500">Pay once, keep Pro for life · ${forever.price}</p>
              </div>
              <div className="shrink-0 [&_button]:btn-sm">
                <ButtonCheckout mode="payment" priceId={forever.priceId} buttonText="Lifetime" />
              </div>
            </div>
          )}

          <button type="button" onClick={() => setDetail(null)} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-800">Maybe later</button>
        </div>
      </div>
    </div>
  );
}

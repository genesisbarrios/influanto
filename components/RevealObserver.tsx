"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Site-wide scroll animations. Mark any element with data-reveal (optionally
// data-reveal="fade" | "zoom" | "left" | "right", and style={{ "--reveal-delay": "120ms" }}
// to stagger). It animates in the first time it scrolls into view.
//
// Content is only hidden once this runs (it adds .reveal-ready to <html>), so
// nothing disappears if JS fails; prefers-reduced-motion skips the animation.
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      root.classList.remove("reveal-ready");
      return;
    }
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }
      },
      // threshold 0 (any visible pixel): a ratio would never be met by elements taller than the screen
      { rootMargin: "0px 0px -6% 0px", threshold: 0 }
    );

    const observeAll = () =>
      document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => io.observe(el));
    observeAll();

    // Pages render content after data loads — pick up new [data-reveal] elements too
    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}

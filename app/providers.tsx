"use client";

import { ReactNode } from "react";
import { PostHogProvider } from "./posthog-init";

// PostHogProvider already guards its own client-only behavior (it renders
// `children` immediately and only wraps them with the PostHog context once
// mounted), so it's safe to render directly here. Loading it via
// next/dynamic(..., { ssr: false }) — as this used to — forces Next.js to
// skip server rendering everything nested inside it, which is `children`:
// the entire app. That meant every page on the site was shipping an empty
// HTML shell with no real content or links until client JS hydrated it.
export function PostHogWrapper({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      {children}
    </PostHogProvider>
  );
}

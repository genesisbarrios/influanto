"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const PostHogProvider = dynamic(
  () => import("./posthog-init").then((mod) => mod.PostHogProvider),
  { ssr: false }
);

export function PostHogWrapper({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      {children}
    </PostHogProvider>
  );
}

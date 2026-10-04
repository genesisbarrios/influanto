"use client";
import { useSession } from "next-auth/react";

// "Join Influanto" sidebar shown next to the free music tools. Signed-in users
// never see it, and the tool takes the full width instead. It also stays hidden
// while the session is loading so signed-in users don't see it flash.
export function useShowJoinSidebar() {
  const { status } = useSession();
  return status === "unauthenticated";
}

// Classes for the tool's main pane: 3/4 width beside the sidebar, full width without it
export function toolPaneClass(showSidebar: boolean, extra = "p-8") {
  return `w-full ${extra} ${showSidebar ? "sm:w-3/4 sm:border-r sm:border-gray-300" : ""}`;
}

export default function ToolJoinSidebar({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", color: "#181b20" }}
      className="w-full sm:w-1/4 p-8"
    >
      <h3 className="text-xl font-bold mb-4">Join Influanto</h3>
      <a
        href="/api/auth/signin?callbackUrl=/dashboard"
        className="btn btn-primary"
        style={{ padding: "0.75rem 2rem", fontSize: "1.1rem", borderRadius: 8, marginBottom: "1.5rem", background: "#2563eb", color: "#fff", border: "none", touchAction: "manipulation" }}
        onTouchStart={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        Sign Up
      </a>
      <p style={{ textAlign: "center" }}>
        Create your free Link in Bio, Create QR Codes, Search for Spotify Curators, and connect with other musicians.
      </p>
    </div>
  );
}

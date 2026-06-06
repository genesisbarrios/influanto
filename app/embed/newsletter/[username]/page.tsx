"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NewsletterSignup from "@/components/NewsletterSignup";

// Standalone, embeddable newsletter signup (rendered in an <iframe> on other sites).
export default function NewsletterEmbed() {
  const params = useParams();
  const username = params?.username as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Newsletter signup";
    if (!username) return;
    fetch(`/api/linkinbio/${username}`)
      .then((r) => r.json())
      .then((j) => setData(j?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  const lib = data?.linkInBio;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, background: "transparent" }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "10px 18px", width: "100%", maxWidth: 460 }}>
        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}>Loading…</p>
        ) : lib?.newsletterEnabled ? (
          <NewsletterSignup
            username={username}
            source="link_in_bio"
            fields={lib.newsletterFields}
            textColor="#111827"
            linksColor={lib.linksColor || "#4f46e5"}
            heading={`📣 Join ${data?.user?.name || username}'s newsletter`}
          />
        ) : (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}>
            Newsletter signups aren’t enabled for this page.
          </p>
        )}
      </div>
    </div>
  );
}

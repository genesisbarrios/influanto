"use client";
/* eslint-disable */
import React, { useState } from "react";

export interface NewsletterStyle {
  heading?: string;
  subtitle?: string;
  buttonColor?: string;
  textColor?: string;
  bgColor?: string;   // optional card background behind the form
}

interface Props {
  username: string;
  source: "link_in_bio" | "release_page";
  fields?: string[];
  bgColor?: string;
  textColor?: string;
  linksColor?: string;
  heading?: string;
  style?: NewsletterStyle; // per-user overrides edited on the Profile page
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  phone: "Phone",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  name: "Name",
  phone: "Phone",
  instagram: "Instagram username",
  tiktok: "TikTok username",
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const HANDLE_RE = /^[a-zA-Z0-9._]{1,30}$/;

// Accepts a bare handle, an @handle, or a full profile URL and reduces it to
// just the username — the storage convention used everywhere else in the app.
function sanitizeSocialHandle(value: string, domain: string): string {
  let s = (value || "").trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  s = s.replace(new RegExp(`^${domain.replace(".", "\\.")}\\/`, "i"), "");
  s = s.replace(/^@/, "");
  s = s.split(/[/?#]/)[0];
  return s.trim();
}

export default function NewsletterSignup({ username, source, fields = ["name", "email"], bgColor, textColor, linksColor, heading, style }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [hp, setHp] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const text = style?.textColor || textColor || "#ffffff";
  const accent = style?.buttonColor || linksColor || "#4f46e5";
  const headingText = style?.heading || heading || "📣 Join my newsletter";
  const subtitle = style?.subtitle || "Get updates on new releases straight to your inbox.";
  const cardBg = style?.bgColor;
  // Optional fields (email is rendered separately and always required)
  const optionalFields = fields.filter(f => f !== "email");

  const set = (k: string, v: string) => setValues(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test((values.email || "").trim())) { setError("Please enter a valid email address"); return; }
    // Reduce pasted @handles / profile URLs down to a bare username before saving.
    const payload: Record<string, string> = { ...values };
    for (const [f, domain] of [["instagram", "instagram.com"], ["tiktok", "tiktok.com"]] as const) {
      const raw = (payload[f] || "").trim();
      const cleaned = sanitizeSocialHandle(raw, domain);
      if (raw && !HANDLE_RE.test(cleaned)) { setError(`Enter a valid ${FIELD_LABELS[f]} username`); return; }
      payload[f] = cleaned;
    }
    setStatus("sending"); setError("");
    try {
      const res = await fetch("/api/outreach/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, source, hp, ...payload }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Could not subscribe");
      }
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${text}33`,
    background: `${text}0d`,
    color: text,
    fontSize: 14,
    marginBottom: 10,
    outline: "none",
  };

  if (status === "done") {
    return (
      <div style={{ maxWidth: 420, margin: "24px auto", textAlign: "center", color: text }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <p style={{ fontWeight: 700 }}>You're on the list!</p>
        <p style={{ opacity: 0.7, fontSize: 14 }}>Thanks for subscribing.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 420, margin: "24px auto", width: "100%", ...(cardBg ? { background: cardBg, padding: 20, borderRadius: 14 } : {}) }}>
      <p style={{ color: text, fontWeight: 700, fontSize: 16, marginBottom: 4, textAlign: "center" }}>
        {headingText}
      </p>
      {subtitle && (
        <p style={{ color: text, opacity: 0.7, fontSize: 13, marginBottom: 14, textAlign: "center" }}>
          {subtitle}
        </p>
      )}

      {/* Honeypot — hidden from real users */}
      <input type="text" value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

      {optionalFields.includes("name") && (
        <input style={inputStyle} placeholder="Name" value={values.name || ""} onChange={e => set("name", e.target.value)} />
      )}
      <input style={inputStyle} type="email" required placeholder="Email *" value={values.email || ""} onChange={e => set("email", e.target.value)} />
      {optionalFields.filter(f => f !== "name").map(f => (
        <input key={f} style={inputStyle} placeholder={FIELD_PLACEHOLDERS[f] || FIELD_LABELS[f] || f} value={values[f] || ""} onChange={e => set(f, e.target.value)} />
      ))}

      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</p>}

      <button type="submit" disabled={status === "sending"}
        style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: accent, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: status === "sending" ? 0.6 : 1 }}>
        {status === "sending" ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}

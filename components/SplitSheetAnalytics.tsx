"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/libs/api";

export interface SignerTracking {
  id: string;
  contributor_name: string;
  contributor_email: string;
  created_at?: string;
  last_sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  viewed_at: string | null;
  edited_at: string | null;
  signed_at: string | null;
}
interface SheetEvent { id: string; signer_id: string | null; type: string; created_at: string }

const STEPS: { key: keyof SignerTracking; label: string }[] = [
  { key: "last_sent_at", label: "Sent" },
  { key: "opened_at", label: "Opened" },
  { key: "clicked_at", label: "Clicked" },
  { key: "viewed_at", label: "Viewed" },
  { key: "edited_at", label: "Edited" },
  { key: "signed_at", label: "Signed" },
];

const EVENT_TEXT: Record<string, string> = {
  sent: "was sent the sheet",
  opened: "opened the email",
  clicked: "clicked the link",
  viewed: "viewed the sheet",
  edited: "edited their details",
  signed: "signed",
};

export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

/** Furthest step a recipient has reached, e.g. "Opened" (for the list view). */
export function signerStage(s: SignerTracking): { label: string; at: string | null } {
  if (s.signed_at) return { label: "Signed", at: s.signed_at };
  if (s.edited_at) return { label: "Edited", at: s.edited_at };
  if (s.viewed_at || s.clicked_at) return { label: s.clicked_at ? "Clicked" : "Viewed", at: s.clicked_at || s.viewed_at };
  if (s.opened_at) return { label: "Opened", at: s.opened_at };
  if (s.last_sent_at) return { label: "Sent", at: s.last_sent_at };
  return { label: "Not sent", at: null };
}

/** One-line summary for a sheet: last sent date + how far recipients got. */
export function trackingSummary(signers: SignerTracking[], lastSentAt?: string | null) {
  if (!signers.length && !lastSentAt) return "";
  const n = signers.length;
  const count = (k: keyof SignerTracking) => signers.filter((s) => s[k]).length;
  const parts = [lastSentAt ? `Last sent ${fmtDate(lastSentAt)}` : "Not sent yet"];
  if (n) {
    parts.push(`${count("opened_at")}/${n} opened`);
    const clicked = signers.filter((s) => s.clicked_at || s.viewed_at).length;
    parts.push(`${clicked}/${n} clicked`);
    if (count("edited_at")) parts.push(`${count("edited_at")} edited`);
    parts.push(`${count("signed_at")}/${n} signed`);
  }
  return parts.join(" · ");
}

export default function SplitSheetAnalytics({ sheetId, title, onClose }: { sheetId: string; title?: string; onClose: () => void }) {
  const [data, setData] = useState<{ sheet: any; signers: SignerTracking[]; events: SheetEvent[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get(`/split-sheets/${sheetId}/analytics`)
      .then((r: any) => setData(r))
      .catch((e: any) => setError(e?.response?.data?.error || e?.message || "Could not load analytics"));
  }, [sheetId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const signers = data?.signers ?? [];
  const nameOf = (id: string | null) => {
    if (!id) return "You";
    const s = signers.find((x) => x.id === id);
    return s?.contributor_name || s?.contributor_email || "A recipient";
  };
  const total = signers.length;
  const stat = (label: string, value: number) => (
    <div className="rounded-lg border border-gray-200 p-3 text-center">
      <p className="text-2xl font-bold">{value}{total ? <span className="text-sm font-normal text-gray-400">/{total}</span> : null}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col text-black" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">Analytics · {title || "Untitled"}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {data?.sheet?.last_sent_at ? <>Last sent <strong>{fmtDateTime(data.sheet.last_sent_at)}</strong></> : data ? "Not sent yet" : "Loading…"}
            </p>
          </div>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {error && <p className="text-sm text-red-500">{error}</p>}

          {data && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {stat("Sent", signers.filter((s) => s.last_sent_at).length)}
                {stat("Opened", signers.filter((s) => s.opened_at).length)}
                {stat("Clicked", signers.filter((s) => s.clicked_at || s.viewed_at).length)}
                {stat("Edited", signers.filter((s) => s.edited_at).length)}
                {stat("Signed", signers.filter((s) => s.signed_at).length)}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Recipients</h4>
                {signers.length === 0 ? (
                  <p className="text-sm text-gray-400">Nobody has been sent this sheet yet. Use <strong>Send</strong> to email it to your contributors.</p>
                ) : (
                  <div className="space-y-2">
                    {signers.map((s) => (
                      <div key={s.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.contributor_name || s.contributor_email}</p>
                            <p className="text-xs text-gray-400 truncate">{s.contributor_email}</p>
                          </div>
                          <span className={`badge badge-sm ${s.signed_at ? "badge-success" : s.last_sent_at ? "badge-info" : "badge-ghost"}`}>{signerStage(s).label}</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2">
                          {STEPS.map(({ key, label }) => {
                            const at = s[key] as string | null;
                            return (
                              <div key={key} className={`rounded-md px-2 py-1 text-[11px] ${at ? "bg-indigo-50 text-indigo-800" : "bg-gray-50 text-gray-400"}`} title={at ? fmtDateTime(at) : `Not ${label.toLowerCase()} yet`}>
                                <p className="font-semibold">{at ? "✓ " : ""}{label}</p>
                                <p className="truncate">{at ? fmtDateTime(at) : "—"}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Activity</h4>
                {data.events.length === 0 ? (
                  <p className="text-sm text-gray-400">No activity recorded yet.</p>
                ) : (
                  <ul className="text-sm divide-y divide-gray-100">
                    {data.events.map((e) => (
                      <li key={e.id} className="py-1.5 flex justify-between gap-3">
                        <span><strong>{nameOf(e.signer_id)}</strong> {e.signer_id ? EVENT_TEXT[e.type] || e.type : e.type === "edited" ? "edited the sheet" : e.type}</span>
                        <span className="text-xs text-gray-400 shrink-0">{fmtDateTime(e.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-[11px] text-gray-400">
                Opens are counted when the email&apos;s images load, so some email apps (or privacy settings) can hide or pre-load them. Emails sent before tracking was added only show sent and signed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell,
} from "recharts";
import apiClient from "@/libs/api";

interface Data {
  sent: number;
  totalOpens: number;
  uniqueOpens: number;
  totalClicks: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  clicksByLink: { name: string; count: number }[];
  byDay: { date: string; opens: number; clicks: number }[];
}

const PALETTE = ["#4f46e5","#6366f1","#818cf8","#a5b4fc","#7c3aed","#8b5cf6","#a78bfa","#c4b5fd"];

// Map a destination URL to a friendly platform name so the chart isn't full of long links.
function platformFromUrl(raw: string): string {
  let host = "";
  try { host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return raw || "Link"; }
  const map: [RegExp, string][] = [
    [/spotify\.com|spoti\.fi/, "Spotify"],
    [/youtube\.com|youtu\.be/, "YouTube"],
    [/music\.apple\.com|apple\.co/, "Apple Music"],
    [/itunes\.apple\.com/, "iTunes"],
    [/soundcloud\.com/, "SoundCloud"],
    [/bandcamp\.com/, "Bandcamp"],
    [/tidal\.com/, "Tidal"],
    [/deezer\.com/, "Deezer"],
    [/music\.amazon|amazon\./, "Amazon Music"],
    [/pandora\.com/, "Pandora"],
    [/audiomack\.com/, "Audiomack"],
    [/music\.youtube\.com/, "YouTube Music"],
    [/instagram\.com/, "Instagram"],
    [/tiktok\.com/, "TikTok"],
    [/(twitter\.com|x\.com|t\.co)/, "Twitter / X"],
    [/facebook\.com|fb\.com/, "Facebook"],
    [/snapchat\.com/, "Snapchat"],
    [/twitch\.tv/, "Twitch"],
    [/discord\.(gg|com)/, "Discord"],
    [/patreon\.com/, "Patreon"],
    [/bsky\.app/, "Bluesky"],
    [/linktr\.ee/, "Linktree"],
    [/influanto\.com/, "Influanto"],
  ];
  for (const [re, name] of map) if (re.test(host)) return name;
  const base = host.split(".")[0];
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Link";
}

// Tooltip for the clicks-by-link chart: platform + count, with the full URL underneath.
function LinkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", padding: "6px 10px", maxWidth: 320, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600 }}>{p.label} · {p.count} click{p.count !== 1 ? "s" : ""}</div>
      <div style={{ color: "#6b7280", wordBreak: "break-all", marginTop: 2 }}>{p.url}</div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function NewsletterAnalytics({ newsletterId, title, onBack, embedded }: { newsletterId: string; title: string; onBack?: () => void; embedded?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient.get(`/analytics/newsletter?newsletterId=${newsletterId}`)
      .then((r: any) => { if (active) setData(r); })
      .catch((e: any) => { if (active) setError(e?.response?.data?.error || "Failed to load analytics"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [newsletterId]);

  const hasShape = data && (data.sent > 0 || data.totalOpens > 0 || data.totalClicks > 0);

  return (
    <div className={embedded ? "text-black pt-4" : "p-4 bg-white shadow rounded-md text-black"}>
      {!embedded && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">📊</span>
            <h2 className="text-xl font-bold">Analytics · <span className="font-semibold text-gray-600">{title || "Newsletter"}</span></h2>
          </div>
          {onBack && <button className="btn btn-sm" onClick={onBack}>← Back</button>}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading analytics…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      ) : !hasShape ? (
        <div className="py-16 text-center text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="font-medium text-gray-600">No activity yet</p>
          <p className="text-sm mt-1">Once you send this newsletter, opens and clicks will show up here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Stat label="Sent to" value={data!.sent} sub="contacts" />
            <Stat label="Opens" value={data!.uniqueOpens} sub={`${data!.totalOpens} total`} />
            <Stat label="Open rate" value={`${data!.openRate}%`} />
            <Stat label="Clicks" value={data!.uniqueClicks} sub={`${data!.totalClicks} total`} />
            <Stat label="Click rate" value={`${data!.clickRate}%`} />
          </div>

          {/* Opens & clicks over time */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Opens &amp; clicks (last 30 days)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data!.byDay} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="opens" stroke="#4f46e5" strokeWidth={2} dot={false} name="Opens" />
                <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Clicks by link */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Clicks by link</p>
            {data!.clicksByLink.length === 0 ? (
              <p className="text-sm text-gray-400">No link clicks yet.</p>
            ) : (
              (() => {
                const rows = data!.clicksByLink.map(c => ({ label: platformFromUrl(c.name), url: c.name, count: c.count }));
                return (
                  <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 34)}>
                    <BarChart layout="vertical" data={rows} margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                      <Tooltip content={<LinkTooltip />} cursor={{ fill: "#f3f4f6" }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Clicks">
                        {rows.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()
            )}
          </div>

          <p className="text-[11px] text-gray-400">
            Open tracking relies on the recipient's email app loading images, so real open counts are typically higher than shown. Click tracking is exact.
          </p>
        </div>
      )}
    </div>
  );
}

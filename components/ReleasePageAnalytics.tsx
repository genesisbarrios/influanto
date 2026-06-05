"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import apiClient from "@/libs/api";

interface AnalyticsData {
  visitsByDay:      { date: string; count: number }[];
  visitsByCountry:  { name: string; count: number }[];
  visitsByDevice:   { name: string; count: number }[];
  visitsByBrowser:  { name: string; count: number }[];
  visitsByOS:       { name: string; count: number }[];
  visitsByReferrer: { name: string; count: number }[];
  total: number;
}

const PALETTE = [
  "#4f46e5","#6366f1","#818cf8","#a5b4fc","#c7d2fe",
  "#7c3aed","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe",
];

const TABS = ["Views", "Location", "Devices", "Sources"];

function ComingSoon({ icon = "📊", title, subtitle }: { icon?: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-44 gap-2 text-center px-4">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xs text-gray-400 max-w-xs">{subtitle}</p>
    </div>
  );
}

function HBar({ data, height = 200 }: { data: { name: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} cursor={{ fill: "#f3f4f6" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Visits">
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={32}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface Props {
  releasePageId: string;
  releasePageName?: string;
}

export default function ReleasePageAnalytics({ releasePageId, releasePageName }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!releasePageId) return;
    setLoading(true);
    apiClient
      .get(`/analytics/release?releasePageId=${releasePageId}`)
      .then((res: any) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [releasePageId]);

  const noVisits = !data || data.total === 0;

  return (
    <div className="mt-3 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">
          {releasePageName || "Release Page"}
        </h3>
        {data && (
          <span className="text-xs text-gray-500">{data.total.toLocaleString()} total visits</span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 flex-wrap">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === i ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4" style={{ minHeight: 220 }}>

        {loading && (
          <div className="flex items-center justify-center h-44 text-gray-400 text-sm">Loading…</div>
        )}

        {/* Views */}
        {!loading && activeTab === 0 && (
          noVisits || data!.visitsByDay.every((d) => d.count === 0) ? (
            <ComingSoon
              icon="📈"
              title="No visits yet"
              subtitle="Share your release page link to start seeing visit data here."
            />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">Page views — last 30 days</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data!.visitsByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={6} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} cursor={{ fill: "#f3f4f6" }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )
        )}

        {/* Location */}
        {!loading && activeTab === 1 && (
          noVisits || data!.visitsByCountry.length === 0 ? (
            <ComingSoon
              icon="🌍"
              title="No location data yet"
              subtitle="You'll see which countries your listeners are coming from."
            />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">Top countries — all time</p>
              <HBar data={data!.visitsByCountry} height={Math.max(180, data!.visitsByCountry.length * 26)} />
            </>
          )
        )}

        {/* Devices */}
        {!loading && activeTab === 2 && (
          noVisits || data!.visitsByDevice.length === 0 ? (
            <ComingSoon
              icon="📱"
              title="No device data yet"
              subtitle="You'll see mobile vs desktop, browsers, and OS breakdowns."
            />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-1">Device type</p>
              <Donut data={data!.visitsByDevice} />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Browser</p>
                  <HBar data={data!.visitsByBrowser} height={Math.max(120, data!.visitsByBrowser.length * 26)} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Operating system</p>
                  <HBar data={data!.visitsByOS} height={Math.max(120, data!.visitsByOS.length * 26)} />
                </div>
              </div>
            </>
          )
        )}

        {/* Sources */}
        {!loading && activeTab === 3 && (
          noVisits || data!.visitsByReferrer.length === 0 ? (
            <ComingSoon
              icon="🔗"
              title="No traffic sources yet"
              subtitle="You'll see whether fans came from Instagram, TikTok, direct links, and more."
            />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">Traffic sources — all time</p>
              <HBar data={data!.visitsByReferrer} height={Math.max(180, data!.visitsByReferrer.length * 28)} />
            </>
          )
        )}

      </div>
    </div>
  );
}

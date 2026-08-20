"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import apiClient from "@/libs/api";
import { RANGE_OPTIONS } from "./AnalyticsRangeSelect";

interface AnalyticsData {
  visitsByDay: { date: string; count: number }[];
  visitsByCountry: { name: string; count: number }[];
  visitsByDevice: { name: string; count: number }[];
  visitsByBrowser: { name: string; count: number }[];
  visitsByOS: { name: string; count: number }[];
  visitsByReferrer: { name: string; count: number }[];
  total: number;
}

const PALETTE = ["#4f46e5","#6366f1","#818cf8","#a5b4fc","#c7d2fe","#7c3aed","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe"];
const TABS = ["Scans", "Location", "Devices", "Sources"];

const COUNTRY_NAMES: Record<string, string> = {
  US:"United States",GB:"United Kingdom",CA:"Canada",AU:"Australia",MX:"Mexico",
  BR:"Brazil",DE:"Germany",FR:"France",ES:"Spain",IT:"Italy",JP:"Japan",
  KR:"South Korea",IN:"India",NG:"Nigeria",ZA:"South Africa",AR:"Argentina",
  CO:"Colombia",CL:"Chile",PE:"Peru",VE:"Venezuela",NL:"Netherlands",SE:"Sweden",
  NO:"Norway",DK:"Denmark",FI:"Finland",PT:"Portugal",PL:"Poland",RU:"Russia",
  UA:"Ukraine",TR:"Turkey",SA:"Saudi Arabia",AE:"United Arab Emirates",EG:"Egypt",
  GH:"Ghana",KE:"Kenya",ET:"Ethiopia",TZ:"Tanzania",CM:"Cameroon",SN:"Senegal",
  CI:"Ivory Coast",PH:"Philippines",ID:"Indonesia",TH:"Thailand",VN:"Vietnam",
  MY:"Malaysia",SG:"Singapore",NZ:"New Zealand",PK:"Pakistan",BD:"Bangladesh",
  CN:"China",HK:"Hong Kong",TW:"Taiwan",IE:"Ireland",BE:"Belgium",CH:"Switzerland",
  AT:"Austria",CZ:"Czech Republic",RO:"Romania",GR:"Greece",HU:"Hungary",
  JM:"Jamaica",TT:"Trinidad and Tobago",DO:"Dominican Republic",PR:"Puerto Rico",
  GT:"Guatemala",CR:"Costa Rica",PA:"Panama",BO:"Bolivia",EC:"Ecuador",
  PY:"Paraguay",UY:"Uruguay",IL:"Israel",LB:"Lebanon",QA:"Qatar",KW:"Kuwait",
};

function Empty({ icon = "📊", title, subtitle }: { icon?: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
      <span className="text-2xl">{icon}</span>
      <p className="text-xs font-medium text-gray-600">{title}</p>
      <p className="text-xs text-gray-400 max-w-xs">{subtitle}</p>
    </div>
  );
}

function HBar({ data, height = 160, isCountry = false }: { data: { name: string; count: number }[]; height?: number; isCountry?: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const chartData = isCountry
    ? data.map(d => ({ code: d.name, name: isMobile ? d.name : (COUNTRY_NAMES[d.name] ?? d.name), count: d.count }))
    : data;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={isCountry && !isMobile ? 145 : 80} />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 6 }}
          cursor={{ fill: "#f3f4f6" }}
          labelFormatter={(label: any, payload: any) =>
            isCountry && isMobile && payload?.[0]?.payload?.code
              ? (COUNTRY_NAMES[payload[0].payload.code] ?? label)
              : label
          }
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Scans">
          {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={28}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface Props {
  codeId: string;
  codeName?: string;
  range?: string;
  customStart?: string;
  customEnd?: string;
  onTotalChange?: (total: number) => void;
}

export default function QRCodeAnalytics({ codeId, codeName, range = "30d", customStart, customEnd, onTotalChange }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!codeId) return;
    // Custom range needs both endpoints before it's worth fetching.
    if (range === "custom" && (!customStart || !customEnd)) return;

    setLoading(true);
    const params = new URLSearchParams({ range });
    if (range === "custom") {
      params.set("start", customStart!);
      params.set("end", customEnd!);
    }
    apiClient
      .get(`/analytics/qr/${codeId}?${params.toString()}`)
      .then((r: any) => setData(r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [codeId, range, customStart, customEnd]);

  useEffect(() => {
    if (data) onTotalChange?.(data.total);
  }, [data, onTotalChange]);

  const noScans = !data || data.total === 0;

  return (
    <div className="w-full">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3 flex-wrap">
        {TABS.map((tab, i) => (
          <button key={tab} type="button" onClick={() => setActiveTab(i)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === i ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3" style={{ minHeight: 180 }}>
        {loading && <div className="flex items-center justify-center h-32 text-gray-400 text-xs">Loading…</div>}

        {!loading && activeTab === 0 && (
          noScans || data!.visitsByDay.every(d => d.count === 0) ? (
            <Empty icon="📈" title="No scans yet" subtitle="Share your QR code to start seeing scan data." />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-2">
                Scans — {range === "custom" ? `${customStart} to ${customEnd}` : (RANGE_OPTIONS.find((o) => o.key === range)?.label ?? "last 30 days").toLowerCase()}
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data!.visitsByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} interval={6} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} cursor={{ fill: "#f3f4f6" }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Scans" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )
        )}

        {!loading && activeTab === 1 && (
          noScans || !data!.visitsByCountry.length ? (
            <Empty icon="🌍" title="No location data yet" subtitle="You'll see where your scans are coming from." />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-2">Top countries</p>
              <HBar data={data!.visitsByCountry} height={Math.max(140, data!.visitsByCountry.length * 22)} isCountry />
            </>
          )
        )}

        {!loading && activeTab === 2 && (
          noScans || !data!.visitsByDevice.length ? (
            <Empty icon="📱" title="No device data yet" subtitle="Device, browser, and OS breakdown will appear here." />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-1">Device type</p>
              <Donut data={data!.visitsByDevice} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div><p className="text-xs text-gray-400 mb-1">Browser</p><HBar data={data!.visitsByBrowser} height={Math.max(100, data!.visitsByBrowser.length * 22)} /></div>
                <div><p className="text-xs text-gray-400 mb-1">OS</p><HBar data={data!.visitsByOS} height={Math.max(100, data!.visitsByOS.length * 22)} /></div>
              </div>
            </>
          )
        )}

        {!loading && activeTab === 3 && (
          noScans || !data!.visitsByReferrer.length ? (
            <Empty icon="🔗" title="No source data yet" subtitle="Traffic sources will appear once people start scanning." />
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-2">Traffic sources</p>
              <HBar data={data!.visitsByReferrer} height={Math.max(140, data!.visitsByReferrer.length * 24)} />
            </>
          )
        )}
      </div>
    </div>
  );
}

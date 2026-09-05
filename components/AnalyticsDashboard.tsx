"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import LinkInBioAnalytics from "./LinkInBioAnalytics";
import ReleasePageAnalytics from "./ReleasePageAnalytics";
import QRCodeAnalytics from "./QRCodeAnalytics";
import AnalyticsRangeSelect from "./AnalyticsRangeSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartSimple } from "@fortawesome/free-solid-svg-icons";

const TABS = [
  { key: "linkinbio", label: "Link in Bio" },
  { key: "release", label: "Release Pages" },
  { key: "qr", label: "QR Codes" },
];

function Empty({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-3xl mb-2"><FontAwesomeIcon icon={faChartSimple} /></span>
      <p className="text-sm font-medium text-gray-600">No {what} yet</p>
      <p className="text-xs text-gray-400">Create one to start seeing analytics here.</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState("linkinbio");
  const [releasePages, setReleasePages] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [releaseId, setReleaseId] = useState("");
  const [codeId, setCodeId] = useState("");

  // Date range is shared across all three views.
  const [range, setRange] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Each view reports its own total back up so it can sit in the shared header row.
  const [linkTotal, setLinkTotal] = useState<number | null>(null);
  const [releaseTotal, setReleaseTotal] = useState<number | null>(null);
  const [codeTotal, setCodeTotal] = useState<number | null>(null);

  // Load the user's release pages + QR codes for the per-item selectors.
  useEffect(() => {
    fetch("/api/get-release-pages")
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j?.data) ? j.data : [];
        setReleasePages(list);
        if (list.length) setReleaseId(String(list[0].id));
      })
      .catch(() => {});
    fetch("/api/get-codes")
      .then((r) => r.json())
      .then((j) => {
        const arr = j?.data?.[0]?.codes ?? [];
        setCodes(arr);
        if (arr.length) setCodeId(String(arr[0].id ?? arr[0]._id));
      })
      .catch(() => {});
  }, []);

  const selectedRelease = releasePages.find((p) => String(p.id) === releaseId);
  const selectedCode = codes.find((c) => String(c.id ?? c._id) === codeId);

  // Reset the shown totals while new data is loading, so a stale number never lingers.
  useEffect(() => {
    setLinkTotal(null);
    setReleaseTotal(null);
    setCodeTotal(null);
  }, [range, customStart, customEnd]);
  useEffect(() => { setReleaseTotal(null); }, [releaseId]);
  useEffect(() => { setCodeTotal(null); }, [codeId]);

  const total = tab === "linkinbio" ? linkTotal : tab === "release" ? releaseTotal : codeTotal;
  const totalLabel = tab === "qr" ? "total scans" : "total visits";
  const hasContent = tab === "release" ? releasePages.length > 0 : tab === "qr" ? codes.length > 0 : true;

  return (
    <div className="mt-6 w-full text-left">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', fontSize: 15 }}><FontAwesomeIcon icon={faChartSimple} /></span>
        <h3 className="font-bold text-lg text-gray-800">Analytics</h3>
      </div>

      {/* Analytics type selection — real tabs sitting on top of the submenu below */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-200 mb-3">
        <div className="flex gap-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 -mb-px px-1 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap pb-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {!hasContent ? 0 : total !== null ? total.toLocaleString() : "…"} {totalLabel}
          </span>
          <AnalyticsRangeSelect
            range={range}
            onRangeChange={setRange}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          {tab === "release" && releasePages.length > 1 && (
            <select
              className="select select-sm select-bordered"
              value={releaseId}
              onChange={(e) => setReleaseId(e.target.value)}
            >
              {releasePages.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name || "Untitled"}</option>
              ))}
            </select>
          )}
          {tab === "qr" && codes.length > 1 && (
            <select
              className="select select-sm select-bordered"
              value={codeId}
              onChange={(e) => setCodeId(e.target.value)}
            >
              {codes.map((c) => {
                const id = String(c.id ?? c._id);
                return <option key={id} value={id}>{c.name || "Untitled"}</option>;
              })}
            </select>
          )}
        </div>
      </div>

      {tab === "linkinbio" && (
        <LinkInBioAnalytics
          range={range}
          customStart={customStart}
          customEnd={customEnd}
          onTotalChange={setLinkTotal}
        />
      )}

      {tab === "release" && (
        releasePages.length === 0 ? (
          <Empty what="release pages" />
        ) : (
          selectedRelease && (
            <ReleasePageAnalytics
              releasePageId={String(selectedRelease.id)}
              releasePageName={selectedRelease.name}
              range={range}
              customStart={customStart}
              customEnd={customEnd}
              onTotalChange={setReleaseTotal}
            />
          )
        )
      )}

      {tab === "qr" && (
        codes.length === 0 ? (
          <Empty what="QR codes" />
        ) : (
          selectedCode && (
            <QRCodeAnalytics
              codeId={String(selectedCode.id ?? selectedCode._id)}
              codeName={selectedCode.name}
              range={range}
              customStart={customStart}
              customEnd={customEnd}
              onTotalChange={setCodeTotal}
            />
          )
        )
      )}
    </div>
  );
}

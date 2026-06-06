"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import LinkInBioAnalytics from "./LinkInBioAnalytics";
import ReleasePageAnalytics from "./ReleasePageAnalytics";
import QRCodeAnalytics from "./QRCodeAnalytics";

const TABS = [
  { key: "linkinbio", label: "Link in Bio" },
  { key: "release", label: "Release Pages" },
  { key: "qr", label: "QR Codes" },
];

function Empty({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-3xl mb-2">📊</span>
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

  return (
    <div className="mt-6 w-full text-left">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', fontSize: 15 }}>📊</span>
        <h3 className="font-bold text-lg text-gray-800">Analytics</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.key ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "linkinbio" && <LinkInBioAnalytics />}

      {tab === "release" && (
        releasePages.length === 0 ? (
          <Empty what="release pages" />
        ) : (
          <>
            {releasePages.length > 1 && (
              <select
                className="select select-sm select-bordered w-full max-w-xs mb-2"
                value={releaseId}
                onChange={(e) => setReleaseId(e.target.value)}
              >
                {releasePages.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name || "Untitled"}</option>
                ))}
              </select>
            )}
            {selectedRelease && (
              <ReleasePageAnalytics releasePageId={String(selectedRelease.id)} releasePageName={selectedRelease.name} />
            )}
          </>
        )
      )}

      {tab === "qr" && (
        codes.length === 0 ? (
          <Empty what="QR codes" />
        ) : (
          <>
            {codes.length > 1 && (
              <select
                className="select select-sm select-bordered w-full max-w-xs mb-2"
                value={codeId}
                onChange={(e) => setCodeId(e.target.value)}
              >
                {codes.map((c) => {
                  const id = String(c.id ?? c._id);
                  return <option key={id} value={id}>{c.name || "Untitled"}</option>;
                })}
              </select>
            )}
            {selectedCode && (
              <QRCodeAnalytics codeId={String(selectedCode.id ?? selectedCode._id)} codeName={selectedCode.name} />
            )}
          </>
        )
      )}
    </div>
  );
}

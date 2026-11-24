"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/libs/api";
import SplitSheets from "./SplitSheets";
import Documents from "./Documents";
import { usesSplitSheets } from "@/libs/categories";

// "Split Sheets & Documents": split sheets for music people (artists,
// producers, managers…), plus Documents (any PDF sent for e-signature) for
// everyone. People who only picked non-music roles just see Documents.
export default function SplitSheetsAndDocuments() {
  const [music, setMusic] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"split" | "docs">("split");

  useEffect(() => {
    apiClient.get("/get-user")
      .then((r: any) => setMusic(usesSplitSheets(r?.data?.category)))
      .catch(() => setMusic(true));
    try {
      if (localStorage.getItem("docs-tab") === "docs") setTab("docs");
    } catch { /* storage blocked */ }
  }, []);

  const pick = (t: "split" | "docs") => {
    setTab(t);
    try { localStorage.setItem("docs-tab", t); } catch { /* storage blocked */ }
  };

  if (music === null) return <p className="text-sm text-gray-500 p-4">Loading…</p>;
  if (!music) return <Documents />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Split Sheets &amp; Documents</h1>
        <div className="ml-auto inline-flex rounded-full bg-white p-1 shadow-sm border border-gray-200 text-sm">
          {([["split", "Split Sheets"], ["docs", "Documents"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => pick(k)}
              className={`px-3 py-1 rounded-full font-medium ${tab === k ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === "split" ? <SplitSheets /> : <Documents />}
    </div>
  );
}

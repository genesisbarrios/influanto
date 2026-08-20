"use client";

import React from "react";

export const RANGE_OPTIONS = [
  { key: "30d", label: "Last 30 days" },
  { key: "60d", label: "Last 60 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "6m", label: "Last 6 months" },
  { key: "9m", label: "Last 9 months" },
  { key: "1y", label: "Last year" },
  { key: "2y", label: "Last 2 years" },
  { key: "custom", label: "Custom range" },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

interface Props {
  range: string;
  onRangeChange: (range: string) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

export default function AnalyticsRangeSelect({
  range, onRangeChange, customStart, customEnd, onCustomStartChange, onCustomEndChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        className="select select-sm select-bordered"
        value={range}
        onChange={(e) => onRangeChange(e.target.value)}
      >
        {RANGE_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
      {range === "custom" && (
        <>
          <input
            type="date"
            className="input input-sm input-bordered"
            value={customStart}
            max={customEnd || undefined}
            onChange={(e) => onCustomStartChange(e.target.value)}
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            className="input input-sm input-bordered"
            value={customEnd}
            min={customStart || undefined}
            onChange={(e) => onCustomEndChange(e.target.value)}
          />
        </>
      )}
    </div>
  );
}

"use client";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { masterSlices, publishingSlices, splitsDiffer, type Slice } from "@/libs/splitSheetSplits";

// Ownership split donut(s) for split sheets (dashboard editor/list and the
// public generator). The PDF version lives in libs/splitSheetPie.ts.
//
// Pass `publishing` to get a second "Publishing" donut beside the master one,
// shown only when the publishing %s differ from the master %s.

type Contributor = { name?: string; ownership?: string | number };
type Publishing = { contributorName?: string; percent?: string | number };

const PIE_PALETTE = [
  "#2563eb", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#8b5cf6", "#84cc16",
];

/** @deprecated use masterSlices from libs/splitSheetSplits */
export const getOwnershipData = masterSlices;

function Donut({ data, height = 220 }: { data: Slice[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={32}
          label={({ name, value }: any) => `${name} ${value}%`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
        </Pie>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: any) => `${v}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function OwnershipPie({
  contributors,
  publishing,
  size = "large",
}: {
  contributors: Contributor[];
  publishing?: Publishing[];
  size?: "large" | "small";
}) {
  const data = masterSlices(contributors);

  if (data.length === 0) {
    return size === "small" ? null : (
      <p className="text-xs text-gray-400 text-center py-8">Add ownership % to see the split</p>
    );
  }

  if (size === "small") {
    return (
      <ResponsiveContainer width={56} height={56}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={26}>
            {data.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: any) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (publishing && splitsDiffer(contributors, publishing)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-600 text-center mt-2">Master</p>
          <Donut data={data} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 text-center mt-2">Publishing</p>
          <Donut data={publishingSlices(publishing)} />
        </div>
      </div>
    );
  }

  return <Donut data={data} />;
}

"use client";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

// Ownership split donut for split sheets (dashboard editor/list and the public
// generator). The PDF version lives in libs/splitSheetPie.ts.

type Contributor = { name?: string; ownership?: string | number };


const PIE_PALETTE = [
  "#2563eb", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#8b5cf6", "#84cc16",
];

export function getOwnershipData(contributors: Contributor[]): { name: string; value: number }[] {
  return (contributors ?? [])
    .filter(c => c.name)
    .map(c => ({ name: String(c.name), value: parseFloat(String(c.ownership).replace("%", "")) || 0 }))
    .filter(c => c.value > 0);
}

export default function OwnershipPie({ contributors, size = "large" }: { contributors: Contributor[]; size?: "large" | "small" }) {
  const data = getOwnershipData(contributors);

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

  return (
    <ResponsiveContainer width="100%" height={220}>
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


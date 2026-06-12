"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import dynamic from "next/dynamic";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { getCountryCode } from "@/data/countries";

const Flag = dynamic(() => import("react-world-flags"), { ssr: false });

export default function CountryPopularityChart({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const data = snapshot.countryPopularity.map((d) => ({
    ...d,
    label: `${d.count} de 27 quinielas`,
  }));

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        >
          <XAxis type="number" domain={[0, 27]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="country"
            width={100}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2234",
              border: "1px solid #ffffff20",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${value} de 27 quinielas`, "Pronósticos"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.country} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.slice(0, 6).map((d) => (
          <span key={d.country} className="flex items-center gap-1 text-xs text-slate-400">
            <Flag code={getCountryCode(d.country)} height={14} className="rounded-sm" />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

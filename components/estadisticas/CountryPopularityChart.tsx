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
import { chartAxisTick, chartTooltipStyle } from "@/lib/chartTheme";

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
    <div className="h-[400px] w-full animate-[fade-in_400ms_ease-out]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        >
          <XAxis type="number" domain={[0, 27]} tick={chartAxisTick} />
          <YAxis
            type="category"
            dataKey="country"
            width={100}
            tick={chartAxisTick}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [`${value} de 27 quinielas`, "Pronósticos"]}
          />
          <Bar dataKey="count" isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.country} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.slice(0, 6).map((d) => (
          <span key={d.country} className="flex items-center gap-1 text-label text-muted">
            <Flag code={getCountryCode(d.country)} height={14} className="rounded-sm" />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

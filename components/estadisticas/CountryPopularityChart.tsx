"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
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
import { quinielas } from "@/data/quinielas";
import { getCountryCode } from "@/data/countries";
import { chartAxisTick, chartTooltipStyle } from "@/lib/chartTheme";

const Flag = dynamic(() => import("react-world-flags"), { ssr: false });

export default function CountryPopularityChart({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const t = useTranslations();
  const totalQuinielas = quinielas.length;

  const data = useMemo(
    () =>
      snapshot.countryPopularity.map((d) => ({
        ...d,
        label: t("stats_country_of_total", { count: d.count, total: totalQuinielas }),
      })),
    [snapshot.countryPopularity, t, totalQuinielas]
  );

  return (
    <div className="h-[400px] w-full animate-[fade-in_400ms_ease-out]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        >
          <XAxis type="number" domain={[0, totalQuinielas]} tick={chartAxisTick} />
          <YAxis
            type="category"
            dataKey="country"
            width={100}
            tick={chartAxisTick}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [
              t("stats_country_of_total", {
                count: Number(value),
                total: totalQuinielas,
              }),
              t("stats_country_predictions_tooltip"),
            ]}
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

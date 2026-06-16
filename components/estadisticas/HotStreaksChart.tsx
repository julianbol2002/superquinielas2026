"use client";

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
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { CHART_GRID, chartAxisTick, chartTooltipStyle } from "@/lib/chartTheme";

export default function HotStreaksChart({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const t = useTranslations();
  const data = [...snapshot.streaks]
    .sort((a, b) => b.bestStreak - a.bestStreak)
    .slice(0, 15)
    .map((s) => ({
      name: s.name.length > 12 ? `${s.name.slice(0, 12)}…` : s.name,
      best: s.bestStreak,
      current: s.currentStreak,
      active: s.active,
      fullName: s.name,
    }));

  return (
    <div className="h-[360px] w-full animate-[fade-in_400ms_ease-out]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <XAxis type="number" tick={chartAxisTick} />
          <YAxis type="category" dataKey="name" width={90} tick={chartAxisTick} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value, name) => [
              value,
              name === "best" ? t("stats_streak_best") : t("stats_streak_current"),
            ]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullName ?? ""
            }
          />
          <Bar dataKey="best" name="best" fill={CHART_GRID} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill="var(--text-muted)" />
            ))}
          </Bar>
          <Bar dataKey="current" name="current" isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.active ? "var(--gold)" : "var(--border)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-label text-muted">
        <span className="inline-block h-2 w-2 bg-gold" /> {t("stats_streak_current")}
        {" · "}
        <span className="inline-block h-2 w-2 bg-border" /> {t("stats_streak_best")}
      </p>
    </div>
  );
}

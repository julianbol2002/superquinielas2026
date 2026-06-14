"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  type AnalyticsSnapshot,
  getBumpChartData,
  getTopSlugs,
} from "@/lib/analytics";
import {
  CHART_GRID,
  chartAxisTick,
  chartMargin,
  chartTooltipStyle,
} from "@/lib/chartTheme";

export default function RankBumpChart({
  snapshot,
  mobile,
}: {
  snapshot: AnalyticsSnapshot;
  mobile?: boolean;
}) {
  const slugs = useMemo(
    () => (mobile ? getTopSlugs(snapshot, 10) : snapshot.quinielaSlugs),
    [mobile, snapshot]
  );

  const data = useMemo(
    () => getBumpChartData(snapshot, slugs),
    [snapshot, slugs]
  );

  if (snapshot.playedCount < 2) {
    return (
      <p className="py-8 text-center text-body text-muted">
        Se necesitan al menos 2 partidos para el gráfico de posiciones.
      </p>
    );
  }

  function lineColor(slug: string): string {
    const ranks = snapshot.ranksOverTime[slug] ?? [];
    if (ranks.length < 2) return "var(--text-muted)";
    const delta = ranks[0] - ranks[ranks.length - 1];
    if (delta > 0) return "var(--accent)";
    if (delta < 0) return "var(--red)";
    return "var(--text-muted)";
  }

  return (
    <div className="h-[340px] w-full animate-[fade-in_400ms_ease-out]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid stroke={CHART_GRID} strokeWidth={0.5} vertical={false} />
          <XAxis dataKey="match" tick={chartAxisTick} interval={4} />
          <YAxis
            reversed
            domain={[1, snapshot.quinielaSlugs.length]}
            tick={chartAxisTick}
            width={28}
            interval={4}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value, name) => [
              `#${value}`,
              snapshot.quinielaNames[String(name)],
            ]}
          />
          {slugs.map((slug) => (
            <Line
              key={slug}
              type="monotone"
              dataKey={slug}
              stroke={lineColor(slug)}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

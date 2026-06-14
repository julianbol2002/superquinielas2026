"use client";

import { useMemo, useState } from "react";
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
  getTimelineChartData,
  getTopSlugs,
  getBottomSlugs,
} from "@/lib/analytics";
import {
  CHART_GRID,
  chartAxisTick,
  chartMargin,
  chartTooltipStyle,
} from "@/lib/chartTheme";

type FilterMode = "all" | "top5" | "bottom5";

export default function PointsTimelineChart({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const [filter, setFilter] = useState<FilterMode>("top5");

  const slugs = useMemo(() => {
    if (filter === "all") return snapshot.quinielaSlugs;
    if (filter === "top5") return getTopSlugs(snapshot, 5);
    return getBottomSlugs(snapshot, 5);
  }, [filter, snapshot]);

  const data = useMemo(
    () => getTimelineChartData(snapshot, slugs),
    [snapshot, slugs]
  );

  if (snapshot.playedCount === 0) {
    return (
      <p className="py-8 text-center text-body text-muted">
        Aún no hay partidos jugados para mostrar la línea de tiempo.
      </p>
    );
  }

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ["top5", "Top 5"],
            ["bottom5", "Bottom 5"],
            ["all", "Todas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`min-h-[44px] border px-3 py-1 text-label font-medium transition-colors duration-150 ${
              filter === key
                ? "border-accent bg-accent text-black"
                : "border-border bg-surface text-muted hover:bg-hover"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid stroke={CHART_GRID} strokeWidth={0.5} vertical={false} />
            <XAxis dataKey="match" tick={chartAxisTick} interval={4} />
            <YAxis tick={chartAxisTick} width={32} interval={4} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelFormatter={(m) => `Partido ${m}`}
              formatter={(value, name) => {
                const slug = String(name);
                return [
                  value,
                  `${snapshot.quinielaNames[slug]} (${snapshot.quinielaCaptains[slug]})`,
                ];
              }}
            />
            {slugs.map((slug) => (
              <Line
                key={slug}
                type="monotone"
                dataKey={slug}
                stroke={snapshot.colors[slug]}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

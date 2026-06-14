"use client";

import { useMemo } from "react";
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  type AnalyticsSnapshot,
  getTimelineChartData,
} from "@/lib/analytics";
import { CHART_GRID, chartAxisTick, chartTooltipStyle } from "@/lib/chartTheme";
import ChartQuinielaFilter, {
  useChartQuinielaFilter,
} from "./ChartQuinielaFilter";
import {
  FilteredQuinielaLines,
  chartMarginWithLabels,
} from "./FilteredQuinielaLines";

export default function PointsTimelineChart({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const {
    mode,
    setMode,
    slugs,
    hoveredSlug,
    setHoveredSlug,
    customSlugs,
    toggleCustomSlug,
    pickerOpen,
    setPickerOpen,
  } = useChartQuinielaFilter(snapshot);

  const data = useMemo(
    () => getTimelineChartData(snapshot, slugs),
    [snapshot, slugs]
  );

  const showLabels = mode !== "all" && slugs.length > 0;

  if (snapshot.playedCount === 0) {
    return (
      <p className="py-8 text-center text-body text-muted">
        Aún no hay partidos jugados para mostrar la línea de tiempo.
      </p>
    );
  }

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <ChartQuinielaFilter
        snapshot={snapshot}
        mode={mode}
        onModeChange={setMode}
        customSlugs={customSlugs}
        onToggleCustom={toggleCustomSlug}
        pickerOpen={pickerOpen}
        onPickerOpenChange={setPickerOpen}
      />
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMarginWithLabels}>
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
            <FilteredQuinielaLines
              snapshot={snapshot}
              slugs={slugs}
              dataLength={data.length}
              mode={mode}
              hoveredSlug={hoveredSlug}
              onHover={setHoveredSlug}
              showLabels={showLabels}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

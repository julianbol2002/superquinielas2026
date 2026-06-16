"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type AnalyticsSnapshot, getBumpChartData } from "@/lib/analytics";
import { CHART_GRID, chartAxisTick, chartTooltipStyle } from "@/lib/chartTheme";
import ChartQuinielaFilter, {
  useChartQuinielaFilter,
} from "./ChartQuinielaFilter";
import {
  FilteredQuinielaLines,
  chartMarginWithLabels,
} from "./FilteredQuinielaLines";

export default function RankBumpChart({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const t = useTranslations();
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
    () => getBumpChartData(snapshot, slugs),
    [snapshot, slugs]
  );

  const showLabels = mode !== "all" && slugs.length > 0;

  if (snapshot.playedCount < 2) {
    return (
      <p className="py-8 text-center text-body text-muted">
        {t("stats_rank_chart_empty")}
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
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMarginWithLabels}>
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

"use client";

import { Line, LabelList } from "recharts";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import type { ChartFilterMode } from "./ChartQuinielaFilter";
import { LineEndLabel } from "./LineEndLabel";

export function FilteredQuinielaLines({
  snapshot,
  slugs,
  dataLength,
  mode,
  hoveredSlug,
  onHover,
  showLabels,
}: {
  snapshot: AnalyticsSnapshot;
  slugs: string[];
  dataLength: number;
  mode: ChartFilterMode;
  hoveredSlug: string | null;
  onHover: (slug: string | null) => void;
  showLabels: boolean;
}) {
  return (
    <>
      {slugs.map((slug) => {
        const color = snapshot.colors[slug];
        const strokeOpacity =
          mode === "all"
            ? hoveredSlug === null || hoveredSlug === slug
              ? 1
              : 0.15
            : 1;

        return (
          <Line
            key={slug}
            type="monotone"
            dataKey={slug}
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={strokeOpacity}
            dot={false}
            isAnimationActive={false}
            onMouseEnter={() => mode === "all" && onHover(slug)}
            onMouseLeave={() => mode === "all" && onHover(null)}
          >
            {showLabels && (
              <LabelList
                dataKey={slug}
                content={(props) => (
                  <LineEndLabel
                    x={props.x as number | undefined}
                    y={props.y as number | undefined}
                    index={props.index}
                    dataLength={dataLength}
                    label={snapshot.quinielaNames[slug]}
                    color={color}
                  />
                )}
              />
            )}
          </Line>
        );
      })}
    </>
  );
}

export const chartMarginWithLabels = { top: 8, right: 72, left: 0, bottom: 0 };

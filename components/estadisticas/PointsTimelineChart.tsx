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
      <p className="py-8 text-center text-sm text-slate-400">
        Aún no hay partidos jugados para mostrar la línea de tiempo.
      </p>
    );
  }

  return (
    <div>
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
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === key
                ? "bg-pitch text-black"
                : "bg-white/10 text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
            <XAxis
              dataKey="match"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              label={{ value: "Partido", position: "insideBottom", offset: -2, fill: "#94a3b8" }}
            />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={32} />
            <Tooltip
              contentStyle={{
                background: "#1a2234",
                border: "1px solid #ffffff20",
                borderRadius: 8,
                fontSize: 12,
              }}
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
                strokeWidth={2}
                dot={false}
                animationDuration={1500}
                animationBegin={0}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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
      <p className="py-8 text-center text-sm text-slate-400">
        Se necesitan al menos 2 partidos para el gráfico de posiciones.
      </p>
    );
  }

  function lineColor(slug: string): string {
    const ranks = snapshot.ranksOverTime[slug] ?? [];
    if (ranks.length < 2) return "#94a3b8";
    const delta = ranks[0] - ranks[ranks.length - 1];
    if (delta > 0) return "#00D084";
    if (delta < 0) return "#FF6B6B";
    return "#94a3b8";
  }

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
          <XAxis dataKey="match" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis
            reversed
            domain={[1, snapshot.quinielaSlugs.length]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2234",
              border: "1px solid #ffffff20",
              borderRadius: 8,
              fontSize: 12,
            }}
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
              strokeWidth={2}
              dot={{ r: 2 }}
              animationDuration={1200}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

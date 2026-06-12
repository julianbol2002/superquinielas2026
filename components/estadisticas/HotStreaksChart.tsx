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
import type { AnalyticsSnapshot } from "@/lib/analytics";

export default function HotStreaksChart({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
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
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2234",
              border: "1px solid #ffffff20",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [
              value,
              name === "best" ? "Mejor racha" : "Racha actual",
            ]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullName ?? ""
            }
          />
          <Bar dataKey="best" name="best" fill="#475569" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#475569" />
            ))}
          </Bar>
          <Bar dataKey="current" name="current" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.active ? "#FFD700" : "#64748b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-slate-400">
        <span className="inline-block h-2 w-2 rounded-full bg-gold" /> Racha actual
        {" · "}
        <span className="inline-block h-2 w-2 rounded-full bg-slate-600" /> Mejor racha
      </p>
    </div>
  );
}

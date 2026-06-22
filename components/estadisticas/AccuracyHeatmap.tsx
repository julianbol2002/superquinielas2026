"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useScores } from "@/components/ScoresProvider";
import type { AnalyticsSnapshot, AccuracyCell } from "@/lib/analytics";
import { getTopSlugs } from "@/lib/analytics";

function cellClass(cell: AccuracyCell, legend: { key: AccuracyCell; className: string }[]) {
  return legend.find((l) => l.key === cell)?.className ?? "bg-slate-700";
}

export default function AccuracyHeatmap({
  snapshot,
  mobile,
}: {
  snapshot: AnalyticsSnapshot;
  mobile?: boolean;
}) {
  const t = useTranslations();
  const { pointsMap } = useScores();
  const legend = useMemo(
    () =>
      [
        { key: "exact" as const, label: t("stats_heatmap_exact"), className: "bg-emerald-600" },
        { key: "result" as const, label: t("stats_heatmap_result"), className: "bg-emerald-400/60" },
        { key: "wrong" as const, label: t("stats_heatmap_wrong"), className: "bg-red-600/70" },
        { key: "pending" as const, label: t("stats_heatmap_pending"), className: "bg-slate-600/50" },
      ],
    [t]
  );

  const slugs = mobile ? getTopSlugs(snapshot, 10, pointsMap) : snapshot.quinielaSlugs;
  const playedMatches = snapshot.matches.filter((m) => m.played);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        {legend.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${l.className}`} />
            {l.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-max text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-stadium-card px-2 py-1 text-left light:bg-white">
                {t("stats_heatmap_quiniela")}
              </th>
              {playedMatches.map((m) => (
                <th
                  key={m.id}
                  className="px-1 py-1 text-center font-normal text-slate-500"
                  title={m.label}
                >
                  {m.matchNumber}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slugs.map((slug) => (
              <tr key={slug} className="border-t border-white/5">
                <td className="sticky left-0 z-10 max-w-[100px] truncate bg-stadium-card px-2 py-1 font-medium light:bg-white">
                  {snapshot.quinielaNames[slug]}
                </td>
                {(snapshot.heatmap[slug] ?? [])
                  .slice(0, playedMatches.length)
                  .map((cell, i) => (
                    <td key={i} className="px-0.5 py-0.5">
                      <div
                        className={`mx-auto h-5 w-5 rounded-sm ${cellClass(cell, legend)}`}
                        title={playedMatches[i]?.label}
                      />
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

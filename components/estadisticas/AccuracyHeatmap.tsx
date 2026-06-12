"use client";

import type { AnalyticsSnapshot, AccuracyCell } from "@/lib/analytics";
import { getTopSlugs } from "@/lib/analytics";

const LEGEND: { key: AccuracyCell; label: string; className: string }[] = [
  { key: "exact", label: "Marcador exacto", className: "bg-emerald-600" },
  { key: "result", label: "Resultado correcto", className: "bg-emerald-400/60" },
  { key: "wrong", label: "Incorrecto", className: "bg-red-600/70" },
  { key: "pending", label: "Sin jugar", className: "bg-slate-600/50" },
];

function cellClass(cell: AccuracyCell) {
  return LEGEND.find((l) => l.key === cell)?.className ?? "bg-slate-700";
}

export default function AccuracyHeatmap({
  snapshot,
  mobile,
}: {
  snapshot: AnalyticsSnapshot;
  mobile?: boolean;
}) {
  const slugs = mobile ? getTopSlugs(snapshot, 10) : snapshot.quinielaSlugs;
  const playedMatches = snapshot.matches.filter((m) => m.played);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        {LEGEND.map((l) => (
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
                Quiniela
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
                        className={`mx-auto h-5 w-5 rounded-sm ${cellClass(cell)}`}
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

"use client";

import { Link } from "@/i18n/routing";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { getTopSlugs } from "@/lib/analytics";

export default function HeadToHeadMatrix({
  snapshot,
  mobile,
}: {
  snapshot: AnalyticsSnapshot;
  mobile?: boolean;
}) {
  const slugs = mobile ? getTopSlugs(snapshot, 10) : snapshot.quinielaSlugs.slice(0, 12);

  function cellColor(val: number): string {
    if (val > 0) return "bg-emerald-600/80 text-white";
    if (val < 0) return "bg-red-600/70 text-white";
    return "bg-slate-700/50 text-slate-400";
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max text-[10px] sm:text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-stadium-card p-1 light:bg-white" />
            {slugs.map((s) => (
              <th
                key={s}
                className="max-w-[48px] truncate px-1 py-1 font-normal text-slate-400"
                title={snapshot.quinielaNames[s]}
              >
                {snapshot.quinielaNames[s]?.slice(0, 6)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slugs.map((row) => (
            <tr key={row}>
              <td
                className="sticky left-0 z-10 max-w-[72px] truncate bg-stadium-card px-1 py-0.5 font-medium light:bg-white"
                title={snapshot.quinielaNames[row]}
              >
                {snapshot.quinielaNames[row]}
              </td>
              {slugs.map((col) => {
                if (row === col) {
                  return (
                    <td key={col} className="p-0.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-white/5">
                        —
                      </div>
                    </td>
                  );
                }
                const val = snapshot.headToHead[row]?.[col] ?? 0;
                return (
                  <td key={col} className="p-0.5">
                    <Link
                      href={`/comparar?a=${row}&b=${col}`}
                      className={`flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold transition hover:ring-2 hover:ring-pitch ${cellColor(val)}`}
                      title={`${snapshot.quinielaNames[row]} vs ${snapshot.quinielaNames[col]}`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

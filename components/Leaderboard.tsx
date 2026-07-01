"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link, useRouter } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { useLiveScores } from "@/hooks/useLiveScores";
import { getScoredPredictions } from "@/lib/predictionScoring";
import { cn } from "@/lib/utils";
import RankChange from "./RankChange";
import BetTierBadge from "./BetTierBadge";

interface LeaderboardProps {
  entries: RankedQuiniela[];
  highlightSlug?: string;
  hotStreakSlug?: string;
}

/** Color a per-match square by points earned */
function squareColor(points: number): string {
  if (points >= 3) return "#16a34a"; // green
  if (points >= 1) return "#ca8a04"; // amber
  return "#dc2626"; // red (0 pts)
}

function rankBadgeClass(rank: number): string | null {
  if (rank === 1) return "rank-badge-1";
  if (rank === 2) return "rank-badge-2";
  if (rank === 3) return "rank-badge-3";
  return null;
}

function getRowNavHandlers(slug: string, router: ReturnType<typeof useRouter>) {
  return {
    onClick: () => router.push(`/quiniela/${slug}`),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push(`/quiniela/${slug}`);
      }
    },
  };
}

export default function Leaderboard({
  entries,
  highlightSlug,
  hotStreakSlug,
}: LeaderboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const activePlayer = useAppStore((s) => s.activePlayer);
  const { data: liveData } = useLiveScores();

  const playedBySlug = useMemo(() => {
    const map = new Map<string, { points: number }[]>();
    for (const entry of entries) {
      const rows = getScoredPredictions(entry.slug, liveData?.matches ?? [])
        .filter((r) => r.played)
        .map((r) => ({ points: r.pointsEarned }));
      map.set(entry.slug, rows);
    }
    return map;
  }, [entries, liveData?.matches]);

  const totalGames = useMemo(() => {
    if (entries.length === 0) return 0;
    return getScoredPredictions(entries[0].slug, liveData?.matches ?? []).filter(
      (r) => r.phase === "group"
    ).length;
  }, [entries, liveData?.matches]);

  return (
    <div className="overflow-x-auto overflow-hidden rounded-sm border border-border bg-surface shadow-md">
      <table className="w-full text-left">
        <thead className="espn-table-head">
          <tr>
            <th className="text-center">{t("rank")}</th>
            <th className="text-center">{t("col_move")}</th>
            <th>{t("quiniela_name")}</th>
            <th className="hidden md:table-cell">{t("captain")}</th>
            <th className="hidden sm:table-cell">{t("bet")}</th>
            <th className="hidden md:table-cell">{t("col_games")}</th>
            <th className="text-right">{t("points")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isHighlighted =
              highlightSlug === entry.slug ||
              (activePlayer === entry.captain && !highlightSlug);
            const nav = getRowNavHandlers(entry.slug, router);
            const badge = rankBadgeClass(entry.rank);
            const played = playedBySlug.get(entry.slug) ?? [];

            return (
              <tr
                key={entry.slug}
                id={`quiniela-${entry.slug}`}
                data-captain={entry.captain}
                role="link"
                tabIndex={0}
                {...nav}
                className={cn(
                  "cursor-pointer border-b border-border transition-colors hover:bg-black/5 dark:hover:bg-white/5",
                  isHighlighted && "bg-espn-red/5"
                )}
              >
                <td className="px-4 py-2.5">
                  <div className="flex justify-center">
                    {badge ? (
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center font-display text-sm font-bold leading-none",
                          badge
                        )}
                      >
                        {entry.rank}
                      </span>
                    ) : (
                      <span className="font-display text-sm font-bold text-primary-theme">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-2 py-2.5 text-center">
                  <RankChange change={entry.rankChange} />
                </td>

                <td className="px-4 py-2.5">
                  <Link
                    href={`/quiniela/${entry.slug}`}
                    className="font-semibold text-primary-theme transition-colors hover:text-espn-red"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="truncate">
                      {entry.name}
                      {hotStreakSlug === entry.slug && (
                        <span className="ml-1" aria-hidden>
                          🔥
                        </span>
                      )}
                    </span>
                  </Link>
                  <span className="block truncate text-xs text-captain md:hidden">
                    {entry.captain}
                  </span>
                </td>

                <td className="hidden px-4 py-2.5 text-secondary md:table-cell">
                  {entry.captain}
                </td>

                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <BetTierBadge bet={entry.bet} />
                </td>

                <td className="hidden px-4 py-2.5 md:table-cell">
                  <div className="flex max-w-[220px] flex-wrap gap-0.5">
                    {played.length === 0 ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      played.map((sq, idx) => (
                        <span
                          key={idx}
                          className="inline-block h-4 w-4 rounded-[2px]"
                          style={{ backgroundColor: squareColor(sq.points) }}
                          title={`+${sq.points}`}
                        />
                      ))
                    )}
                  </div>
                </td>

                <td className="px-4 py-2.5 text-right">
                  <span className="font-display text-lg font-bold text-espn-red">
                    {entry.points}
                  </span>
                  <span
                    className="ml-1 text-xs text-muted"
                    title={`${played.length}/${totalGames} ${t("col_games")}`}
                  >
                    {played.length}/{totalGames}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

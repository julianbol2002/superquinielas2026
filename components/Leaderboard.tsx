"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link, useRouter } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { rankNumberClass } from "@/lib/rankStyles";
import { cn } from "@/lib/utils";
import BetTierBadge from "./BetTierBadge";
import RankChange from "./RankChange";
import PlayerAvatar from "./PlayerAvatar";
import ScoreBreakdownTooltip from "./ScoreBreakdownTooltip";
import LeaderboardBadges from "./LeaderboardBadges";
import type { QuinielaBadge } from "@/lib/badges";

interface LeaderboardProps {
  entries: RankedQuiniela[];
  highlightSlug?: string;
  badgesBySlug?: Record<string, QuinielaBadge[]>;
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
  badgesBySlug = {},
}: LeaderboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const activePlayer = useAppStore((s) => s.activePlayer);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());

  const rowClass = (rank: number, isHighlighted: boolean) =>
    cn(
      "min-h-[44px] cursor-pointer border-b border-border transition-colors hover:bg-hover",
      rank === 1 && "rank-accent-bar",
      isHighlighted && "bg-hover"
    );

  return (
    <div className="overflow-hidden border-y border-border md:border md:rounded">
      {/* Mobile */}
      <div className="sm:hidden">
        {entries.map((entry, i) => {
          const isHighlighted =
            highlightSlug === entry.slug ||
            (activePlayer === entry.captain && !highlightSlug);
          const nav = getRowNavHandlers(entry.slug, router);
          const rowBadges = badgesBySlug[entry.slug] ?? [];

          return (
            <motion.div
              key={entry.slug}
              ref={(el) => {
                if (el) rowRefs.current.set(entry.slug, el);
              }}
              id={`quiniela-${entry.slug}`}
              data-captain={entry.captain}
              role="link"
              tabIndex={0}
              {...nav}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.15 }}
              className={cn("px-4 py-2.5", rowClass(entry.rank, isHighlighted))}
            >
              <div className="flex min-h-[44px] items-center gap-2">
                <div className="flex w-5 flex-shrink-0 justify-center">
                  <RankChange change={entry.rankChange} />
                </div>
                <span
                  className={cn(
                    "w-5 flex-shrink-0 text-center font-display text-lg",
                    rankNumberClass(entry.rank)
                  )}
                >
                  {entry.rank}
                </span>
                <PlayerAvatar captain={entry.captain} size={32} className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-name transition-colors hover:text-accent">
                    {entry.name}
                    <LeaderboardBadges badges={rowBadges} />
                  </p>
                </div>
                <div
                  className="flex flex-shrink-0 items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ScoreBreakdownTooltip
                    breakdown={entry.scoreBreakdown}
                    officialPoints={entry.points}
                    size="sm"
                  />
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2 pl-[4.5rem]">
                <span className="truncate text-label text-captain">{entry.captain}</span>
                <BetTierBadge bet={entry.bet} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        <table className="w-full text-left text-body">
          <thead>
            <tr className="border-b border-border label-caps">
              <th className="px-3 py-2.5 font-normal">{t("rank")}</th>
              <th className="px-3 py-2.5 font-normal">{t("quiniela_name")}</th>
              <th className="px-3 py-2.5 font-normal">{t("captain")}</th>
              <th className="px-3 py-2.5 font-normal">{t("bet")}</th>
              <th className="px-3 py-2.5 text-right font-normal">{t("points")}</th>
              <th className="w-6 px-1 py-2.5" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isHighlighted =
                highlightSlug === entry.slug ||
                (activePlayer === entry.captain && !highlightSlug);
              const nav = getRowNavHandlers(entry.slug, router);
              const rowBadges = badgesBySlug[entry.slug] ?? [];

              return (
                <motion.tr
                  key={entry.slug}
                  ref={(el) => {
                    if (el) rowRefs.current.set(entry.slug, el);
                  }}
                  id={`quiniela-${entry.slug}-desktop`}
                  data-captain={entry.captain}
                  role="link"
                  tabIndex={0}
                  {...nav}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                  className={rowClass(entry.rank, isHighlighted)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <RankChange change={entry.rankChange} />
                      <span
                        className={cn("font-display text-xl", rankNumberClass(entry.rank))}
                      >
                        {entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[200px] px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <PlayerAvatar captain={entry.captain} size={28} className="flex-shrink-0" />
                      <Link
                        href={`/quiniela/${entry.slug}`}
                        className="min-w-0 text-name transition-colors hover:text-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="truncate font-medium">
                          {entry.name}
                          <LeaderboardBadges badges={rowBadges} />
                        </p>
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-captain">{entry.captain}</td>
                  <td className="px-3 py-2.5">
                    <BetTierBadge bet={entry.bet} />
                  </td>
                  <td className="px-3 py-2.5 text-right align-middle">
                    <ScoreBreakdownTooltip
                      breakdown={entry.scoreBreakdown}
                      officialPoints={entry.points}
                    />
                  </td>
                  <td className="px-1 py-2.5 text-right text-muted">
                    <span aria-hidden>›</span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

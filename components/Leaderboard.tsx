"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link, useRouter } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { getBetTierLabel } from "@/lib/predictionScoring";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";
import RankChange from "./RankChange";
import PlayerAvatar from "./PlayerAvatar";
import ScoreBreakdownTooltip from "./ScoreBreakdownTooltip";

interface LeaderboardProps {
  entries: RankedQuiniela[];
  highlightSlug?: string;
}

function betBadgeClass(bet: number) {
  if (bet >= 100) return "bg-gold/20 text-gold border-gold/30";
  if (bet >= 50) return "bg-pitch/20 text-pitch border-pitch/30";
  return "bg-blue-500/20 text-blue-300 light:text-blue-700 border-blue-500/30";
}

function pointBadgeClass(points: number) {
  if (points >= 6) return "bg-gold/20 text-gold";
  if (points >= 5) return "bg-pitch/25 text-pitch";
  if (points >= 4) return "bg-emerald-500/20 text-emerald-400 light:text-emerald-700";
  if (points >= 3) return "bg-blue-500/20 text-blue-300 light:text-blue-700";
  if (points >= 2) return "bg-slate-500/20 text-slate-300 light:text-slate-600";
  return "bg-white/10 text-muted";
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
}: LeaderboardProps) {
  const t = useTranslations();
  const router = useRouter();
  const activePlayer = useAppStore((s) => s.activePlayer);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (entries.length === 0) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const firstRow = rowRefs.current.get(entries[0].slug);
      if (!firstRow) return;
      const rect = firstRow.getBoundingClientRect();
      confetti({
        particleCount: 40,
        spread: 50,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ["#FFD700", "#00D084"],
        ticks: 80,
        scalar: 0.7,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [entries]);

  const getRowClass = (rank: number) => {
    if (rank === 1) return "row-gold";
    if (rank === 2) return "row-silver";
    if (rank === 3) return "row-bronze";
    return "";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 light:border-slate-200">
      {/* Mobile card layout */}
      <div className="divide-y divide-white/5 sm:hidden light:divide-slate-100">
        {entries.map((entry, i) => {
          const isHighlighted =
            highlightSlug === entry.slug ||
            (activePlayer === entry.captain && !highlightSlug);
          const nav = getRowNavHandlers(entry.slug, router);
          const tier = getBetTierLabel(entry.bet);

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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "min-h-[64px] cursor-pointer px-2 py-2.5 transition active:bg-white/5 light:active:bg-slate-50",
                getRowClass(entry.rank),
                isHighlighted && "highlight-row ring-2 ring-inset ring-pitch/50"
              )}
            >
              <div className="flex min-h-[32px] items-center gap-1.5">
                <div className="flex w-4 flex-shrink-0 justify-center">
                  <RankChange change={entry.rankChange} />
                </div>
                <span className="w-5 flex-shrink-0 text-center font-accent text-sm font-bold text-gold">
                  <CountUp value={entry.rank} />
                </span>
                <PlayerAvatar captain={entry.captain} size={32} className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="max-w-[120px] truncate font-semibold leading-tight">
                    {entry.name}
                    {entry.points >= 4 && (
                      <span className="ml-0.5" title={t("on_fire")}>
                        🔥
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className="flex flex-shrink-0 items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ScoreBreakdownTooltip
                    breakdown={entry.scoreBreakdown}
                    size="sm"
                    badgeClass={pointBadgeClass(entry.points)}
                  />
                </div>
                <span className="flex-shrink-0 pl-0.5 text-lg text-slate-500" aria-hidden>
                  ›
                </span>
              </div>

              <div className="mt-1 flex min-h-[24px] items-center gap-2 pl-[4.75rem]">
                <span className="truncate text-xs text-muted">{entry.captain}</span>
                <span className="text-muted">·</span>
                <span
                  className={cn(
                    "flex-shrink-0 rounded-full border px-1.5 py-0.5 font-accent text-[10px] font-bold uppercase tracking-wide",
                    betBadgeClass(entry.bet)
                  )}
                >
                  {tier}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-stadium-navy/50 text-xs uppercase tracking-wide text-muted light:border-slate-200 light:bg-slate-50">
              <th className="px-2 py-3 font-accent">{t("rank")}</th>
              <th className="px-2 py-3">{t("quiniela_name")}</th>
              <th className="px-2 py-3">{t("captain")}</th>
              <th className="px-2 py-3">{t("bet")}</th>
              <th className="px-2 py-3 text-right">{t("points")}</th>
              <th className="w-8 px-1 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isHighlighted =
                highlightSlug === entry.slug ||
                (activePlayer === entry.captain && !highlightSlug);
              const nav = getRowNavHandlers(entry.slug, router);
              const tier = getBetTierLabel(entry.bet);

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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "min-h-[48px] cursor-pointer border-b border-white/5 transition hover:bg-white/5 light:border-slate-100 light:hover:bg-slate-50",
                    getRowClass(entry.rank),
                    isHighlighted && "highlight-row ring-2 ring-inset ring-pitch/50"
                  )}
                >
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-4 flex-shrink-0">
                        <RankChange change={entry.rankChange} />
                      </div>
                      <span className="w-5 font-accent text-lg font-bold text-gold">
                        <CountUp value={entry.rank} />
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[200px] px-2 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <PlayerAvatar captain={entry.captain} size={32} className="flex-shrink-0" />
                      <Link
                        href={`/quiniela/${entry.slug}`}
                        className="min-w-0 hover:text-pitch"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="truncate font-semibold">
                          {entry.name}
                          {entry.points >= 4 && (
                            <span className="ml-1" title={t("on_fire")}>
                              🔥
                            </span>
                          )}
                        </p>
                      </Link>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span className="text-secondary light:text-slate-600">
                      {entry.captain}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2 py-0.5 font-accent text-xs font-bold uppercase tracking-wide",
                        betBadgeClass(entry.bet)
                      )}
                    >
                      {tier}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right align-middle">
                    <ScoreBreakdownTooltip breakdown={entry.scoreBreakdown} />
                  </td>
                  <td className="px-1 py-3 text-right text-slate-500">
                    <span aria-hidden className="text-lg">
                      ›
                    </span>
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

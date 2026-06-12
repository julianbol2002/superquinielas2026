"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";
import RankChange from "./RankChange";
import FlagChip from "./FlagChip";

interface LeaderboardProps {
  entries: RankedQuiniela[];
  highlightSlug?: string;
}

function betBadgeClass(bet: number) {
  if (bet >= 100) return "bg-gold/20 text-gold";
  if (bet >= 50) return "bg-pitch/20 text-pitch";
  return "bg-blue-500/20 text-blue-300 light:text-blue-600";
}

export default function Leaderboard({
  entries,
  highlightSlug,
}: LeaderboardProps) {
  const t = useTranslations();
  const activePlayer = useAppStore((s) => s.activePlayer);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-stadium-navy/50 text-xs uppercase tracking-wide text-slate-400 light:border-slate-200 light:bg-slate-50">
              <th className="px-2 py-3 font-accent">{t("rank")}</th>
              <th className="px-2 py-3">{t("quiniela_name")}</th>
              <th className="hidden px-2 py-3 sm:table-cell">{t("captain")}</th>
              <th className="px-2 py-3">{t("bet")}</th>
              <th className="hidden px-2 py-3 md:table-cell">{t("finalist")} 1</th>
              <th className="hidden px-2 py-3 md:table-cell">{t("finalist")} 2</th>
              <th className="hidden px-2 py-3 lg:table-cell">{t("winner")}</th>
              <th className="px-2 py-3 text-right">{t("points")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isHighlighted =
                highlightSlug === entry.slug ||
                (activePlayer === entry.captain && !highlightSlug);

              return (
                <motion.tr
                  key={entry.slug}
                  ref={(el) => {
                    if (el) rowRefs.current.set(entry.slug, el);
                  }}
                  id={`quiniela-${entry.slug}`}
                  data-captain={entry.captain}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "border-b border-white/5 transition light:border-slate-100",
                    getRowClass(entry.rank),
                    isHighlighted && "highlight-row ring-2 ring-inset ring-pitch/50"
                  )}
                >
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-accent text-lg font-bold text-gold">
                        <CountUp value={entry.rank} />
                      </span>
                      <RankChange change={entry.rankChange} />
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      href={`/jugador/${entry.slug}`}
                      className="block min-w-0 hover:text-pitch"
                    >
                      <p className="truncate font-semibold">
                        {entry.name}
                        {entry.onFire && (
                          <span className="ml-1" title={t("on_fire")}>
                            🔥
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-400 sm:hidden">
                        {entry.captain}
                      </p>
                    </Link>
                  </td>
                  <td className="hidden px-2 py-3 sm:table-cell">
                    <span className="text-slate-300 light:text-slate-600">
                      {entry.captain}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 font-accent text-xs font-bold",
                        betBadgeClass(entry.bet)
                      )}
                    >
                      ${entry.bet}
                    </span>
                  </td>
                  <td className="hidden px-2 py-3 md:table-cell">
                    <FlagChip country={entry.finalist1} size={16} />
                  </td>
                  <td className="hidden px-2 py-3 md:table-cell">
                    <FlagChip country={entry.finalist2} size={16} />
                  </td>
                  <td className="hidden px-2 py-3 lg:table-cell">
                    <FlagChip country={entry.winner} size={16} />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <span className="font-display text-2xl text-pitch">
                      <CountUp value={entry.points} />
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

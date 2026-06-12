"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { PlayerAggregate } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import PlayerAvatar from "./PlayerAvatar";
import CountUp from "./CountUp";
import RankChange from "./RankChange";
import FlagChip from "./FlagChip";

interface LeaderboardProps {
  players: PlayerAggregate[];
  highlightSlug?: string;
}

export default function Leaderboard({
  players,
  highlightSlug,
}: LeaderboardProps) {
  const t = useTranslations();
  const activePlayer = useAppStore((s) => s.activePlayer);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    if (players.length === 0) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const firstRow = rowRefs.current.get(players[0].slug);
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
  }, [players]);

  const getRowClass = (rank: number) => {
    if (rank === 1) return "row-gold";
    if (rank === 2) return "row-silver";
    if (rank === 3) return "row-bronze";
    return "";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 light:border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[340px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-stadium-navy/50 text-xs uppercase tracking-wide text-slate-400 light:border-slate-200 light:bg-slate-50">
              <th className="px-3 py-3 font-accent">{t("rank")}</th>
              <th className="px-3 py-3">{t("player")}</th>
              <th className="px-3 py-3 text-right">{t("points")}</th>
              <th className="hidden px-3 py-3 sm:table-cell">{t("winner")}</th>
              <th className="hidden px-3 py-3 md:table-cell">{t("bet")}</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, i) => {
              const isHighlighted =
                highlightSlug === player.slug ||
                (activePlayer === player.captain && !highlightSlug);
              const topFinalists = Array.from(
                new Set(
                  player.quinielas.flatMap((q) => [q.finalist1, q.finalist2])
                )
              ).slice(0, 3);

              return (
                <motion.tr
                  key={player.slug}
                  ref={(el) => {
                    if (el) rowRefs.current.set(player.slug, el);
                  }}
                  id={`player-${player.slug}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "border-b border-white/5 transition light:border-slate-100",
                    getRowClass(player.rank),
                    isHighlighted && "highlight-row ring-2 ring-inset ring-pitch/50"
                  )}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-accent text-lg font-bold text-gold">
                        <CountUp value={player.rank} />
                      </span>
                      <RankChange change={player.rankChange} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/jugador/${player.slug}`}
                      className="flex items-center gap-3 hover:text-pitch"
                    >
                      <PlayerAvatar captain={player.captain} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {player.captain}
                          {player.onFire && (
                            <span className="ml-1" title={t("on_fire")}>
                              🔥
                            </span>
                          )}
                        </p>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400 light:bg-slate-100">
                          {player.quinielaCount} {t("quiniela_count").toLowerCase()}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-display text-2xl text-pitch">
                      <CountUp value={player.totalPoints} />
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {topFinalists.map((c) => (
                        <FlagChip key={c} country={c} size={16} />
                      ))}
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <span className="font-accent text-slate-300 light:text-slate-600">
                      ${player.totalBet}
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

"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import type { PlayerAggregate } from "@/data/quinielas";
import { getStatHighlights } from "@/data/quinielas";

interface StatCardsProps {
  players: PlayerAggregate[];
}

export default function StatCards({ players }: StatCardsProps) {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const stats = getStatHighlights(players);

  const cards = [
    {
      icon: "🏆",
      label: t("leader"),
      value: stats.leader?.captain.split(" ")[0] ?? "—",
      sub: `${stats.leader?.totalPoints ?? 0} ${t("points").toLowerCase()}`,
    },
    {
      icon: "🚀",
      label: t("biggest_climber"),
      value: stats.biggestClimber?.captain.split(" ")[0] ?? "—",
      sub:
        stats.biggestClimber && stats.biggestClimber.rankChange > 0
          ? `↑ ${stats.biggestClimber.rankChange}`
          : "—",
    },
    {
      icon: "💀",
      label: t("biggest_faller"),
      value: stats.biggestFaller?.captain.split(" ")[0] ?? "—",
      sub:
        stats.biggestFaller && stats.biggestFaller.rankChange < 0
          ? `↓ ${Math.abs(stats.biggestFaller.rankChange)}`
          : "—",
    },
    {
      icon: "🎯",
      label: t("most_accurate"),
      value: stats.mostAccurate?.captain.split(" ")[0] ?? "—",
      sub: `${stats.mostAccurate?.correctWinners ?? 0} ${t("accuracy").toLowerCase()}`,
    },
    {
      icon: "💰",
      label: t("biggest_bet"),
      value: stats.biggestBet?.captain.split(" ")[0] ?? "—",
      sub: `$${stats.biggestBet?.totalBet ?? 0}`,
    },
    {
      icon: "⚡",
      label: t("perfect_streak"),
      value:
        stats.perfectStreak.length > 0
          ? stats.perfectStreak
              .slice(0, 2)
              .map((p) => p.captain.split(" ")[0])
              .join(", ")
          : "—",
      sub: "5+ pts",
    },
  ];

  return (
    <div
      ref={ref}
      className="mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto hide-scrollbar pb-2"
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: i * 0.08 }}
          className="min-w-[160px] flex-shrink-0 snap-start rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white light:shadow-sm"
        >
          <span className="text-2xl">{card.icon}</span>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400 light:text-slate-500">
            {card.label}
          </p>
          <p className="mt-1 truncate font-semibold">{card.value}</p>
          <p className="text-sm text-pitch">{card.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

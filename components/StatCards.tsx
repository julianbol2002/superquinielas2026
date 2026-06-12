"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { formatQuinielaLabel, getStatHighlights } from "@/data/quinielas";

interface StatCardsProps {
  entries: RankedQuiniela[];
}

export default function StatCards({ entries }: StatCardsProps) {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const stats = getStatHighlights(entries);

  const cards = [
    {
      icon: "🏆",
      label: t("leader"),
      value: stats.leader
        ? formatQuinielaLabel(stats.leader)
        : "—",
      sub: `${stats.leader?.points ?? 0} ${t("points").toLowerCase()}`,
    },
    {
      icon: "🚀",
      label: t("biggest_climber"),
      value: stats.biggestClimber
        ? formatQuinielaLabel(stats.biggestClimber)
        : "—",
      sub:
        stats.biggestClimber && stats.biggestClimber.rankChange > 0
          ? `↑ ${stats.biggestClimber.rankChange}`
          : "—",
    },
    {
      icon: "💀",
      label: t("biggest_faller"),
      value: stats.biggestFaller
        ? formatQuinielaLabel(stats.biggestFaller)
        : "—",
      sub:
        stats.biggestFaller && stats.biggestFaller.rankChange < 0
          ? `↓ ${Math.abs(stats.biggestFaller.rankChange)}`
          : "—",
    },
    {
      icon: "🎯",
      label: t("most_accurate"),
      value: stats.mostAccurate
        ? formatQuinielaLabel(stats.mostAccurate)
        : "—",
      sub: stats.mostAccurate?.correctWinner
        ? t("accuracy").toLowerCase()
        : "—",
    },
    {
      icon: "💰",
      label: t("biggest_bet"),
      value: stats.biggestBet
        ? formatQuinielaLabel(stats.biggestBet)
        : "—",
      sub: `$${stats.biggestBet?.bet ?? 0}`,
    },
    {
      icon: "⚡",
      label: t("perfect_streak"),
      value:
        stats.perfectStreak.length > 0
          ? stats.perfectStreak
              .slice(0, 2)
              .map((q) => q.name)
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
          className="min-w-[200px] flex-shrink-0 snap-start rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white light:shadow-sm"
        >
          <span className="text-2xl">{card.icon}</span>
          <p className="mt-2 text-xs uppercase tracking-wide text-muted">
            {card.label}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold">{card.value}</p>
          <p className="text-sm text-pitch">{card.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

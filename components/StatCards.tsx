"use client";

import { useTranslations } from "next-intl";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  CheckCircle2,
  DollarSign,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { RankedQuiniela } from "@/data/quinielas";
import { formatQuinielaLabel, getStatHighlights } from "@/data/quinielas";
import { getPredictionHighlights } from "@/lib/predictionHighlights";
import type { LiveMatch } from "@/lib/liveScores";

interface StatCardsProps {
  entries: RankedQuiniela[];
  liveMatches?: LiveMatch[];
  rankHistoryReady?: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex h-20 max-h-20 min-w-[148px] flex-shrink-0 snap-start flex-col justify-center border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-1.5 label-caps">
        <Icon size={12} strokeWidth={1.75} className="text-muted" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 truncate text-body font-medium text-primary-theme">{value}</p>
      <p className="truncate text-label text-muted">{sub}</p>
    </div>
  );
}

export default function StatCards({
  entries,
  liveMatches = [],
  rankHistoryReady = false,
}: StatCardsProps) {
  const t = useTranslations();
  const stats = getStatHighlights(entries);
  const useRankMovement = rankHistoryReady;
  const predictionStats = getPredictionHighlights(entries, liveMatches);

  const movementCards = useRankMovement
    ? [
        {
          icon: TrendingUp,
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
          icon: TrendingDown,
          label: t("biggest_faller"),
          value: stats.biggestFaller
            ? formatQuinielaLabel(stats.biggestFaller)
            : "—",
          sub:
            stats.biggestFaller && stats.biggestFaller.rankChange < 0
              ? `↓ ${Math.abs(stats.biggestFaller.rankChange)}`
              : "—",
        },
      ]
    : [
        {
          icon: Target,
          label: t("stat_most_exact"),
          value: predictionStats.mostExact
            ? formatQuinielaLabel(predictionStats.mostExact)
            : "—",
          sub:
            predictionStats.mostExactCount > 0
              ? `${predictionStats.mostExactCount} ${t("stat_exact_label")}`
              : "—",
        },
        {
          icon: Flame,
          label: t("stat_longest_streak"),
          value: predictionStats.longestStreak
            ? formatQuinielaLabel(predictionStats.longestStreak)
            : "—",
          sub:
            predictionStats.longestStreakCount > 0
              ? `${predictionStats.longestStreakCount} ${t("stat_streak_label")}`
              : "—",
        },
      ];

  const cards = [
    {
      icon: Trophy,
      label: t("leader"),
      value: stats.leader ? formatQuinielaLabel(stats.leader) : "—",
      sub: `${stats.leader?.points ?? 0} ${t("points").toLowerCase()}`,
    },
    ...movementCards,
    {
      icon: CheckCircle2,
      label: t("most_accurate"),
      value: stats.mostAccurate
        ? formatQuinielaLabel(stats.mostAccurate)
        : "—",
      sub: stats.mostAccurate?.correctWinner
        ? t("accuracy").toLowerCase()
        : "—",
    },
    {
      icon: DollarSign,
      label: t("biggest_bet"),
      value: stats.biggestBet ? formatQuinielaLabel(stats.biggestBet) : "—",
      sub: `$${stats.biggestBet?.bet ?? 0}`,
    },
    {
      icon: Zap,
      label: t("perfect_streak"),
      value:
        stats.perfectStreak.length > 0
          ? stats.perfectStreak
              .slice(0, 2)
              .map((q) => q.name)
              .join(", ")
          : "—",
      sub: "4+ pts",
    },
  ];

  return (
    <div className="mb-4 flex snap-x snap-mandatory gap-2 overflow-x-auto hide-scrollbar px-4 md:px-0">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

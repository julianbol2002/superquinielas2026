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
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="stat-card-game flex h-[5.25rem] max-h-[5.25rem] min-w-[152px] flex-shrink-0 snap-start flex-col justify-center px-3 py-2"
      style={{ borderLeftColor: accent }}
    >
      <div className="relative z-[1] flex items-center gap-1.5 label-caps">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-sm"
          style={{ background: `color-mix(in srgb, ${accent} 20%, transparent)` }}
        >
          <Icon size={12} strokeWidth={2} style={{ color: accent }} />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <p className="relative z-[1] mt-1 truncate text-body font-semibold text-heading">
        {value}
      </p>
      <p className="relative z-[1] truncate text-label text-muted">{sub}</p>
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
          accent: "#00cc66",
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
          accent: "#ff6b6b",
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
          accent: "var(--accent)",
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
          accent: "#fb923c",
        },
      ];

  const cards = [
    {
      icon: Trophy,
      label: t("leader"),
      value: stats.leader ? formatQuinielaLabel(stats.leader) : "—",
      sub: `${stats.leader?.points ?? 0} ${t("points").toLowerCase()}`,
      accent: "#f5c518",
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
      accent: "var(--accent)",
    },
    {
      icon: DollarSign,
      label: t("biggest_bet"),
      value: stats.biggestBet ? formatQuinielaLabel(stats.biggestBet) : "—",
      sub: `$${stats.biggestBet?.bet ?? 0}`,
      accent: "#f5c518",
    },
    {
      icon: Zap,
      label: t("perfect_streak"),
      value:
        predictionStats.perfectMatchEntries.length > 0
          ? predictionStats.perfectMatchEntries
              .slice(0, 2)
              .map((q) => q.name)
              .join(", ")
          : "—",
      sub:
        predictionStats.perfectMatchBestCount > 0
          ? `${predictionStats.perfectMatchBestCount}× ${t("stat_high_point_matches")}`
          : "4+ pts",
      accent: "#fb923c",
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

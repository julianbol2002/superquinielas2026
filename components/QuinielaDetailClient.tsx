"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  quinielas,
  slugToQuiniela,
} from "@/data/quinielas";
import { worldCupGroups } from "@/data/countries";
import {
  computePredictionStats,
  getBetTierLabel,
  getScoredPredictions,
  type ScoredPredictionRow,
  type RowAccuracy,
} from "@/lib/predictionScoring";
import { useLiveScores } from "@/hooks/useLiveScores";
import { useRankedQuinielas } from "@/hooks/useRankedQuinielas";
import PlayerAvatar from "@/components/PlayerAvatar";
import ShareCard from "@/components/ShareCard";
import AvatarUpload from "@/components/AvatarUpload";
import CountUp from "@/components/CountUp";
import MatchTeamsRow from "@/components/MatchTeamsRow";
import FlagChip from "@/components/FlagChip";
import { cn } from "@/lib/utils";

function rowClass(accuracy: RowAccuracy, played: boolean): string {
  if (accuracy === "missing") {
    return "opacity-50 bg-white/[0.02] light:bg-slate-50";
  }
  if (!played || accuracy === "pending") {
    return "bg-white/[0.03] light:bg-slate-50";
  }
  if (accuracy === "exact") {
    return "bg-emerald-900/50 light:bg-emerald-100";
  }
  if (accuracy === "result") {
    return "bg-emerald-900/25 light:bg-emerald-50";
  }
  return "bg-red-900/30 light:bg-red-50";
}

function betBadgeClass(bet: number) {
  if (bet >= 100) return "bg-gold/20 text-gold border-gold/30";
  if (bet >= 50) return "bg-pitch/20 text-pitch border-pitch/30";
  return "bg-blue-500/20 text-blue-300 light:text-blue-700 border-blue-500/30";
}

function PredictionsTable({ rows }: { rows: ScoredPredictionRow[] }) {
  const t = useTranslations();
  const groupRows = rows.filter((r) => r.phase === "group");
  const knockoutRows = rows.filter((r) => r.phase !== "group");

  const byGroup = useMemo(() => {
    const map = new Map<string, ScoredPredictionRow[]>();
    for (const g of worldCupGroups) {
      map.set(
        g.name,
        groupRows.filter((r) => r.group === g.name)
      );
    }
    return map;
  }, [groupRows]);

  const phaseLabels: Record<string, string> = {
    quarter: t("phase_quarters"),
    semi: t("phase_semis"),
    final: t("phase_final"),
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-2xl tracking-wide text-pitch">
          {t("stage_group")}
        </h2>
        {worldCupGroups.map((g) => {
          const matches = byGroup.get(g.name) ?? [];
          if (matches.length === 0) return null;
          return (
            <div key={g.name} className="mb-6">
              <h3 className="mb-2 font-accent text-sm uppercase tracking-wider text-gold">
                {t("group")} {g.name}
              </h3>
              <div className="overflow-hidden rounded-xl border border-white/10 light:border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-stadium-navy/50 text-xs uppercase text-slate-400 light:border-slate-200 light:bg-slate-50">
                        <th className="px-3 py-2 text-left">{t("match_teams")}</th>
                        <th className="px-3 py-2 text-center">{t("actual_result")}</th>
                        <th className="px-3 py-2 text-right">{t("match_points")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((row) => (
                        <MatchRow key={row.id} row={row} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {knockoutRows.length > 0 && (
        <section>
          {(["quarter", "semi", "final"] as const).map((phase) => {
            const phaseMatches = knockoutRows.filter((r) => r.phase === phase);
            if (phaseMatches.length === 0) return null;
            return (
              <div key={phase} className="mb-6">
                <h2 className="mb-4 font-display text-2xl tracking-wide text-pitch">
                  {phaseLabels[phase]}
                </h2>
                <div className="overflow-hidden rounded-xl border border-white/10 light:border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <tbody>
                        {phaseMatches.map((row) => (
                          <MatchRow key={row.id} row={row} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function MatchRow({ row }: { row: ScoredPredictionRow }) {
  const t = useTranslations();

  const predictedLabel =
    row.predicted === null
      ? "—"
      : `${row.predicted.score1} - ${row.predicted.score2}`;

  const actualLabel =
    row.played && row.actualScore1 !== null && row.actualScore2 !== null
      ? `${row.actualScore1} - ${row.actualScore2}`
      : "—";

  const pointsLabel =
    row.accuracy === "missing"
      ? "—"
      : !row.played
        ? "—"
        : String(row.pointsEarned);

  return (
    <tr
      className={cn(
        "border-b border-white/5 transition light:border-slate-100",
        rowClass(row.accuracy, row.played)
      )}
    >
      <td className="px-3 py-3">
        <MatchTeamsRow
          team1={row.team1}
          team2={row.team2}
          scoreLine={predictedLabel !== "—" ? predictedLabel : undefined}
          showGoleadaBadge={row.goleadaBonus}
          goleadaLabel={t("goleada_short")}
          compactNames
        />
      </td>
      <td className="px-3 py-2 text-center text-muted">{actualLabel}</td>
      <td className="px-3 py-2 text-right font-display text-xl text-pitch">
        {pointsLabel}
      </td>
    </tr>
  );
}

function StatMiniCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl text-pitch">{value}</p>
      {detail && (
        <p className="mt-1 text-xs text-muted line-clamp-2">{detail}</p>
      )}
    </div>
  );
}

export default function QuinielaDetailClient({ slug }: { slug: string }) {
  const t = useTranslations();
  const quiniela = slugToQuiniela(slug);
  const { data: liveData } = useLiveScores();
  const allEntries = useRankedQuinielas(liveData?.matches ?? []);

  const entry = useMemo(() => {
    if (!quiniela) return null;
    return allEntries.find((q) => q.slug === slug) ?? null;
  }, [quiniela, slug, allEntries]);

  const rows = useMemo(
    () => getScoredPredictions(slug, liveData?.matches ?? []),
    [slug, liveData?.matches]
  );

  const stats = useMemo(() => computePredictionStats(rows), [rows]);

  if (!quiniela || !entry) {
    notFound();
  }

  const tier = getBetTierLabel(entry.bet);
  const totalQuinielas = quinielas.length;

  return (
    <div className="pb-10">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-muted hover:text-pitch"
      >
        ← {t("back")}
      </Link>

      <header className="mb-8 rounded-2xl border border-white/10 bg-stadium-card p-6 light:border-slate-200 light:bg-white">
        <div className="flex flex-col items-center text-center">
          <PlayerAvatar captain={entry.captain} size={96} />
          <h1 className="mt-4 font-display text-4xl tracking-wide md:text-5xl">
            {entry.name}
          </h1>
          <p className="mt-1 text-muted">{entry.captain}</p>

          <span
            className={cn(
              "mt-3 inline-block rounded-full border px-4 py-1 font-accent text-sm font-bold tracking-wider",
              betBadgeClass(entry.bet)
            )}
          >
            {tier}
          </span>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
            <div>
              <p className="font-display text-4xl text-pitch">
                <CountUp value={entry.points} />
              </p>
              <p className="text-xs text-muted">{t("points")}</p>
            </div>
            <div>
              <p className="font-accent text-2xl text-gold">
                #{entry.rank}
                <span className="text-sm text-muted">
                  {" "}
                  / {totalQuinielas}
                </span>
              </p>
              <p className="text-xs text-muted">{t("rank")}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-center gap-4">
            <div className="flex items-center gap-2">
              <FlagChip country={entry.finalist1} showLabel size={22} />
              <FlagChip country={entry.finalist2} showLabel size={22} />
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-1 text-lg" aria-hidden>
                👑
              </span>
              <FlagChip country={entry.winner} showLabel size={28} />
            </div>
          </div>

          <div className="mt-4">
            <AvatarUpload captain={entry.captain} />
          </div>
        </div>
      </header>

      <div className="mb-8">
        <ShareCard entry={entry} />
      </div>

      <PredictionsTable rows={rows} />

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label={t("stat_exact_scores")} value={stats.exactScores} />
        <StatMiniCard
          label={t("stat_correct_results")}
          value={stats.correctResults}
        />
        <StatMiniCard
          label={t("stat_wrong_predictions")}
          value={stats.wrongPredictions}
        />
        <StatMiniCard
          label={t("stat_accuracy_pct")}
          value={`${stats.accuracyPct}%`}
        />
        <StatMiniCard
          label={t("stat_best_match")}
          value={
            stats.bestMatch
              ? `+${stats.bestMatch.pointsEarned}`
              : "—"
          }
          detail={
            stats.bestMatch
              ? `${stats.bestMatch.team1} vs ${stats.bestMatch.team2}`
              : undefined
          }
        />
        <StatMiniCard
          label={t("stat_hot_streak")}
          value={stats.currentHotStreak}
        />
      </section>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { quinielas, slugToQuiniela } from "@/data/quinielas";
import { getCountryAbbrev } from "@/data/countries";
import { ACTUAL_CHAMPION, ACTUAL_FINALISTS } from "@/data/tournamentResults";
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
import FlagChip from "@/components/FlagChip";
import { cn } from "@/lib/utils";

/** Running-total color: red (low efficiency) → green (high efficiency) */
function cumulativeGradient(progress: number): string {
  const p = Math.max(0, Math.min(1, progress));
  const hue = Math.round(p * 120);
  return `hsl(${hue}, 65%, 42%)`;
}

function maxForPhase(phase: ScoredPredictionRow["phase"]): number {
  return phase === "group" ? 6 : 9;
}

function rowTint(accuracy: RowAccuracy, played: boolean): string {
  if (!played) return "bg-surface";
  if (accuracy === "exact") return "bg-yellow-900/15";
  if (accuracy === "result") return "bg-green-600/10";
  if (accuracy === "wrong") return "bg-red-600/10";
  return "bg-surface";
}

function ResultBadge({ row }: { row: ScoredPredictionRow }) {
  const t = useTranslations();
  if (!row.played || row.accuracy === "pending" || row.accuracy === "missing") {
    return <span className="text-xs text-muted">{t("result_pending")}</span>;
  }
  const map: Record<"exact" | "result" | "wrong", { label: string; color: string }> = {
    exact: { label: t("result_exact"), color: "var(--gold)" },
    result: { label: t("result_correct"), color: "var(--green)" },
    wrong: { label: t("result_wrong"), color: "var(--accent)" },
  };
  const info = map[row.accuracy as "exact" | "result" | "wrong"];
  return (
    <span className="text-xs font-semibold" style={{ color: info.color }}>
      {info.label}
    </span>
  );
}

function BracketTable({ rows }: { rows: ScoredPredictionRow[] }) {
  const t = useTranslations();

  let cumulative = 0;
  let cumulativeMax = 0;
  const withTotals = rows.map((row) => {
    cumulative += row.played ? row.pointsEarned : 0;
    cumulativeMax += maxForPhase(row.phase);
    const progress = cumulativeMax > 0 ? cumulative / cumulativeMax : 0;
    return { row, cumulative, progress };
  });

  return (
    <div className="overflow-x-auto rounded-sm border border-border bg-surface shadow-md">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="espn-table-head">
          <tr>
            <th className="text-center">#</th>
            <th>{t("match_teams")}</th>
            <th className="text-center">{t("their_pick")}</th>
            <th className="text-center">{t("actual_score")}</th>
            <th className="text-center">{t("match_points")}</th>
            <th className="text-center">{t("col_result")}</th>
            <th className="text-right">{t("running_total")}</th>
          </tr>
        </thead>
        <tbody>
          {withTotals.map(({ row, cumulative: total, progress }) => {
            const pick = row.predicted
              ? `${row.predicted.score1}-${row.predicted.score2}`
              : "—";
            const actual =
              row.played && row.actualScore1 !== null && row.actualScore2 !== null
                ? `${row.actualScore1}-${row.actualScore2}`
                : "—";
            const pts = row.played && row.predicted ? String(row.pointsEarned) : "—";

            return (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border",
                  rowTint(row.accuracy, row.played)
                )}
              >
                <td className="px-3 py-2 text-center text-muted">{row.matchNumber}</td>
                <td className="px-3 py-2 font-medium text-primary-theme">
                  {getCountryAbbrev(row.team1)}{" "}
                  <span className="text-muted">v</span>{" "}
                  {getCountryAbbrev(row.team2)}
                  {row.phase !== "group" && (
                    <span className="ml-2 text-[10px] uppercase text-muted">
                      {row.group}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center font-semibold text-primary-theme">
                  {pick}
                </td>
                <td className="px-3 py-2 text-center text-secondary">{actual}</td>
                <td className="px-3 py-2 text-center font-display font-bold text-espn-red">
                  {pts}
                </td>
                <td className="px-3 py-2 text-center">
                  <ResultBadge row={row} />
                </td>
                <td className="px-3 py-2 text-right font-display text-base font-bold">
                  <span style={{ color: cumulativeGradient(progress) }}>{total}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BonusPick({
  label,
  country,
  earned,
}: {
  label: string;
  country: string;
  earned: boolean | null;
}) {
  const t = useTranslations();
  const state =
    earned === null
      ? { text: t("bonus_undecided"), color: "var(--text-muted)" }
      : earned
        ? { text: t("bonus_earned"), color: "var(--green)" }
        : { text: t("bonus_not_earned"), color: "var(--accent)" };
  return (
    <div className="glass-card flex flex-col gap-1 rounded-sm border-t-2 border-espn-red/40 p-3">
      <span className="label-caps">{label}</span>
      <FlagChip country={country} showLabel size={20} />
      <span className="text-xs font-semibold" style={{ color: state.color }}>
        {state.text}
      </span>
    </div>
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
    <div className="glass-card rounded-sm p-4">
      <p className="label-caps">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-espn-red">{value}</p>
      {detail && <p className="mt-1 line-clamp-2 text-xs text-muted">{detail}</p>}
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

  // The 2026 knockout results are not decided yet — bonus picks stay undecided.
  const finalists = ACTUAL_FINALISTS as readonly string[];
  const tournamentDecided = false;
  const finalist1Earned = tournamentDecided ? finalists.includes(entry.finalist1) : null;
  const finalist2Earned = tournamentDecided ? finalists.includes(entry.finalist2) : null;
  const championEarned = tournamentDecided
    ? entry.winner === ACTUAL_CHAMPION
    : null;

  return (
    <div className="pb-10">
      <Link href="/" className="mb-4 inline-block text-sm text-muted hover:text-espn-red">
        ← {t("back")}
      </Link>

      <header className="glass-card mb-8 rounded-sm p-6">
        <div className="flex flex-col items-center text-center">
          <PlayerAvatar captain={entry.captain} size={96} />
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            {entry.name}
          </h1>
          <p className="mt-1 text-muted">{entry.captain}</p>

          <span className="mt-3 inline-block text-sm font-semibold text-secondary">
            {tier} · ${entry.bet}
          </span>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
            <div>
              <p className="font-display text-4xl font-bold text-espn-red">
                <CountUp value={entry.points} />
              </p>
              <p className="label-caps">{t("points")}</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">
                #{entry.rank}
                <span className="text-sm text-muted"> / {totalQuinielas}</span>
              </p>
              <p className="label-caps">{t("rank")}</p>
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

      <section className="mb-6">
        <h2 className="mb-3 font-display text-xl font-bold text-section">
          {t("bonus_picks")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <BonusPick
            label={`${t("finalist")} 1`}
            country={entry.finalist1}
            earned={finalist1Earned}
          />
          <BonusPick
            label={`${t("finalist")} 2`}
            country={entry.finalist2}
            earned={finalist2Earned}
          />
          <BonusPick
            label={t("champion")}
            country={entry.winner}
            earned={championEarned}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl font-bold text-section">
          {t("bracket_title")}
        </h2>
        <BracketTable rows={rows} />
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label={t("stat_exact_scores")} value={stats.exactScores} />
        <StatMiniCard label={t("stat_correct_results")} value={stats.correctResults} />
        <StatMiniCard label={t("stat_wrong_predictions")} value={stats.wrongPredictions} />
        <StatMiniCard label={t("stat_accuracy_pct")} value={`${stats.accuracyPct}%`} />
        <StatMiniCard
          label={t("stat_best_match")}
          value={stats.bestMatch ? `+${stats.bestMatch.pointsEarned}` : "—"}
          detail={
            stats.bestMatch
              ? `${stats.bestMatch.team1} vs ${stats.bestMatch.team2}`
              : undefined
          }
        />
        <StatMiniCard label={t("stat_hot_streak")} value={stats.currentHotStreak} />
      </section>
    </div>
  );
}

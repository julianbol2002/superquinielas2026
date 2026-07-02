"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { quinielas, quinielaToSlug } from "@/data/quinielas";
import { getCountryAbbrev, getAllGroupFixtures } from "@/data/countries";
import { getPredictionsForSlug, type PredictionScore } from "@/data/predictions";
import { KNOCKOUT_PICKS } from "@/data/knockoutPicks";
import { R32_FIXTURES } from "@/data/knockoutFixtures";
import { resultKeyFromTeams } from "@/data/tournamentResults";
import { scoreMatchPrediction } from "@/lib/quinielaScoring";
import type { RowAccuracy } from "@/lib/predictionScoring";
import { useLiveScores } from "@/hooks/useLiveScores";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type RoundKey = "group" | "r32" | "r16" | "qf" | "sf" | "final";

/** Sentinel dropdown value: show the full matrix instead of one quiniela. */
const VIEW_ALL = "__all__";

const ROUNDS: { key: RoundKey; labelKey: string }[] = [
  { key: "r32", labelKey: "round_r32" },
  { key: "r16", labelKey: "round_r16" },
  { key: "qf", labelKey: "round_qf" },
  { key: "sf", labelKey: "round_sf" },
  { key: "final", labelKey: "round_final" },
];

interface Fixture {
  team1: string;
  team2: string;
  stage: "group" | "knockout";
  matchNumber: number;
  /** key into a quiniela's predictions map, or null when no picks exist for it */
  predKey: string | null;
}

interface Cell {
  predicted: PredictionScore;
  accuracy: RowAccuracy;
  played: boolean;
}

function fixturesForRound(round: RoundKey): Fixture[] {
  if (round === "group") {
    return getAllGroupFixtures().map((f, i) => ({
      team1: f.team1,
      team2: f.team2,
      stage: "group",
      matchNumber: i + 1,
      predKey: `${f.group}-${f.team1}-${f.team2}`,
    }));
  }
  if (round === "r32") {
    return R32_FIXTURES.map(([team1, team2], i) => ({
      team1,
      team2,
      stage: "knockout",
      matchNumber: 72 + i + 1,
      // Knockout picks come from KNOCKOUT_PICKS (keyed by team-pair), not predKey.
      predKey: null,
    }));
  }
  return [];
}

function accuracyOf(
  predicted: PredictionScore,
  result: { score1: number; score2: number } | undefined,
  stage: "group" | "knockout"
): { accuracy: RowAccuracy; played: boolean } {
  if (!predicted) return { accuracy: "missing", played: !!result };
  if (!result) return { accuracy: "pending", played: false };
  const s = scoreMatchPrediction(predicted, result.score1, result.score2, stage);
  const accuracy: RowAccuracy = s.exact ? "exact" : s.correctResult ? "result" : "wrong";
  return { accuracy, played: true };
}

function cellStyle(accuracy: RowAccuracy, played: boolean): React.CSSProperties {
  if (!played) return {};
  if (accuracy === "exact") return { background: "#854d0e33", color: "#a16207" };
  if (accuracy === "result") return { background: "#16a34a22", color: "#15803d" };
  if (accuracy === "wrong") return { background: "#dc262622", color: "#b91c1c" };
  return {};
}

/** Short label for a quiniela — its bracket name (captains often share a surname) */
function abbrevName(name: string): string {
  const base = name.trim();
  return base.length > 12 ? base.slice(0, 12) : base;
}

export default function AllPicksGrid() {
  const t = useTranslations();
  const { data: liveData } = useLiveScores();
  const matches = liveData?.matches ?? [];

  const [round, setRound] = useState<RoundKey>("r32");
  const [selectedSlug, setSelectedSlug] = useState(
    quinielaToSlug(quinielas[0]?.name ?? "")
  );

  const resultMap = useMemo(() => {
    const m = new Map<string, { score1: number; score2: number }>();
    for (const match of matches) {
      if (match.status === "scheduled") continue;
      m.set(resultKeyFromTeams(match.team1, match.team2), {
        score1: match.score1,
        score2: match.score2,
      });
    }
    return m;
  }, [matches]);

  const fixtures = useMemo(() => fixturesForRound(round), [round]);

  const columns = useMemo(() => {
    return quinielas.map((q) => {
      const slug = quinielaToSlug(q.name);
      const preds = getPredictionsForSlug(slug) ?? {};
      const cells: Cell[] = fixtures.map((fx) => {
        const predicted: PredictionScore = fx.predKey
          ? preds[fx.predKey] ?? null
          : KNOCKOUT_PICKS[slug]?.[resultKeyFromTeams(fx.team1, fx.team2)] ?? null;
        const result = resultMap.get(resultKeyFromTeams(fx.team1, fx.team2));
        const { accuracy, played } = accuracyOf(predicted, result, fx.stage);
        return { predicted, accuracy, played };
      });
      return {
        name: q.name,
        captain: q.captain,
        slug,
        abbrev: abbrevName(q.name),
        cells,
      };
    });
  }, [fixtures, resultMap]);

  const perFixture = useMemo(() => {
    return fixtures.map((fx, i) => {
      const result = resultMap.get(resultKeyFromTeams(fx.team1, fx.team2));
      let correctCount = 0;
      let predictedCount = 0;
      const tally = new Map<string, number>();
      for (const col of columns) {
        const cell = col.cells[i];
        if (!cell) continue;
        if (cell.predicted) {
          predictedCount += 1;
          const key = `${cell.predicted.score1}-${cell.predicted.score2}`;
          tally.set(key, (tally.get(key) ?? 0) + 1);
        }
        if (cell.played && (cell.accuracy === "exact" || cell.accuracy === "result")) {
          correctCount += 1;
        }
      }
      let consensus = "—";
      let topCount = 0;
      for (const [key, count] of tally) {
        if (count > topCount) {
          topCount = count;
          consensus = key;
        }
      }
      const consensusPct =
        predictedCount > 0 ? Math.round((topCount / predictedCount) * 100) : 0;
      return { fx, result, correctCount, consensus, consensusPct };
    });
  }, [fixtures, columns, resultMap]);

  const selectedColumn =
    columns.find((c) => c.slug === selectedSlug) ?? columns[0];

  const viewingAll = selectedSlug === VIEW_ALL;

  // Shared full matrix (rows = quinielas, columns = matches). Rendered on
  // desktop always, and on mobile when "View all" is picked in the dropdown.
  const matrixTable = (
    <div className="overflow-auto rounded-sm border border-border bg-surface shadow-md">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="espn-table-head">
            <th className="sticky left-0 top-0 z-20 bg-black px-3 py-2 text-left">
              {t("quiniela_name")}
            </th>
            {perFixture.map(({ fx, result }) => (
              <th
                key={`${fx.team1}-${fx.team2}`}
                className="sticky top-0 z-10 whitespace-nowrap bg-black px-1 py-2 text-center align-bottom"
              >
                <div className="text-[9px] font-normal text-white/50">
                  {fx.matchNumber}
                </div>
                <div>
                  {getCountryAbbrev(fx.team1)}
                  <span className="text-white/40"> v </span>
                  {getCountryAbbrev(fx.team2)}
                </div>
                <div className="mt-0.5 text-[10px] font-bold text-espn-red">
                  {result ? `${result.score1}-${result.score2}` : "—"}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => (
            <tr key={col.slug} className="border-b border-border">
              <td
                className="sticky left-0 z-10 whitespace-nowrap bg-surface px-3 py-1.5 font-medium"
                title={`${col.name} (${col.captain})`}
              >
                <Link
                  href={`/quiniela/${col.slug}`}
                  className="text-primary-theme transition-colors hover:text-espn-red"
                >
                  {col.name}
                </Link>
              </td>
              {col.cells.map((cell, i) => {
                const pf = perFixture[i];
                const pick = cell?.predicted
                  ? `${cell.predicted.score1}-${cell.predicted.score2}`
                  : "";
                const isSole =
                  pf?.correctCount === 1 &&
                  cell?.played &&
                  (cell.accuracy === "exact" || cell.accuracy === "result");
                return (
                  <td
                    key={`${pf.fx.team1}-${pf.fx.team2}`}
                    className="relative border-l border-border px-1 py-1.5 text-center font-medium"
                    style={cellStyle(cell?.accuracy ?? "pending", cell?.played ?? false)}
                  >
                    {pick}
                    {isSole && (
                      <span
                        className="absolute right-0 top-0 text-[8px] leading-none"
                        title={t("sole_correct")}
                      >
                        ⭐
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* Consensus row */}
          <tr className="border-t-2 border-espn-red bg-surface-alt">
            <td className="sticky left-0 z-10 whitespace-nowrap bg-surface-alt px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-wider">
              {t("consensus")}
            </td>
            {perFixture.map(({ fx, consensus, consensusPct }) => (
              <td
                key={`${fx.team1}-${fx.team2}`}
                className="border-l border-border px-1 py-1.5 text-center"
              >
                <div className="font-semibold text-primary-theme">{consensus}</div>
                <div className="text-[10px] text-muted">{consensusPct}%</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold sm:text-3xl">{t("all_picks")}</h1>
      <p className="mb-5 text-sm text-muted">{t("picks_subtitle")}</p>

      {/* Round selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ROUNDS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRound(r.key)}
            className={cn(
              "border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors",
              round === r.key
                ? "border-espn-red bg-espn-red text-white"
                : "border-border bg-surface text-secondary hover:bg-hover"
            )}
          >
            {t(r.labelKey)}
          </button>
        ))}
      </div>

      {fixtures.length === 0 ? (
        <p className="rounded-sm border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          {t("picks_no_round")}
        </p>
      ) : (
        <>
          {/* Desktop matrix — rows = quinielas, columns = matches.
              Full-bleed out of the centered max-w container so the grid
              fills the whole screen (and keeps filling as you zoom out). */}
          <div className="hidden w-screen lg:ml-[calc(50%-50vw)] lg:block lg:px-2 xl:px-6">
            {matrixTable}
          </div>

          {/* Mobile: pick a quiniela (or "View all"), show its picks for this round */}
          <div className="lg:hidden">
            <label className="mb-3 block">
              <span className="label-caps mb-1.5 block">{t("select_quiniela")}</span>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-base"
              >
                <option value={VIEW_ALL}>{t("view_all")}</option>
                {columns.map((col) => (
                  <option key={col.slug} value={col.slug}>
                    {col.name} ({col.captain})
                  </option>
                ))}
              </select>
            </label>

            {viewingAll ? (
              matrixTable
            ) : (
              selectedColumn && (
              <div className="mt-3 overflow-hidden rounded-sm border border-border bg-surface shadow-md">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <Link
                    href={`/quiniela/${selectedColumn.slug}`}
                    className="font-display font-bold text-espn-red"
                  >
                    {selectedColumn.name}
                  </Link>
                  <span className="text-xs text-muted">{selectedColumn.captain}</span>
                </div>
                <ul>
                  {fixtures.map((fx, i) => {
                    const cell = selectedColumn.cells[i];
                    const result = resultMap.get(resultKeyFromTeams(fx.team1, fx.team2));
                    return (
                      <li
                        key={`${fx.team1}-${fx.team2}`}
                        className="flex items-center justify-between border-b border-border px-3 py-2.5 text-sm"
                        style={cellStyle(cell?.accuracy ?? "pending", cell?.played ?? false)}
                      >
                        <span className="text-muted">{fx.matchNumber}.</span>
                        <span className="flex-1 px-2">
                          {getCountryAbbrev(fx.team1)}
                          <span className="text-muted"> v </span>
                          {getCountryAbbrev(fx.team2)}
                        </span>
                        <span className="font-semibold">
                          {cell?.predicted
                            ? `${cell.predicted.score1}-${cell.predicted.score2}`
                            : "—"}
                        </span>
                        {result && (
                          <span className="ml-2 font-display font-bold text-espn-red">
                            {result.score1}-{result.score2}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

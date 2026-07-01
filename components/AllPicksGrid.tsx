"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { quinielas, quinielaToSlug } from "@/data/quinielas";
import { getCountryAbbrev, getAllGroupFixtures } from "@/data/countries";
import { getPredictionsForSlug, type PredictionScore } from "@/data/predictions";
import { KNOCKOUT_PICKS } from "@/data/knockoutPicks";
import { resultKeyFromTeams } from "@/data/tournamentResults";
import { scoreMatchPrediction } from "@/lib/quinielaScoring";
import type { RowAccuracy } from "@/lib/predictionScoring";
import { useLiveScores } from "@/hooks/useLiveScores";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type RoundKey = "group" | "r32" | "r16" | "qf" | "sf" | "final";

const ROUNDS: { key: RoundKey; labelKey: string }[] = [
  { key: "group", labelKey: "round_group" },
  { key: "r32", labelKey: "round_r32" },
  { key: "r16", labelKey: "round_r16" },
  { key: "qf", labelKey: "round_qf" },
  { key: "sf", labelKey: "round_sf" },
  { key: "final", labelKey: "round_final" },
];

/** Round of 32 pairings, in bracket order (results live in data/matchResults.ts) */
const R32_FIXTURES: [string, string][] = [
  ["South Africa", "Canada"],
  ["Brazil", "Japan"],
  ["Germany", "Paraguay"],
  ["Netherlands", "Morocco"],
  ["Ivory Coast", "Norway"],
  ["France", "Sweden"],
  ["Mexico", "Ecuador"],
  ["England", "DR Congo"],
  ["Belgium", "Senegal"],
  ["United States", "Bosnia and Herzegovina"],
  ["Spain", "Austria"],
  ["Portugal", "Croatia"],
  ["Switzerland", "Algeria"],
  ["Egypt", "Australia"],
  ["Argentina", "Cabo Verde"],
  ["Colombia", "Ghana"],
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

function abbrevName(name: string, captain: string): string {
  const lastWord = captain.trim().split(/\s+/).pop() ?? "";
  const base = lastWord.length >= 3 ? lastWord : name;
  return base.length > 8 ? base.slice(0, 8) : base;
}

export default function AllPicksGrid() {
  const t = useTranslations();
  const { data: liveData } = useLiveScores();
  const matches = liveData?.matches ?? [];

  const [round, setRound] = useState<RoundKey>("group");
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
        abbrev: abbrevName(q.name, q.captain),
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

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold">{t("all_picks")}</h1>
      <p className="mb-4 text-sm text-muted">{t("picks_subtitle")}</p>

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
          {/* Desktop matrix */}
          <div className="hidden overflow-auto rounded-sm border border-border bg-surface shadow-md lg:block">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="espn-table-head">
                  <th className="sticky left-0 top-0 z-20 bg-black px-3 py-2 text-left">
                    {t("match_teams")}
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.slug}
                      className="sticky top-0 z-10 bg-black px-1 py-2 text-center"
                      title={`${col.name} (${col.captain})`}
                    >
                      {col.abbrev}
                    </th>
                  ))}
                  <th className="sticky top-0 z-10 bg-black px-2 py-2 text-center">
                    {t("consensus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {perFixture.map(({ fx, result, correctCount, consensus, consensusPct }, i) => (
                  <tr key={`${fx.team1}-${fx.team2}`} className="border-b border-border">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-surface px-3 py-1.5 font-medium">
                      <span className="text-muted">{fx.matchNumber}.</span>{" "}
                      {getCountryAbbrev(fx.team1)}
                      <span className="text-muted"> v </span>
                      {getCountryAbbrev(fx.team2)}
                      {result && (
                        <span className="ml-2 font-display font-bold text-espn-red">
                          {result.score1}-{result.score2}
                        </span>
                      )}
                    </td>
                    {columns.map((col) => {
                      const cell = col.cells[i];
                      const pick = cell?.predicted
                        ? `${cell.predicted.score1}-${cell.predicted.score2}`
                        : "";
                      const isSole =
                        correctCount === 1 &&
                        cell?.played &&
                        (cell.accuracy === "exact" || cell.accuracy === "result");
                      return (
                        <td
                          key={col.slug}
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
                    <td className="whitespace-nowrap border-l border-border bg-surface-alt px-2 py-1.5 text-center text-muted">
                      <span className="font-semibold text-primary-theme">{consensus}</span>{" "}
                      <span className="text-[10px]">({consensusPct}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: pick a quiniela, show its picks for this round */}
          <div className="lg:hidden">
            <label className="mb-2 block">
              <span className="label-caps mb-1 block">{t("select_quiniela")}</span>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-base"
              >
                {columns.map((col) => (
                  <option key={col.slug} value={col.slug}>
                    {col.name} ({col.captain})
                  </option>
                ))}
              </select>
            </label>

            {selectedColumn && (
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
                        className="flex items-center justify-between border-b border-border px-3 py-1.5 text-sm"
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
            )}
          </div>
        </>
      )}
    </div>
  );
}

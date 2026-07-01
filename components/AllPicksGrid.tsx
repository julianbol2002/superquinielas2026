"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { quinielas, quinielaToSlug } from "@/data/quinielas";
import { getCountryAbbrev } from "@/data/countries";
import {
  getScoredPredictions,
  type ScoredPredictionRow,
  type RowAccuracy,
} from "@/lib/predictionScoring";
import { useLiveScores } from "@/hooks/useLiveScores";
import { Link } from "@/i18n/routing";

interface QuinielaColumn {
  name: string;
  captain: string;
  slug: string;
  abbrev: string;
  rows: ScoredPredictionRow[];
}

function abbrevName(name: string, captain: string): string {
  const lastWord = captain.trim().split(/\s+/).pop() ?? "";
  const base = lastWord.length >= 3 ? lastWord : name;
  return base.length > 8 ? base.slice(0, 8) : base;
}

/** Cell background + text color by prediction accuracy */
function cellStyle(accuracy: RowAccuracy, played: boolean): React.CSSProperties {
  if (!played) return {};
  if (accuracy === "exact") return { background: "#854d0e33", color: "#a16207" };
  if (accuracy === "result") return { background: "#16a34a22", color: "#15803d" };
  if (accuracy === "wrong") return { background: "#dc262622", color: "#b91c1c" };
  return {};
}

export default function AllPicksGrid() {
  const t = useTranslations();
  const { data: liveData } = useLiveScores();
  const matches = liveData?.matches ?? [];

  const columns: QuinielaColumn[] = useMemo(
    () =>
      quinielas.map((q) => {
        const slug = quinielaToSlug(q.name);
        return {
          name: q.name,
          captain: q.captain,
          slug,
          abbrev: abbrevName(q.name, q.captain),
          rows: getScoredPredictions(slug, matches).filter(
            (r) => r.phase === "group"
          ),
        };
      }),
    [matches]
  );

  // Canonical match list (all columns share fixture order)
  const matchMeta = columns[0]?.rows ?? [];

  // Per-match: how many quinielas got it correct + consensus scoreline
  const perMatch = useMemo(() => {
    return matchMeta.map((meta, i) => {
      let correctCount = 0;
      const tally = new Map<string, number>();
      let predictedCount = 0;
      for (const col of columns) {
        const row = col.rows[i];
        if (!row) continue;
        if (row.predicted) {
          predictedCount += 1;
          const key = `${row.predicted.score1}-${row.predicted.score2}`;
          tally.set(key, (tally.get(key) ?? 0) + 1);
        }
        if (row.played && (row.accuracy === "exact" || row.accuracy === "result")) {
          correctCount += 1;
        }
      }
      let topScore = "—";
      let topCount = 0;
      for (const [key, count] of tally) {
        if (count > topCount) {
          topCount = count;
          topScore = key;
        }
      }
      const pct = predictedCount > 0 ? Math.round((topCount / predictedCount) * 100) : 0;
      return { meta, correctCount, consensus: topScore, consensusPct: pct };
    });
  }, [columns, matchMeta]);

  const [selectedSlug, setSelectedSlug] = useState(columns[0]?.slug ?? "");
  const selectedColumn = columns.find((c) => c.slug === selectedSlug) ?? columns[0];

  if (columns.length === 0) return null;

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold">{t("all_picks")}</h1>
      <p className="mb-4 text-sm text-muted">{t("picks_subtitle")}</p>

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
            {perMatch.map(({ meta, correctCount, consensus, consensusPct }, i) => (
              <tr key={meta.id} className="border-b border-border">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-surface px-3 py-1.5 font-medium">
                  <span className="text-muted">{meta.matchNumber}.</span>{" "}
                  {getCountryAbbrev(meta.team1)}
                  <span className="text-muted"> v </span>
                  {getCountryAbbrev(meta.team2)}
                  {meta.played &&
                    meta.actualScore1 !== null &&
                    meta.actualScore2 !== null && (
                      <span className="ml-2 font-display font-bold text-espn-red">
                        {meta.actualScore1}-{meta.actualScore2}
                      </span>
                    )}
                </td>
                {columns.map((col) => {
                  const row = col.rows[i];
                  const pick = row?.predicted
                    ? `${row.predicted.score1}-${row.predicted.score2}`
                    : "";
                  const isSole =
                    correctCount === 1 &&
                    row?.played &&
                    (row.accuracy === "exact" || row.accuracy === "result");
                  return (
                    <td
                      key={col.slug}
                      className="relative border-l border-border px-1 py-1.5 text-center font-medium"
                      style={cellStyle(row?.accuracy ?? "pending", row?.played ?? false)}
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

      {/* Mobile: pick a quiniela, show its picks vertically */}
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
              {selectedColumn.rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between border-b border-border px-3 py-1.5 text-sm"
                  style={cellStyle(row.accuracy, row.played)}
                >
                  <span className="text-muted">{row.matchNumber}.</span>
                  <span className="flex-1 px-2">
                    {getCountryAbbrev(row.team1)}
                    <span className="text-muted"> v </span>
                    {getCountryAbbrev(row.team2)}
                  </span>
                  <span className="font-semibold">
                    {row.predicted
                      ? `${row.predicted.score1}-${row.predicted.score2}`
                      : "—"}
                  </span>
                  {row.played &&
                    row.actualScore1 !== null &&
                    row.actualScore2 !== null && (
                      <span className="ml-2 font-display font-bold text-espn-red">
                        {row.actualScore1}-{row.actualScore2}
                      </span>
                    )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  getLivePredictorsForMatch,
  type LivePredictorEntry,
} from "@/lib/livePredictors";
import PlayerAvatar from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";

const VISIBLE_LIMIT = 4;

interface LivePredictorsPanelProps {
  group: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  isLive: boolean;
  /** Bumps recompute on each live sync tick */
  lastUpdated?: string;
}

function PredictorList({
  entries,
  expanded,
  showAll,
  onToggleShowAll,
}: {
  entries: LivePredictorEntry[];
  expanded: boolean;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const t = useTranslations();
  const visible = showAll ? entries : entries.slice(0, VISIBLE_LIMIT);
  const hidden = entries.length - VISIBLE_LIMIT;

  if (!expanded || entries.length === 0) {
    return null;
  }

  return (
    <ul className="mt-1.5 space-y-1.5">
      {visible.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={`/quiniela/${entry.slug}`}
            className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-white/5 light:hover:bg-slate-100"
          >
            <PlayerAvatar captain={entry.captain} size={24} className="flex-shrink-0" />
            <span className="min-w-0 truncate text-sm">
              <span className="font-semibold">{entry.name}</span>
              <span className="text-muted"> · {entry.captain}</span>
            </span>
            {entry.bothMatchTeamsAsFinalists && (
              <span className="flex-shrink-0" title={t("live_predictors_trophy")}>
                🏆
              </span>
            )}
          </Link>
        </li>
      ))}
      {!showAll && hidden > 0 && (
        <li>
          <button
            type="button"
            onClick={onToggleShowAll}
            className="text-xs font-medium text-pitch hover:underline"
          >
            {t("live_predictors_more", { count: hidden })}
          </button>
        </li>
      )}
      {showAll && hidden > 0 && (
        <li>
          <button
            type="button"
            onClick={onToggleShowAll}
            className="text-xs font-medium text-muted hover:underline"
          >
            {t("live_predictors_less")}
          </button>
        </li>
      )}
    </ul>
  );
}

export default function LivePredictorsPanel({
  group,
  team1,
  team2,
  score1,
  score2,
  isLive,
  lastUpdated,
}: LivePredictorsPanelProps) {
  const t = useTranslations();
  const [panelOpen, setPanelOpen] = useState(isLive);
  const [exactOpen, setExactOpen] = useState(isLive);
  const [resultOpen, setResultOpen] = useState(isLive);
  const [showAllExact, setShowAllExact] = useState(false);
  const [showAllResult, setShowAllResult] = useState(false);

  useEffect(() => {
    if (isLive) {
      setPanelOpen(true);
      setExactOpen(true);
      setResultOpen(true);
    } else {
      setExactOpen(false);
      setResultOpen(false);
    }
  }, [isLive]);

  useEffect(() => {
    setShowAllExact(false);
    setShowAllResult(false);
  }, [lastUpdated, score1, score2]);

  const { exact, correctResult } = useMemo(
    () => getLivePredictorsForMatch(group, team1, team2, score1, score2),
    [group, team1, team2, score1, score2, lastUpdated]
  );

  if (!isLive && !panelOpen) {
    return (
      <div className="border-t border-white/10 px-2 py-2 sm:px-2 light:border-slate-200">
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="w-full rounded-lg py-1.5 text-xs font-medium text-pitch hover:bg-white/5 light:hover:bg-slate-50"
        >
          {t("live_predictors_show")}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 px-2 py-2 sm:px-2 light:border-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-secondary">
          {isLive ? t("live_predictors_title") : t("live_predictors_historical")}
        </h4>
        {!isLive && (
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="text-[10px] text-muted hover:text-pitch"
          >
            {t("live_predictors_hide")}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${score1}-${score2}-${lastUpdated ?? "static"}`}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className={cn(
              "rounded-lg border border-white/5 p-2 light:border-slate-100",
              isLive &&
                "animate-[pulse_2.5s_ease-in-out_infinite] border-pitch/20 bg-pitch/5"
            )}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setExactOpen((v) => !v)}
              aria-expanded={exactOpen}
            >
              <span className="text-xs font-semibold">
                🎯 {t("live_predictors_exact")} ({exact.length})
              </span>
              <span className="text-[10px] text-muted">{exactOpen ? "−" : "+"}</span>
            </button>
            {exactOpen && exact.length === 0 && (
              <p className="mt-1 text-xs text-muted">{t("live_predictors_no_exact")}</p>
            )}
            <PredictorList
              entries={exact}
              expanded={exactOpen}
              showAll={showAllExact}
              onToggleShowAll={() => setShowAllExact((v) => !v)}
            />
          </div>

          <div className="mt-2 rounded-lg border border-white/5 p-2 light:border-slate-100">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setResultOpen((v) => !v)}
              aria-expanded={resultOpen}
            >
              <span className="text-xs font-semibold">
                ✅ {t("live_predictors_result")} ({correctResult.length})
              </span>
              <span className="text-[10px] text-muted">{resultOpen ? "−" : "+"}</span>
            </button>
            {resultOpen && correctResult.length === 0 && (
              <p className="mt-1 text-xs text-muted">{t("live_predictors_no_result")}</p>
            )}
            <PredictorList
              entries={correctResult}
              expanded={resultOpen}
              showAll={showAllResult}
              onToggleShowAll={() => setShowAllResult((v) => !v)}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

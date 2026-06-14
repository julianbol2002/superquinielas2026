"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  getLivePredictorsForMatch,
  type LivePredictorEntry,
} from "@/lib/livePredictors";
import PlayerAvatar from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";

interface LivePredictorsPanelProps {
  group: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  isLive: boolean;
  lastUpdated?: string;
}

function ModalPredictorList({
  title,
  entries,
  emptyMessage,
}: {
  title: string;
  entries: LivePredictorEntry[];
  emptyMessage: string;
}) {
  const t = useTranslations();

  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1.5 text-xs font-semibold text-secondary">{title}</p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted">{emptyMessage}</p>
      ) : (
        <ul className="max-h-40 space-y-1 overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/quiniela/${entry.slug}`}
                className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-white/5 light:hover:bg-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <PlayerAvatar captain={entry.captain} size={22} className="flex-shrink-0" />
                <span className="min-w-0 truncate text-sm font-medium">{entry.name}</span>
                {entry.bothMatchTeamsAsFinalists && (
                  <span className="flex-shrink-0 text-xs" title={t("live_predictors_trophy")}>
                    🏆
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PredictorsSheet({
  open,
  onClose,
  isLive,
  exact,
  correctResult,
}: {
  open: boolean;
  onClose: () => void;
  isLive: boolean;
  exact: LivePredictorEntry[];
  correctResult: LivePredictorEntry[];
}) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/50"
        aria-label={t("live_predictors_hide")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto border border-border bg-surface p-4 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-secondary">
            {isLive ? t("live_predictors_title") : t("live_predictors_historical")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5 light:hover:bg-slate-100"
          >
            {t("live_predictors_hide")}
          </button>
        </div>
        <ModalPredictorList
          title={`🎯 ${t("live_predictors_exact")} (${exact.length})`}
          entries={exact}
          emptyMessage={t("live_predictors_no_exact")}
        />
        <ModalPredictorList
          title={`✅ ${t("live_predictors_result")} (${correctResult.length})`}
          entries={correctResult}
          emptyMessage={t("live_predictors_no_result")}
        />
      </div>
    </>,
    document.body
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
  const [sheetOpen, setSheetOpen] = useState(false);

  const syncKey = `${lastUpdated ?? ""}:${score1}-${score2}`;
  const { exact, correctResult } = useMemo(
    () => getLivePredictorsForMatch(group, team1, team2, score1, score2),
    [group, team1, team2, score1, score2, syncKey]
  );

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSheetOpen(true);
        }}
        className={cn(
          "flex h-8 max-h-8 w-full items-center border-t border-white/10 px-2 text-left text-[11px] leading-none light:border-slate-200",
          isLive
            ? "text-secondary hover:bg-white/5 light:hover:bg-slate-50"
            : "text-muted hover:text-secondary"
        )}
      >
        {isLive ? (
          <span className="truncate">
            🎯 {exact.length} {t("live_predictors_exact_short")} · ✅ {correctResult.length}{" "}
            {t("live_predictors_result_short")}
          </span>
        ) : (
          <span>{t("live_predictors_show_arrow")}</span>
        )}
      </button>

      <PredictorsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isLive={isLive}
        exact={exact}
        correctResult={correctResult}
      />
    </>
  );
}

"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "@/i18n/routing";
import {
  formatLastUpdated,
  getLiveMatches,
  type LiveMatch,
} from "@/lib/liveScores";
import { useLiveScores } from "@/hooks/useLiveScores";
import FlagChip from "./FlagChip";
import { getCountryDisplayName } from "@/data/countries";

function sortFinalMatches(matches: LiveMatch[]): LiveMatch[] {
  return [...matches]
    .filter((m) => m.status === "final")
    .sort((a, b) => {
      const aTime = new Date(a.finishedAt ?? `${a.matchDate}T23:59:59`).getTime();
      const bTime = new Date(b.finishedAt ?? `${b.matchDate}T23:59:59`).getTime();
      return aTime - bTime;
    });
}

export default function LiveScoresPanel() {
  const t = useTranslations();
  const locale = useLocale();
  const { data, loading, error } = useLiveScores();
  const liveMatches = data ? getLiveMatches(data.matches) : [];
  const recentFinal = useMemo(
    () => (data ? sortFinalMatches(data.matches) : []),
    [data]
  );
  const recentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = recentScrollRef.current;
    if (!el || recentFinal.length === 0) return;
    const frame = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    });
    return () => cancelAnimationFrame(frame);
  }, [recentFinal, data?.lastUpdated]);

  if (loading && !data) {
    return (
      <section className="mb-4 border-b border-border px-4 pb-4 md:px-0">
        <div className="h-16 animate-pulse bg-surface" />
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="mb-4 border-b border-border px-4 pb-4 md:px-0">
        <p className="text-body text-muted">{t("live_scores_unavailable")}</p>
      </section>
    );
  }

  return (
    <section className="mb-4 border-b border-border px-4 pb-4 md:px-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="label-caps">{t("live_scores")}</h2>
        {data?.lastUpdated && (
          <p className="text-label text-muted">
            {t("last_updated")}: {formatLastUpdated(data.lastUpdated, locale)}
          </p>
        )}
      </div>

      {liveMatches.length === 0 ? (
        <p className="text-body text-muted">{t("no_live_matches")}</p>
      ) : (
        <div className="space-y-2">
          {liveMatches.map((match) => (
            <div
              key={match.espnId}
              className="flex items-center justify-between gap-2 border border-border bg-surface px-3 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <FlagChip country={match.team1} size={16} />
                <span className="truncate text-body font-medium text-name">
                  {getCountryDisplayName(match.team1, true)}
                </span>
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase text-accent">
                  <span className="live-dot" aria-hidden />
                  {t("live_badge")}
                </span>
                <span className="font-display text-2xl tabular-nums text-accent">
                  {match.score1} - {match.score2}
                </span>
                {match.displayClock && (
                  <span className="text-label text-muted">{match.displayClock}</span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <span className="truncate text-right text-body font-medium text-name">
                  {getCountryDisplayName(match.team2, true)}
                </span>
                <FlagChip country={match.team2} size={16} />
              </div>
            </div>
          ))}
        </div>
      )}

      {recentFinal.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 label-caps">{t("recent_results")}</p>
          <div className="relative">
            <div
              ref={recentScrollRef}
              className="flex gap-2 overflow-x-auto hide-scrollbar max-sm:snap-x max-sm:snap-mandatory"
            >
              {recentFinal.map((match) => (
                <div
                  key={`final-${match.espnId}`}
                  className="flex-shrink-0 snap-start border border-border bg-surface px-3 py-2 text-center max-sm:snap-start"
                >
                  <div className="mb-1 flex justify-center gap-1">
                    <FlagChip country={match.team1} size={12} />
                    <FlagChip country={match.team2} size={12} />
                  </div>
                  <span className="font-display text-lg tabular-nums text-section">
                    {match.score1} - {match.score2}
                  </span>
                  {match.group && (
                    <p className="text-label text-muted">
                      {t("group")} {match.group}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--bg)] to-transparent"
              aria-hidden
            />
          </div>
        </div>
      )}

      <Link
        href="/partidos"
        className="mt-3 inline-block min-h-[44px] py-2 text-body text-accent"
      >
        {t("view_all_matches")} →
      </Link>
    </section>
  );
}

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getLiveMatches, type LiveMatch } from "@/lib/liveScores";
import {
  formatPredictorNameList,
  getLivePredictorsForMatch,
} from "@/lib/livePredictors";
import FlagChip from "@/components/FlagChip";

interface LiveMatchLeaderboardBannerProps {
  matches: LiveMatch[];
  lastUpdated?: string;
}

function formatNameLine(
  list: { names: string[]; overflow: number },
  moreLabel: (count: number) => string
): string {
  if (list.names.length === 0) return "";
  if (list.overflow <= 0) return list.names.join(", ");
  return `${list.names.join(", ")} ${moreLabel(list.overflow)}`;
}

function LiveMatchCard({
  match,
  lastUpdated,
}: {
  match: LiveMatch;
  lastUpdated?: string;
}) {
  const t = useTranslations();
  const syncKey = `${lastUpdated ?? ""}:${match.score1}-${match.score2}`;

  const { exact, correctResult } = useMemo(() => {
    if (!match.group) return { exact: [], correctResult: [] };
    return getLivePredictorsForMatch(
      match.group,
      match.team1,
      match.team2,
      match.score1,
      match.score2
    );
  }, [match.group, match.team1, match.team2, match.score1, match.score2, syncKey]);

  const exactLine = formatNameLine(formatPredictorNameList(exact, 4), (count) =>
    t("live_predictors_more", { count })
  );
  const resultLine = formatNameLine(formatPredictorNameList(correctResult, 2), (count) =>
    t("live_predictors_more", { count })
  );

  return (
    <Link
      href="/partidos"
      className="block border border-border bg-surface px-4 py-3 transition-colors hover:bg-hover md:px-3"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body leading-snug">
        <span className="inline-flex items-center gap-1.5 text-label font-medium uppercase text-accent">
          <span className="live-dot" aria-hidden />
          {t("live_badge")}
        </span>
        <FlagChip country={match.team1} size={14} className="!border-0 !bg-transparent !p-0" />
        <span className="text-muted">{t("vs")}</span>
        <FlagChip country={match.team2} size={14} className="!border-0 !bg-transparent !p-0" />
        <span className="font-display text-xl tabular-nums text-primary-theme">
          {match.score1} - {match.score2}
        </span>
        {match.displayClock && (
          <span className="text-label text-muted">{match.displayClock}</span>
        )}
      </p>
      <p className="mt-1 truncate text-label text-secondary">
        {t("live_banner_exact")}: {exactLine || t("live_predictors_no_exact_short")}
      </p>
      <p className="truncate text-label text-secondary">
        {t("live_banner_result")}: {resultLine || t("live_predictors_no_result_short")}
      </p>
    </Link>
  );
}

export default function LiveMatchLeaderboardBanner({
  matches,
  lastUpdated,
}: LiveMatchLeaderboardBannerProps) {
  const liveMatches = useMemo(() => getLiveMatches(matches), [matches]);

  if (liveMatches.length === 0) return null;

  return (
    <div className="mb-4 space-y-2 px-4 md:px-0">
      {liveMatches.map((match) => (
        <LiveMatchCard key={match.espnId} match={match} lastUpdated={lastUpdated} />
      ))}
    </div>
  );
}

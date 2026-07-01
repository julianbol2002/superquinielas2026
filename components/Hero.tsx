"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useLiveScores } from "@/hooks/useLiveScores";
import { useRankedQuinielas } from "@/hooks/useRankedQuinielas";
import { getScoredPredictions } from "@/lib/predictionScoring";
import { formatLastUpdated } from "@/lib/liveScores";

export default function Hero() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: liveData } = useLiveScores();
  const entries = useRankedQuinielas(liveData?.matches ?? []);
  const leader = entries[0] ?? null;

  const games = useMemo(() => {
    if (!leader) return { played: 0, total: 0 };
    const rows = getScoredPredictions(leader.slug, liveData?.matches ?? []).filter(
      (r) => r.phase === "group"
    );
    return {
      played: rows.filter((r) => r.played).length,
      total: rows.length,
    };
  }, [leader, liveData?.matches]);

  const lastUpdated = liveData?.lastUpdated
    ? formatLastUpdated(liveData.lastUpdated, locale)
    : "—";

  return (
    <section className="mb-4 border-b border-espn-red/20 bg-espn-red/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="label-caps">{t("leader")}</span>
          <span className="font-semibold text-primary-theme">
            {leader ? `${leader.name} · ${leader.points} ${t("points_abbr")}` : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-caps">{t("matches")}</span>
          <span className="font-semibold text-primary-theme">
            {games.played}/{games.total}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-muted">
          <span className="label-caps">{t("last_updated")}</span>
          <span>{lastUpdated}</span>
        </div>
      </div>
    </section>
  );
}

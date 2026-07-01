"use client";

import { useTranslations, useLocale } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { formatQuinielaLabel, getStatHighlights } from "@/data/quinielas";
import { useLiveScores } from "@/hooks/useLiveScores";
import { formatLastUpdated } from "@/lib/liveScores";

interface StatCardsProps {
  entries: RankedQuiniela[];
  liveMatches?: import("@/lib/liveScores").LiveMatch[];
  rankHistoryReady?: boolean;
}

export default function StatCards({ entries }: StatCardsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: liveData } = useLiveScores();
  const stats = getStatHighlights(entries);

  const lastUpdated = liveData?.lastUpdated
    ? formatLastUpdated(liveData.lastUpdated, locale)
    : "—";

  const items: { label: string; value: string }[] = [
    {
      label: t("leader"),
      value: stats.leader ? formatQuinielaLabel(stats.leader) : "—",
    },
    {
      label: t("most_accurate"),
      value: stats.mostAccurate ? formatQuinielaLabel(stats.mostAccurate) : "—",
    },
    {
      label: t("last_updated"),
      value: lastUpdated,
    },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border bg-surface-alt px-4 py-2 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-center gap-2">
          <span className="label-caps">{item.label}</span>
          <span className="truncate font-semibold text-primary-theme">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

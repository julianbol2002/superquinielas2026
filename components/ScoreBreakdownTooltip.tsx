"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { QuinielaScoreBreakdown } from "@/lib/quinielaScoring";
import { formatScoreTooltip } from "@/lib/quinielaScoring";

interface ScoreBreakdownTooltipProps {
  breakdown: QuinielaScoreBreakdown;
}

export default function ScoreBreakdownTooltip({
  breakdown,
}: ScoreBreakdownTooltipProps) {
  const t = useTranslations();
  const locale = useLocale() as "es" | "en";
  const [open, setOpen] = useState(false);
  const tooltip = formatScoreTooltip(breakdown, locale);
  const hasBonus =
    breakdown.finalistBonus > 0 || breakdown.championBonus > 0;

  return (
    <span
      className="relative inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="font-display text-2xl text-pitch">
        {breakdown.matchPoints}
      </span>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] font-bold text-muted transition hover:border-pitch hover:text-pitch light:border-slate-300"
        aria-label={t("score_breakdown")}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-white/10 bg-stadium-dark px-3 py-2 text-left text-xs leading-relaxed text-secondary shadow-xl light:border-slate-200 light:bg-white light:text-slate-700"
        >
          {tooltip}
          {hasBonus && (
            <span className="mt-1 block text-muted">
              {t("score_bonus_note")}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

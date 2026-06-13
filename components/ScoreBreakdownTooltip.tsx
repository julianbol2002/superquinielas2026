"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { QuinielaScoreBreakdown } from "@/lib/quinielaScoring";
import { formatScoreTooltip } from "@/lib/quinielaScoring";
import { cn } from "@/lib/utils";

interface ScoreBreakdownTooltipProps {
  breakdown: QuinielaScoreBreakdown;
  size?: "sm" | "md";
  badgeClass?: string;
}

export default function ScoreBreakdownTooltip({
  breakdown,
  size = "md",
  badgeClass,
}: ScoreBreakdownTooltipProps) {
  const t = useTranslations();
  const locale = useLocale() as "es" | "en";
  const [open, setOpen] = useState(false);
  const tooltip = formatScoreTooltip(breakdown, locale);
  const pointsClass =
    size === "sm" ? "font-display text-lg" : "font-display text-2xl";

  return (
    <span
      className="relative inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className={cn(
          pointsClass,
          "leading-none text-pitch",
          badgeClass && "rounded-lg px-2 py-0.5 font-accent",
          badgeClass
        )}
      >
        {breakdown.matchPoints}
      </span>
      <button
        type="button"
        className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[16px] leading-none text-muted/60 transition hover:text-muted light:text-slate-400 light:hover:text-slate-600"
        aria-label={t("score_breakdown")}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        ⓘ
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-lg border border-white/10 bg-stadium-dark px-3 py-2 text-left text-xs leading-relaxed text-secondary shadow-xl light:border-slate-200 light:bg-white light:text-slate-700"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

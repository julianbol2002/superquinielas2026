"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { QuinielaScoreBreakdown } from "@/lib/quinielaScoring";
import { formatScoreTooltip } from "@/lib/quinielaScoring";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";

interface ScoreBreakdownTooltipProps {
  breakdown: QuinielaScoreBreakdown;
  /** Official Puntos Efectivos (Azure) — what the leaderboard ranks on */
  officialPoints: number;
  size?: "sm" | "md";
}

export default function ScoreBreakdownTooltip({
  breakdown,
  officialPoints,
  size = "md",
}: ScoreBreakdownTooltipProps) {
  const t = useTranslations();
  const locale = useLocale() as "es" | "en";
  const [open, setOpen] = useState(false);
  const computedTooltip = formatScoreTooltip(breakdown, locale);
  const tooltip = `${t("score_official_total", { points: officialPoints })}\n${computedTooltip}\n${t("score_bonus_note")}`;
  const pointsClass = size === "sm" ? "font-display text-lg" : "font-display text-2xl";

  return (
    <span
      className="relative inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <span className={cn(pointsClass, "leading-none text-accent")}>
        <CountUp value={officialPoints} />
      </span>
      <button
        type="button"
        className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center text-[14px] leading-none text-muted transition-colors hover:text-secondary"
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
          className="absolute right-0 top-full z-50 mt-1 w-72 whitespace-pre-line border border-border bg-surface px-2.5 py-2 text-left text-label leading-relaxed text-secondary"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

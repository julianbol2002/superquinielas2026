"use client";

import { getBetTierAbbrev } from "@/lib/predictionScoring";
import type { RankedQuiniela } from "@/data/quinielas";
import { betBadgeClass } from "@/lib/betBadgeStyles";
import { cn } from "@/lib/utils";

export function BetTierBadge({
  bet,
  className,
}: {
  bet: RankedQuiniela["bet"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded px-1 py-0.5 text-[10px] font-medium uppercase leading-none",
        betBadgeClass(bet),
        className
      )}
    >
      {getBetTierAbbrev(bet)}
    </span>
  );
}

export default BetTierBadge;

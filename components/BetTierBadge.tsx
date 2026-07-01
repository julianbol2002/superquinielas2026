"use client";

import type { RankedQuiniela } from "@/data/quinielas";
import { cn } from "@/lib/utils";

export function BetTierBadge({
  bet,
  className,
}: {
  bet: RankedQuiniela["bet"];
  className?: string;
}) {
  return (
    <span className={cn("text-xs font-medium text-secondary", className)}>
      ${bet}
    </span>
  );
}

export default BetTierBadge;

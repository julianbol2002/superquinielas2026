"use client";

import dynamic from "next/dynamic";
import { getCountryCode, getCountryDisplayName } from "@/data/countries";
import { cn } from "@/lib/utils";

const Flag = dynamic(() => import("react-world-flags"), {
  ssr: false,
  loading: () => (
    <span className="inline-block h-6 w-6 flex-shrink-0 animate-pulse rounded bg-white/10" />
  ),
});

function TeamInline({
  country,
  compactName = false,
}: {
  country: string;
  compactName?: boolean;
}) {
  const code = getCountryCode(country);
  const label = compactName ? getCountryDisplayName(country, true) : country;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm border border-white/10 light:border-slate-200">
        <Flag
          code={code}
          height={24}
          width={24}
          className="h-6 w-6 rounded-sm object-cover"
        />
      </span>
      <span className="truncate text-sm font-medium text-secondary light:text-slate-700">
        {label}
      </span>
    </div>
  );
}

export interface MatchTeamsRowProps {
  team1: string;
  team2: string;
  /** e.g. "4 - 0" */
  scoreLine?: string;
  showGoleadaBadge?: boolean;
  goleadaLabel?: string;
  className?: string;
  compactNames?: boolean;
}

/** Two-team match row — stacks on narrow viewports, no overlapping flags */
export default function MatchTeamsRow({
  team1,
  team2,
  scoreLine,
  showGoleadaBadge = false,
  goleadaLabel,
  className,
  compactNames = false,
}: MatchTeamsRowProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="hidden w-full items-center justify-center gap-2 sm:flex">
        <TeamInline country={team1} compactName={compactNames} />
        <span className="flex-shrink-0 px-2 text-xs font-medium text-muted">
          vs
        </span>
        <TeamInline country={team2} compactName={compactNames} />
      </div>

      <div className="flex w-full flex-col items-center gap-1 sm:hidden">
        <TeamInline country={team1} compactName={compactNames} />
        <span className="text-xs font-medium text-muted">vs</span>
        <TeamInline country={team2} compactName={compactNames} />
      </div>

      {(scoreLine || showGoleadaBadge) && (
        <div className="flex items-center justify-center gap-2">
          {scoreLine && (
            <span className="font-accent text-lg tracking-wide">{scoreLine}</span>
          )}
          {showGoleadaBadge && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400"
              title={goleadaLabel}
            >
              🔥
              {goleadaLabel && (
                <span className="sr-only sm:not-sr-only">{goleadaLabel}</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

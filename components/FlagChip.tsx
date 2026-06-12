"use client";

import dynamic from "next/dynamic";
import { getCountryCode } from "@/data/countries";
import { cn } from "@/lib/utils";

const Flag = dynamic(() => import("react-world-flags"), {
  ssr: false,
  loading: () => (
    <span className="inline-block h-10 w-10 animate-pulse rounded bg-white/10" />
  ),
});

interface FlagChipProps {
  country: string;
  showLabel?: boolean;
  size?: number;
  className?: string;
}

export default function FlagChip({
  country,
  showLabel = false,
  size = 20,
  className,
}: FlagChipProps) {
  const code = getCountryCode(country);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-white/5 px-1.5 py-0.5 light:bg-slate-100",
        className
      )}
      title={country}
    >
      <Flag
        code={code}
        height={size}
        width={Math.round(size * 1.4)}
        className="rounded-sm object-cover"
      />
      {showLabel && (
        <span className="text-xs font-medium text-slate-300 light:text-slate-600">
          {country}
        </span>
      )}
    </span>
  );
}

/** Vertical flag + country name for group grids */
export function TeamFlagCell({
  country,
  className,
}: {
  country: string;
  className?: string;
}) {
  const code = getCountryCode(country);

  return (
    <div
      className={cn(
        "flex w-[72px] flex-col items-center gap-2 px-1 py-2 sm:w-20",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-white/10 light:border-slate-200">
        <Flag
          code={code}
          height={40}
          width={40}
          className="h-10 w-10 object-cover"
        />
      </div>
      <span className="w-full text-center text-[10px] font-medium leading-tight text-slate-300 light:text-slate-600 sm:text-xs">
        {country}
      </span>
    </div>
  );
}

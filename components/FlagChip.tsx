"use client";

import dynamic from "next/dynamic";
import { getCountryCode } from "@/data/countries";
import { cn } from "@/lib/utils";

const Flag = dynamic(() => import("react-world-flags"), {
  ssr: false,
  loading: () => (
    <span className="inline-block h-4 w-6 animate-pulse rounded bg-white/10" />
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
      <Flag code={code} height={size} className="rounded-sm object-cover" />
      {showLabel && (
        <span className="text-xs font-medium text-slate-300 light:text-slate-600">
          {country}
        </span>
      )}
    </span>
  );
}

"use client";

import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface PlayerPodiumProps {
  entries: RankedQuiniela[];
}

const PLACE_STYLES: Record<
  1 | 2 | 3,
  { border: string; badge: string }
> = {
  1: { border: "border-espn-red", badge: "rank-badge-1" },
  2: { border: "border-neutral-600", badge: "rank-badge-2" },
  3: { border: "border-neutral-500", badge: "rank-badge-3" },
};

export default function PlayerPodium({ entries }: PlayerPodiumProps) {
  const t = useTranslations();
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <section className="mb-5 px-4 md:px-0">
      <h2 className="mb-3 font-display text-xl font-bold text-section">
        {t("podium_title")}
      </h2>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {top3.map((entry) => {
          const place = entry.rank as 1 | 2 | 3;
          const styles = PLACE_STYLES[place];
          return (
            <Link
              key={entry.slug}
              href={`/quiniela/${entry.slug}`}
              className={cn(
                "glass-card animate-fade-in flex flex-col rounded-sm border-t-4 p-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]",
                styles.border
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center font-display text-sm font-bold leading-none",
                    styles.badge
                  )}
                >
                  {place}
                </span>
                <span className="font-display text-xl font-bold text-espn-red">
                  {entry.points}
                </span>
              </div>
              <p className="line-clamp-2 font-semibold leading-tight text-primary-theme">
                {entry.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-captain">
                {entry.captain}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import type { QuinielaBadge } from "@/lib/badges";
import { cn } from "@/lib/utils";

const VISIBLE_LIMIT = 5;

export default function LeaderboardBadges({
  badges,
  className,
}: {
  badges: QuinielaBadge[];
  className?: string;
}) {
  const t = useTranslations();

  if (badges.length === 0) return null;

  const visible = badges.slice(0, VISIBLE_LIMIT);
  const hidden = badges.slice(VISIBLE_LIMIT);

  const tooltipFor = (b: QuinielaBadge) => {
    const label = t(`badge_${b.id}` as Parameters<typeof t>[0]);
    const desc = t(`badge_${b.id}_desc` as Parameters<typeof t>[0]);
    return `${label} — ${desc}`;
  };

  const hiddenTooltip = hidden
    .map((b) => `${b.emoji} ${t(`badge_${b.id}` as Parameters<typeof t>[0])}`)
    .join(" · ");

  return (
    <span
      className={cn("ml-1 inline-flex flex-shrink-0 items-center gap-0.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {visible.map((b) => (
        <span
          key={b.id}
          title={tooltipFor(b)}
          className={cn(
            "inline-flex text-[13px] leading-none",
            b.tier === "secret" && "drop-shadow-[0_0_6px_rgba(245,197,24,0.45)]",
            b.tier === "daily" && "animate-pulse"
          )}
          aria-label={t(`badge_${b.id}` as Parameters<typeof t>[0])}
        >
          {b.emoji}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hiddenTooltip}
          className="rounded bg-surface px-1 text-[10px] font-semibold text-muted"
        >
          +{hidden.length}
        </span>
      )}
    </span>
  );
}

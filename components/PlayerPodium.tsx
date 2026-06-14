"use client";

import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import { PODIUM_PLACE_STYLES } from "@/lib/rankStyles";
import { cn } from "@/lib/utils";
import PlayerAvatar from "./PlayerAvatar";

interface PlayerPodiumProps {
  entries: RankedQuiniela[];
}

const podiumOrder = [1, 0, 2] as const;

export default function PlayerPodium({ entries }: PlayerPodiumProps) {
  const t = useTranslations();
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <section className="mb-5 px-4 md:px-0">
      <h2 className="mb-3 label-caps">{t("podium_title")}</h2>
      <div className="flex items-end justify-center gap-2 md:gap-4">
        {podiumOrder.map((idx) => {
          const entry = top3[idx];
          const place = entry.rank as 1 | 2 | 3;
          const styles = PODIUM_PLACE_STYLES[place];

          return (
            <Link
              key={entry.slug}
              href={`/quiniela/${entry.slug}`}
              className={cn(
                "flex w-[30%] max-w-[120px] flex-col items-center border-l-[3px] px-2 py-3 md:max-w-[140px]",
                styles.minHeight
              )}
              style={{
                borderLeftColor: styles.border,
                backgroundColor: styles.bg,
              }}
            >
              <span
                className="font-display text-lg leading-none"
                style={{ color: styles.border }}
              >
                {entry.rank}
              </span>
              <PlayerAvatar
                captain={entry.captain}
                size={place === 1 ? 48 : 40}
                ringColor={styles.border}
                className="mt-2"
              />
              <p className="mt-2 line-clamp-2 text-center text-body font-bold text-[#f0f0f0]">
                {entry.name}
              </p>
              <p className="truncate text-label text-captain">{entry.captain}</p>
              <p
                className="mt-1 font-display text-2xl"
                style={{ color: styles.border }}
              >
                {entry.points}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

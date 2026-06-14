"use client";

import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import PlayerAvatar from "./PlayerAvatar";

interface PlayerPodiumProps {
  entries: RankedQuiniela[];
}

const podiumOrder = [1, 0, 2];
const barHeights = ["h-12", "h-16", "h-10"];

export default function PlayerPodium({ entries }: PlayerPodiumProps) {
  const t = useTranslations();
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <section className="mb-5 px-4 md:px-0">
      <h2 className="mb-3 label-caps">{t("podium_title")}</h2>
      <div className="flex items-end justify-center gap-3 md:gap-8">
        {podiumOrder.map((idx, visualIdx) => {
          const entry = top3[idx];
          const isFirst = entry.rank === 1;

          return (
            <div
              key={entry.slug}
              className="flex max-w-[110px] flex-col items-center md:max-w-[140px]"
            >
              <Link
                href={`/quiniela/${entry.slug}`}
                className="group flex flex-col items-center"
              >
                <PlayerAvatar
                  captain={entry.captain}
                  size={visualIdx === 1 ? 48 : 40}
                />
                <p className="mt-2 line-clamp-2 text-center text-body font-medium group-hover:text-accent">
                  {entry.name}
                </p>
                <p className="truncate text-label text-muted">{entry.captain}</p>
                <p className="mt-1 font-display text-2xl text-gold">{entry.points}</p>
              </Link>
              <div
                className={cn(
                  "mt-2 w-16 border border-border bg-surface md:w-24",
                  barHeights[visualIdx],
                  isFirst && "rank-accent-bar"
                )}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

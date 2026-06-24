"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import { PODIUM_PLACE_STYLES, rankMedalEmoji } from "@/lib/rankStyles";
import { cn } from "@/lib/utils";
import PlayerAvatar from "./PlayerAvatar";

interface PlayerPodiumProps {
  entries: RankedQuiniela[];
}

/** Visual order: 2nd — 1st — 3rd */
const podiumOrder = [1, 0, 2] as const;

export default function PlayerPodium({ entries }: PlayerPodiumProps) {
  const t = useTranslations();
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <section className="mb-5 px-4 md:px-0">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl tracking-wide text-section">
        <span aria-hidden>🏟️</span>
        {t("podium_title")}
      </h2>
      <div className="flex items-end justify-center gap-2 md:gap-4">
        {podiumOrder.map((idx, i) => {
          const entry = top3[idx];
          const place = entry.rank as 1 | 2 | 3;
          const styles = PODIUM_PLACE_STYLES[place];
          const medal = rankMedalEmoji(place);

          return (
            <motion.div
              key={entry.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, type: "spring" }}
              className="flex w-[30%] max-w-[120px] flex-col md:max-w-[140px]"
            >
              <Link
                href={`/quiniela/${entry.slug}`}
                className={cn(
                  "relative flex flex-col items-center border-2 border-b-0 px-2 py-3 transition-transform hover:scale-[1.02]",
                  styles.cardClass,
                  place === 1 && "pb-4 podium-winner-glow"
                )}
                style={{
                  borderColor: styles.border,
                  backgroundColor: styles.bg,
                  boxShadow: place === 1 ? styles.glow : undefined,
                }}
              >
                <span
                  className="podium-rank-badge"
                  style={{
                    backgroundColor: styles.border,
                    color: place === 1 ? "#1a1400" : place === 2 ? "#1a1a1a" : "#1a1008",
                  }}
                  aria-hidden
                >
                  {place}
                </span>
                {place === 1 && (
                  <span
                    className="absolute -top-4 text-xl drop-shadow-md"
                    aria-hidden
                    title={t("leader")}
                  >
                    👑
                  </span>
                )}
                <span className="text-xl leading-none drop-shadow-sm" aria-hidden>
                  {medal}
                </span>
                <PlayerAvatar
                  captain={entry.captain}
                  size={place === 1 ? 52 : place === 2 ? 44 : 40}
                  ringColor={styles.border}
                  className="mt-1 shadow-md"
                />
                <p className="mt-2 line-clamp-2 text-center text-body font-bold text-heading">
                  {entry.name}
                </p>
                <p className="truncate text-label font-medium text-secondary">
                  {entry.captain}
                </p>
                <p
                  className="score-pill mt-2 font-display text-xl font-bold"
                  style={{
                    borderColor: styles.border,
                    color: styles.border,
                    background: `color-mix(in srgb, ${styles.border} 28%, var(--surface))`,
                    boxShadow: `0 0 16px color-mix(in srgb, ${styles.border} 30%, transparent)`,
                  }}
                >
                  {entry.points}
                </p>
              </Link>

              <div
                aria-hidden
                className={cn(
                  "w-full border-2 border-t-0",
                  styles.pedestalHeight,
                  styles.pedestalClass
                )}
                style={{
                  borderColor: styles.border,
                  backgroundColor: styles.pedestalBg,
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

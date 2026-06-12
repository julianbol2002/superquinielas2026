"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import PlayerAvatar from "./PlayerAvatar";
import CountUp from "./CountUp";

interface PlayerPodiumProps {
  entries: RankedQuiniela[];
}

const podiumOrder = [1, 0, 2];
const heights = ["h-16", "h-20", "h-14"];
const colors = [
  "from-slate-300 to-slate-500",
  "from-gold to-amber-600",
  "from-amber-700 to-orange-900",
];
const medals = ["🥈", "🥇", "🥉"];

export default function PlayerPodium({ entries }: PlayerPodiumProps) {
  const t = useTranslations();
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <section className="mb-5">
      <h2 className="mb-2 text-center font-display text-xl tracking-wide text-gold">
        {t("podium_title")}
      </h2>
      <div className="flex items-end justify-center gap-2 px-2 md:gap-6">
        {podiumOrder.map((idx, visualIdx) => {
          const entry = top3[idx];
          return (
            <motion.div
              key={entry.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: visualIdx * 0.15 }}
              className="flex max-w-[110px] flex-col items-center md:max-w-[140px]"
            >
              <Link
                href={`/quiniela/${entry.slug}`}
                className="group flex flex-col items-center"
              >
                <span className="mb-0.5 text-lg">{medals[visualIdx]}</span>
                <PlayerAvatar captain={entry.captain} size={visualIdx === 1 ? 52 : 44} />
                <p className="mt-1 line-clamp-2 text-center text-xs font-semibold group-hover:text-pitch sm:text-sm">
                  {entry.name}
                </p>
                <p className="truncate text-center text-xs text-slate-400">
                  {entry.captain}
                </p>
                <p className="font-display text-xl text-pitch sm:text-2xl">
                  <CountUp value={entry.points} />
                </p>
              </Link>
              <div
                className={`mt-2 w-16 rounded-t-lg bg-gradient-to-t ${colors[visualIdx]} ${heights[visualIdx]} md:w-24`}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

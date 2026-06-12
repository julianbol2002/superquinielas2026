"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { PlayerAggregate } from "@/data/quinielas";
import { Link } from "@/i18n/routing";
import PlayerAvatar from "./PlayerAvatar";
import CountUp from "./CountUp";

interface PlayerPodiumProps {
  players: PlayerAggregate[];
}

const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd for visual layout
const heights = ["h-24", "h-32", "h-20"];
const colors = [
  "from-slate-300 to-slate-500",
  "from-gold to-amber-600",
  "from-amber-700 to-orange-900",
];
const medals = ["🥈", "🥇", "🥉"];

export default function PlayerPodium({ players }: PlayerPodiumProps) {
  const t = useTranslations();
  const top3 = players.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-center font-display text-2xl tracking-wide text-gold">
        {t("podium_title")}
      </h2>
      <div className="flex items-end justify-center gap-3 px-2 md:gap-6">
        {podiumOrder.map((idx, visualIdx) => {
          const player = top3[idx];
          return (
            <motion.div
              key={player.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: visualIdx * 0.15 }}
              className="flex flex-col items-center"
            >
              <Link href={`/jugador/${player.slug}`} className="group flex flex-col items-center">
                <span className="mb-1 text-2xl">{medals[visualIdx]}</span>
                <PlayerAvatar captain={player.captain} size={visualIdx === 1 ? 64 : 52} />
                <p className="mt-2 max-w-[90px] truncate text-center text-sm font-semibold group-hover:text-pitch">
                  {player.captain.split(" ")[0]}
                </p>
                <p className="font-display text-2xl text-pitch">
                  <CountUp value={player.totalPoints} />
                </p>
              </Link>
              <div
                className={`mt-2 w-20 rounded-t-lg bg-gradient-to-t ${colors[visualIdx]} ${heights[visualIdx]} md:w-28`}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

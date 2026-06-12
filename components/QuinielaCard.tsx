"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RankedQuiniela } from "@/data/quinielas";
import FlagChip from "./FlagChip";
import { cn } from "@/lib/utils";

function pointClass(points: number) {
  if (points >= 6) return "point-badge-6";
  if (points >= 5) return "point-badge-5";
  if (points >= 4) return "point-badge-4";
  if (points >= 3) return "point-badge-3";
  if (points >= 2) return "point-badge-2";
  return "point-badge-1";
}

export default function QuinielaCard({ quiniela }: { quiniela: RankedQuiniela }) {
  const t = useTranslations();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white light:shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{quiniela.name}</p>
          <p className="text-xs text-slate-400">${quiniela.bet}</p>
        </div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={cn(
            "rounded-lg px-3 py-1 font-accent text-lg",
            pointClass(quiniela.points)
          )}
        >
          {quiniela.points}
        </motion.span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <div>
          <span className="text-slate-500">{t("finalist")}:</span>
          <div className="mt-1 flex gap-1">
            <FlagChip country={quiniela.finalist1} showLabel size={14} />
            <FlagChip country={quiniela.finalist2} showLabel size={14} />
          </div>
        </div>
        <div>
          <span className="text-slate-500">{t("winner")}:</span>
          <div className="mt-1">
            <FlagChip country={quiniela.winner} showLabel size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

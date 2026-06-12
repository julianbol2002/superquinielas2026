"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import html2canvas from "html2canvas";
import type { PlayerAggregate } from "@/data/quinielas";
import FlagChip from "./FlagChip";

interface ShareCardProps {
  player: PlayerAggregate;
  topWinner: string;
}

export default function ShareCard({ player, topWinner }: ShareCardProps) {
  const t = useTranslations();
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const download = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0e17",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `super-quinielas-${player.slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        ref={cardRef}
        className="mb-4 rounded-2xl bg-gradient-to-br from-stadium-dark to-stadium-navy p-6 text-white"
        style={{ width: 360 }}
      >
        <p className="font-display text-3xl tracking-wider text-pitch">
          SUPER QUINIELAS
        </p>
        <p className="text-xs text-slate-400">Mundial 2026</p>
        <div className="my-6 text-center">
          <p className="font-accent text-sm text-gold">#{player.rank}</p>
          <p className="font-display text-2xl">{player.captain}</p>
          <p className="font-display text-5xl text-pitch">{player.totalPoints}</p>
          <p className="text-sm text-slate-400">{t("points")}</p>
        </div>
        <div className="flex justify-center">
          <FlagChip country={topWinner} showLabel size={24} />
        </div>
      </div>
      <button
        onClick={download}
        disabled={loading}
        className="w-full rounded-lg bg-gold px-4 py-3 font-semibold text-black transition hover:bg-gold/90"
      >
        {loading ? "..." : t("share_card")}
      </button>
    </div>
  );
}

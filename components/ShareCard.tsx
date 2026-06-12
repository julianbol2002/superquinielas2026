"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import html2canvas from "html2canvas";
import type { RankedQuiniela } from "@/data/quinielas";
import { formatQuinielaLabel } from "@/data/quinielas";
import FlagChip from "./FlagChip";

interface ShareCardProps {
  entry: RankedQuiniela;
}

export default function ShareCard({ entry }: ShareCardProps) {
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
      link.download = `super-quinielas-${entry.slug}.png`;
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
          <p className="font-accent text-sm text-gold">#{entry.rank}</p>
          <p className="font-display text-2xl">{entry.name}</p>
          <p className="text-sm text-slate-400">{entry.captain}</p>
          <p className="font-display text-5xl text-pitch">{entry.points}</p>
          <p className="text-sm text-slate-400">{t("points")}</p>
        </div>
        <div className="flex justify-center">
          <FlagChip country={entry.winner} showLabel size={24} />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          {formatQuinielaLabel(entry)}
        </p>
      </div>
      <button
        onClick={download}
        disabled={loading}
        className="w-full rounded-lg bg-gold px-4 py-3 font-semibold text-black transition hover:bg-gold/90"
      >
        {loading ? "..." : t("share")}
      </button>
    </div>
  );
}

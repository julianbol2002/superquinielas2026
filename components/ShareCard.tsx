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
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
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
        className="mb-4 border border-border bg-[#0a0a0a] p-6 text-white rank-accent-bar"
        style={{ width: 360 }}
      >
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt=""
            width={24}
            height={24}
            className="flex-shrink-0"
          />
          <p className="font-display text-2xl tracking-wider text-white">
            SUPER QUINIELAS
          </p>
        </div>
        <p className="mt-1 text-xs text-[#666666]">{t("tournament_year")}</p>
        <div className="my-6 text-center">
          <p className="text-sm text-[#f5c518]">#{entry.rank}</p>
          <p className="font-display text-2xl text-white">{entry.name}</p>
          <p className="text-sm text-[#999999]">{entry.captain}</p>
          <p className="font-display text-5xl text-[#f5c518]">{entry.points}</p>
          <p className="text-sm text-[#999999]">{t("points")}</p>
        </div>
        <div className="flex justify-center">
          <FlagChip country={entry.winner} showLabel size={24} />
        </div>
        <p className="mt-4 text-center text-xs text-[#666666]">
          {formatQuinielaLabel(entry)}
        </p>
      </div>
      <button
        onClick={download}
        disabled={loading}
        className="min-h-[44px] w-full border border-accent bg-accent px-4 py-3 text-body font-medium text-black transition-colors duration-150 hover:bg-transparent hover:text-accent disabled:opacity-50"
      >
        {loading ? "..." : t("share")}
      </button>
    </div>
  );
}

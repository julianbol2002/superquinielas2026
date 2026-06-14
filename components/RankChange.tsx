"use client";

import { useTranslations } from "next-intl";

export default function RankChange({ change }: { change: number }) {
  const t = useTranslations();

  if (change === 0) {
    return (
      <span className="text-[10px] text-[#444444]" title={t("no_change")}>
        —
      </span>
    );
  }

  const up = change > 0;

  return (
    <span
      className={`inline-flex items-center text-[10px] ${
        up ? "text-[#00cc66]" : "text-[#ff4444]"
      }`}
      title={`${Math.abs(change)} ${up ? t("positions_up") : t("positions_down")}`}
    >
      {up ? "↑" : "↓"}
      {Math.abs(change)}
    </span>
  );
}

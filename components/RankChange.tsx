"use client";

import { useTranslations } from "next-intl";

export default function RankChange({ change }: { change: number }) {
  const t = useTranslations();

  if (change === 0) {
    return (
      <span className="text-xs text-muted" title={t("no_change")}>
        —
      </span>
    );
  }

  const up = change > 0;

  return (
    <span
      className="text-xs font-semibold"
      style={{ color: up ? "var(--green)" : "var(--accent)" }}
      title={`${Math.abs(change)} ${up ? t("positions_up") : t("positions_down")}`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(change)}
    </span>
  );
}

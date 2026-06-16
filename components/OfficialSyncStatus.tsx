"use client";

import { useLocale, useTranslations } from "next-intl";
import { OFFICIAL_SYNC_STALE_MS } from "@/data/expectedPoints";
import { useScoreOverrides } from "@/components/ScoreOverridesProvider";
import { cn } from "@/lib/utils";

export default function OfficialSyncStatus() {
  const t = useTranslations();
  const locale = useLocale();
  const { meta, loading } = useScoreOverrides();
  const lastSyncedAt = meta.lastSyncedAt;

  if (loading) return null;

  if (!lastSyncedAt) {
    return (
      <p className="mb-3 px-4 text-[11px] text-muted md:px-0">
        {t("official_sync_baseline")}
      </p>
    );
  }

  const stale =
    Date.now() - new Date(lastSyncedAt).getTime() > OFFICIAL_SYNC_STALE_MS;

  const formatted = new Date(lastSyncedAt).toLocaleString(
    locale === "es" ? "es-ES" : "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <p
      className={cn(
        "mb-3 px-4 text-[11px] md:px-0",
        stale ? "text-[#ff4444]" : "text-muted"
      )}
    >
      {t("official_sync_status", { time: formatted })}
    </p>
  );
}

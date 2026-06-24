"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useScores } from "@/components/ScoresProvider";
import { cn } from "@/lib/utils";

const CACHE_DURATION = 30 * 60 * 1000;

export default function OfficialSyncStatus({
  adminMode,
  onForceRefresh,
  refreshing,
}: {
  adminMode?: boolean;
  onForceRefresh?: () => void;
  refreshing?: boolean;
}) {
  const t = useTranslations();
  const { lastFetched, scores, loading } = useScores();
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (lastFetched === 0 && scores.length === 0) {
    return (
      <p className="mb-3 px-4 text-[11px] text-muted md:px-0">
        {t("official_sync_never")}
      </p>
    );
  }

  const minsAgo = Math.max(0, Math.floor((now - lastFetched) / 60_000));
  const stale = now - lastFetched > CACHE_DURATION;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 px-4 md:px-0">
      <p className={cn("text-[11px]", stale ? "text-[#ff4444]" : "text-muted")}>
        {loading ? t("sync_force_loading") : t("official_sync_minutes_ago", { mins: minsAgo })}
      </p>
      {adminMode && onForceRefresh && (
        <button
          type="button"
          onClick={onForceRefresh}
          disabled={refreshing}
          className="min-h-[32px] border border-border bg-surface px-2 py-1 text-[11px] font-medium text-secondary hover:bg-hover disabled:opacity-50"
        >
          {refreshing ? t("sync_force_loading") : t("sync_force")}
        </button>
      )}
    </div>
  );
}

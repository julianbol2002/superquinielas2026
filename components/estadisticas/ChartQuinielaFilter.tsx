"use client";

import { useMemo, useState } from "react";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { getTopSlugs } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type ChartFilterMode = "top5" | "top10" | "all" | "custom";

export function useChartQuinielaFilter(snapshot: AnalyticsSnapshot) {
  const [mode, setMode] = useState<ChartFilterMode>("top5");
  const [customSlugs, setCustomSlugs] = useState<string[]>([]);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const slugs = useMemo(() => {
    if (mode === "top5") return getTopSlugs(snapshot, 5);
    if (mode === "top10") return getTopSlugs(snapshot, 10);
    if (mode === "custom") return customSlugs.slice(0, 8);
    return snapshot.quinielaSlugs;
  }, [mode, customSlugs, snapshot]);

  const toggleCustomSlug = (slug: string) => {
    setCustomSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 8) return prev;
      return [...prev, slug];
    });
  };

  return {
    mode,
    setMode,
    slugs,
    hoveredSlug,
    setHoveredSlug,
    customSlugs,
    toggleCustomSlug,
    pickerOpen,
    setPickerOpen,
  };
}

export default function ChartQuinielaFilter({
  snapshot,
  mode,
  onModeChange,
  customSlugs,
  onToggleCustom,
  pickerOpen,
  onPickerOpenChange,
}: {
  snapshot: AnalyticsSnapshot;
  mode: ChartFilterMode;
  onModeChange: (mode: ChartFilterMode) => void;
  customSlugs: string[];
  onToggleCustom: (slug: string) => void;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
}) {
  const pills: { key: ChartFilterMode; label: string }[] = [
    { key: "top5", label: "Top 5" },
    { key: "top10", label: "Top 10" },
    { key: "all", label: "Todos" },
    { key: "custom", label: "Seleccionar" },
  ];

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-2">
        {pills.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              onModeChange(key);
              if (key === "custom") onPickerOpenChange(true);
              else onPickerOpenChange(false);
            }}
            className={cn(
              "min-h-[36px] border px-3 py-1 text-label font-medium transition-colors duration-150",
              mode === key
                ? "border-[#1a3d2a] bg-[#1a3d2a] text-accent"
                : "border-border bg-surface text-muted hover:bg-hover"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "custom" && pickerOpen && (
        <div className="mt-2 max-h-48 overflow-y-auto border border-border bg-surface p-2">
          <p className="mb-2 text-label text-muted">
            Elige hasta 8 ({customSlugs.length}/8)
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {snapshot.quinielaSlugs.map((slug) => {
              const checked = customSlugs.includes(slug);
              const disabled = !checked && customSlugs.length >= 8;
              return (
                <label
                  key={slug}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-1 py-1 text-label",
                    disabled && "cursor-not-allowed opacity-40"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggleCustom(slug)}
                    className="accent-accent"
                  />
                  <span className="truncate">{snapshot.quinielaNames[slug]}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

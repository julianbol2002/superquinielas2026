"use client";

import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { COOKIE_KEYS, setCookie, type Colorway } from "@/lib/cookies";
import { applyAppearance, COLORWAY_OPTIONS } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function ColorwayPicker() {
  const t = useTranslations();
  const { theme, colorway, setColorway } = useAppStore();

  const select = (next: Colorway) => {
    setColorway(next);
    setCookie(COOKIE_KEYS.colorway, next);
    applyAppearance(theme, next);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {COLORWAY_OPTIONS.map((option) => {
        const selected = colorway === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => select(option.id)}
            className={cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-2 border px-3 py-2 text-label font-medium transition-colors duration-150",
              selected
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-secondary hover:bg-hover"
            )}
          >
            <span className="flex gap-1">
              <span
                className="h-4 w-4 border border-border"
                style={{ backgroundColor: option.swatch }}
                aria-hidden
              />
              <span
                className="h-4 w-4 border border-border"
                style={{ backgroundColor: option.swatchAlt }}
                aria-hidden
              />
            </span>
            <span>{t(option.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}

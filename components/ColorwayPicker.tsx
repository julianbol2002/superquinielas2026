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
              "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition",
              selected
                ? "border-pitch bg-pitch/10 ring-2 ring-pitch/40"
                : "border-white/10 bg-white/5 hover:border-white/20 light:border-slate-200 light:bg-slate-50 light:hover:border-slate-300"
            )}
          >
            <span className="flex gap-1">
              <span
                className="h-6 w-6 rounded-full border border-white/20 light:border-slate-300"
                style={{ backgroundColor: option.swatch }}
                aria-hidden
              />
              <span
                className="h-6 w-6 rounded-full border border-white/20 light:border-slate-300"
                style={{ backgroundColor: option.swatchAlt }}
                aria-hidden
              />
            </span>
            <span className={selected ? "text-pitch" : "text-secondary"}>
              {t(option.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { COOKIE_KEYS, setCookie, type Theme } from "@/lib/cookies";
import { applyAppearance } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const t = useTranslations();
  const { theme, colorway, setTheme } = useAppStore();

  const toggle = (next: Theme) => {
    setTheme(next);
    setCookie(COOKIE_KEYS.theme, next);
    applyAppearance(next, colorway);
  };

  return (
    <div className="flex gap-2">
      {(["dark", "light"] as Theme[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            "min-h-[44px] flex-1 border px-4 py-2.5 text-body font-medium transition-colors duration-150",
            theme === opt
              ? "border-accent bg-accent text-black"
              : "border-border bg-surface text-secondary hover:bg-hover"
          )}
        >
          {opt === "dark" ? t("dark") : t("light")}
        </button>
      ))}
    </div>
  );
}

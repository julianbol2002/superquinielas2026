"use client";

import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { COOKIE_KEYS, setCookie, type Theme } from "@/lib/cookies";
import { applyAppearance } from "@/lib/theme";

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
          className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition ${
            theme === opt
              ? "bg-pitch text-black"
              : "bg-white/10 text-slate-300 light:bg-slate-100 light:text-slate-600"
          }`}
        >
          {opt === "dark" ? `🌑 ${t("dark")}` : `☀️ ${t("light")}`}
        </button>
      ))}
    </div>
  );
}

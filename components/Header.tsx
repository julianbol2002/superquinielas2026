"use client";

import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { COOKIE_KEYS, setCookie, type Theme, type Language } from "@/lib/cookies";
import { applyAppearance } from "@/lib/theme";
import { cn } from "@/lib/utils";
import DailyRecapBell from "./DailyRecapBell";

const navLinks = [
  { href: "/", labelKey: "nav_home" as const },
  { href: "/partidos", labelKey: "nav_matches" as const },
  { href: "/quinielas", labelKey: "nav_quinielas" as const },
  { href: "/picks", labelKey: "nav_picks" as const },
  { href: "/estadisticas", labelKey: "nav_stats" as const },
  { href: "/ajustes", labelKey: "nav_settings" as const },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, colorway, language, setTheme, setLanguage } = useAppStore();

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setCookie(COOKIE_KEYS.theme, next);
    applyAppearance(next, colorway);
  };

  const toggleLanguage = () => {
    const next: Language = language === "es" ? "en" : "es";
    setLanguage(next);
    setCookie(COOKIE_KEYS.language, next);
    router.replace(pathname, { locale: next });
  };

  return (
    <div className="sticky top-0 z-50">
      <header className="espn-header text-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 flex-col">
              <span className="font-display text-3xl font-bold leading-none text-white md:text-4xl">
                {t("site_name")}
              </span>
              <span className="mt-1 text-[11px] uppercase tracking-widest text-white/70 md:text-sm">
                {t("tournament_year")}
              </span>
            </Link>

            <div className="flex flex-shrink-0 items-center gap-2">
              <DailyRecapBell />
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={t("theme")}
                className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/80 transition-colors hover:border-espn-red hover:text-espn-red"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={t("language")}
                className="flex h-9 min-w-[36px] items-center justify-center border border-white/20 px-2 font-display text-xs font-semibold uppercase tracking-wider text-white/80 transition-colors hover:border-espn-red hover:text-espn-red"
              >
                {language === "es" ? "EN" : "ES"}
              </button>
            </div>
          </div>

          <nav className="mt-4 hidden flex-wrap gap-5 border-t border-white/10 pt-3 md:flex">
            {navLinks.map((link) => {
              const active = isNavActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-display text-sm font-semibold uppercase tracking-wider transition-colors",
                    active
                      ? "border-b-2 border-espn-red pb-0.5 text-espn-red"
                      : "text-white/75 hover:text-espn-red"
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </div>
  );
}

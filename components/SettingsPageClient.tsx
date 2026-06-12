"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { getCaptains } from "@/data/quinielas";
import { useAppStore } from "@/lib/store";
import {
  COOKIE_KEYS,
  setCookie,
  removeCookie,
  clearAllCookies,
  type Language,
} from "@/lib/cookies";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import PlayerAvatar from "@/components/PlayerAvatar";
import AvatarUpload from "@/components/AvatarUpload";

export default function SettingsPageClient() {
  const t = useTranslations();
  const captains = getCaptains();
  const { activePlayer, setActivePlayer, setTheme, setLanguage } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const selectPlayer = (name: string) => {
    const value = name || null;
    setActivePlayer(value);
    if (value) {
      setCookie(COOKIE_KEYS.activePlayer, value);
    } else {
      removeCookie(COOKIE_KEYS.activePlayer);
    }
  };

  const reset = () => {
    clearAllCookies();
    setActivePlayer(null);
    setTheme("dark");
    setLanguage("es");
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    router.replace(pathname, { locale: "es" as Language });
    window.location.reload();
  };

  return (
    <div className="pb-8">
      <h1 className="mb-6 font-display text-3xl tracking-wide">
        {t("settings")}
      </h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("language")}
        </h2>
        <LanguageToggle />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("theme")}
        </h2>
        <ThemeToggle />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("active_player")}
        </h2>
        <select
          value={activePlayer ?? ""}
          onChange={(e) => selectPlayer(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-stadium-card px-4 py-3 text-base outline-none focus:border-pitch light:border-slate-200 light:bg-white"
        >
          <option value="">{t("no_player")}</option>
          {captains.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {activePlayer && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white">
            <PlayerAvatar captain={activePlayer} size={48} />
            <div>
              <p className="font-semibold">{activePlayer}</p>
              <AvatarUpload captain={activePlayer} />
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("notifications")}
        </h2>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-stadium-card px-4 py-3 light:border-slate-200 light:bg-white">
          <span className="text-sm">{t("notifications_soon")}</span>
          <div className="h-6 w-11 rounded-full bg-white/10 opacity-50" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("reset")}
        </h2>
        <p className="mb-3 text-sm text-muted">{t("reset_desc")}</p>
        <button
          onClick={reset}
          className="rounded-lg border border-red-500/50 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
        >
          {t("reset")}
        </button>
      </section>
    </div>
  );
}

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
import { applyAppearance } from "@/lib/theme";
import ThemeToggle from "@/components/ThemeToggle";
import ColorwayPicker from "@/components/ColorwayPicker";
import LanguageToggle from "@/components/LanguageToggle";
import PlayerAvatar from "@/components/PlayerAvatar";
import AvatarUpload from "@/components/AvatarUpload";

export default function SettingsPageClient() {
  const t = useTranslations();
  const captains = getCaptains();
  const { activePlayer, setActivePlayer, setTheme, setColorway, setLanguage } =
    useAppStore();
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
    setColorway("classic");
    setLanguage("es");
    applyAppearance("dark", "classic");
    router.replace(pathname, { locale: "es" as Language });
    window.location.reload();
  };

  return (
    <div className="px-4 pb-8 md:px-0">
      <h1 className="mb-6 font-display text-2xl tracking-wide text-heading">
        {t("settings")}
      </h1>

      <section className="mb-8">
        <h2 className="mb-3 label-caps">{t("language")}</h2>
        <LanguageToggle />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 label-caps">{t("theme")}</h2>
        <ThemeToggle />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 label-caps">{t("colorway")}</h2>
        <p className="mb-3 text-body text-muted">{t("colorway_desc")}</p>
        <ColorwayPicker />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 label-caps">{t("active_player")}</h2>
        <select
          value={activePlayer ?? ""}
          onChange={(e) => selectPlayer(e.target.value)}
          className="min-h-[44px] w-full border border-border bg-surface px-3 py-2 text-body outline-none transition-colors duration-150 focus:border-accent"
        >
          <option value="">{t("no_player")}</option>
          {captains.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {activePlayer && (
          <div className="mt-4 flex items-center gap-3 border border-border bg-surface p-4">
            <PlayerAvatar captain={activePlayer} size={48} />
            <div>
              <p className="font-medium text-primary-theme">{activePlayer}</p>
              <AvatarUpload captain={activePlayer} />
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 label-caps">{t("notifications")}</h2>
        <div className="flex min-h-[44px] items-center justify-between border border-border bg-surface px-4 py-3">
          <span className="text-body">{t("notifications_soon")}</span>
          <div className="h-6 w-11 border border-border bg-page opacity-50" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 label-caps">{t("reset")}</h2>
        <p className="mb-3 text-body text-muted">{t("reset_desc")}</p>
        <button
          onClick={reset}
          className="min-h-[44px] border border-red-500/40 px-4 py-2.5 text-body text-red-400 transition-colors duration-150 hover:bg-hover"
        >
          {t("reset")}
        </button>
      </section>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  getThemeFromCookie,
  getColorwayFromCookie,
  getLanguageFromCookie,
  getActivePlayerFromCookie,
} from "@/lib/cookies";
import { applyAppearance } from "@/lib/theme";
import Header from "./Header";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";

export default function AppShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const {
    setTheme,
    setColorway,
    setLanguage,
    setActivePlayer,
    setHydrated,
    theme,
    colorway,
  } = useAppStore();

  useEffect(() => {
    const savedTheme = getThemeFromCookie();
    const savedColorway = getColorwayFromCookie();
    const savedLang = getLanguageFromCookie();
    const savedPlayer = getActivePlayerFromCookie();

    setTheme(savedTheme);
    setColorway(savedColorway);
    setLanguage((locale as "es" | "en") || savedLang);
    setActivePlayer(savedPlayer ?? null);
    setHydrated(true);

    applyAppearance(savedTheme, savedColorway);
  }, [locale, setTheme, setColorway, setLanguage, setActivePlayer, setHydrated]);

  useEffect(() => {
    applyAppearance(theme, colorway);
  }, [theme, colorway]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-2 md:px-6 md:pt-4">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}

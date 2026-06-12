"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  getThemeFromCookie,
  getLanguageFromCookie,
  getActivePlayerFromCookie,
} from "@/lib/cookies";
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
  const { setTheme, setLanguage, setActivePlayer, setHydrated, theme } =
    useAppStore();

  useEffect(() => {
    const savedTheme = getThemeFromCookie();
    const savedLang = getLanguageFromCookie();
    const savedPlayer = getActivePlayerFromCookie();

    setTheme(savedTheme);
    setLanguage((locale as "es" | "en") || savedLang);
    setActivePlayer(savedPlayer ?? null);
    setHydrated(true);

    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(savedTheme);
  }, [locale, setTheme, setLanguage, setActivePlayer, setHydrated]);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 md:px-6 md:pt-6">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { COOKIE_KEYS, setCookie, type Language } from "@/lib/cookies";

export default function LanguageToggle() {
  const t = useTranslations();
  const { language, setLanguage } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (next: Language) => {
    setLanguage(next);
    setCookie(COOKIE_KEYS.language, next);
    router.replace(pathname, { locale: next });
  };

  return (
    <div className="flex gap-2">
      {(["es", "en"] as Language[]).map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition ${
            language === loc
              ? "bg-pitch text-black"
              : "bg-white/10 text-slate-300 light:bg-slate-100 light:text-slate-600"
          }`}
        >
          {loc === "es" ? "🇪🇸 Español" : "🇬🇧 English"}
        </button>
      ))}
    </div>
  );
}

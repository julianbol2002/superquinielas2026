"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { COOKIE_KEYS, setCookie, type Language } from "@/lib/cookies";
import { cn } from "@/lib/utils";

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
          className={cn(
            "min-h-[44px] flex-1 border px-4 py-2.5 text-body font-medium transition-colors duration-150",
            language === loc
              ? "border-accent bg-accent text-black"
              : "border-border bg-surface text-secondary hover:bg-hover"
          )}
        >
          {loc === "es" ? "Español" : "English"}
        </button>
      ))}
    </div>
  );
}

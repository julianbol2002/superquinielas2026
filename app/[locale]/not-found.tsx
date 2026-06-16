import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl text-pitch">404</p>
      <p className="mt-2 text-slate-400">{t("not_found_title")}</p>
      <Link href="/" className="mt-6 text-pitch hover:underline">
        ← {t("not_found_back")}
      </Link>
    </div>
  );
}

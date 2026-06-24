import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import AppShell from "@/components/AppShell";
import { ScoresProvider } from "@/components/ScoresProvider";
import { getLastFetched, getScores } from "@/lib/getScores";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export const revalidate = 1800;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;
  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const scores = await getScores();

  return (
    <NextIntlClientProvider messages={messages}>
      <ScoresProvider initialScores={scores} initialLastFetched={getLastFetched()}>
        <AppShell locale={locale}>{children}</AppShell>
      </ScoresProvider>
    </NextIntlClientProvider>
  );
}

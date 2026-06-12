import { setRequestLocale } from "next-intl/server";
import SettingsPageClient from "@/components/SettingsPageClient";

type Props = { params: { locale: string } };

export default function AjustesPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <SettingsPageClient />;
}

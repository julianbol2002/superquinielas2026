import { setRequestLocale } from "next-intl/server";
import CompararPageClient from "@/components/estadisticas/CompararPageClient";

type Props = { params: { locale: string } };

export default function CompararPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <CompararPageClient />;
}

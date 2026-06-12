import { setRequestLocale } from "next-intl/server";
import EstadisticasPageClient from "@/components/estadisticas/EstadisticasPageClient";

type Props = { params: { locale: string } };

export default function EstadisticasPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <EstadisticasPageClient />;
}

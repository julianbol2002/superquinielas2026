import { setRequestLocale } from "next-intl/server";
import MatchGrid from "@/components/MatchGrid";

type Props = { params: { locale: string } };

export default function PartidosPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <MatchGrid />;
}

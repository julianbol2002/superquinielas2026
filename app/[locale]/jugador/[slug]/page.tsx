import { setRequestLocale } from "next-intl/server";
import PlayerProfileClient from "@/components/PlayerProfileClient";

type Props = { params: { locale: string; slug: string } };

export default function JugadorPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <PlayerProfileClient slug={params.slug} />;
}

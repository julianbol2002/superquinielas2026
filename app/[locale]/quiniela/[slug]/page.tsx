import { setRequestLocale } from "next-intl/server";
import QuinielaDetailClient from "@/components/QuinielaDetailClient";

type Props = { params: { locale: string; slug: string } };

export default function QuinielaPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <QuinielaDetailClient slug={params.slug} />;
}

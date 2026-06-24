import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { slugToQuiniela } from "@/data/quinielas";
import QuinielaDetailClient from "@/components/QuinielaDetailClient";

type Props = { params: { locale: string; slug: string } };

export default function QuinielaPage({ params }: Props) {
  setRequestLocale(params.locale);
  if (!slugToQuiniela(params.slug)) {
    notFound();
  }
  return <QuinielaDetailClient slug={params.slug} />;
}

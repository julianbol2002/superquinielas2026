import { setRequestLocale } from "next-intl/server";
import HomePageClient from "@/components/HomePageClient";

type Props = { params: { locale: string } };

export default function HomePage({ params }: Props) {
  setRequestLocale(params.locale);
  return <HomePageClient />;
}

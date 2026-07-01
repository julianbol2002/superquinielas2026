import { setRequestLocale } from "next-intl/server";
import AllPicksGrid from "@/components/AllPicksGrid";

type Props = { params: { locale: string } };

export default function PicksPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <AllPicksGrid />;
}

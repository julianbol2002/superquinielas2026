import { setRequestLocale } from "next-intl/server";
import QuinielasTable from "@/components/QuinielasTable";

type Props = { params: { locale: string } };

export default function QuinielasPage({ params }: Props) {
  setRequestLocale(params.locale);
  return <QuinielasTable />;
}

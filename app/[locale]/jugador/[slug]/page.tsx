import { redirect } from "@/i18n/routing";

type Props = { params: { locale: string; slug: string } };

/** Legacy route — redirects to /quiniela/[slug] */
export default function JugadorPage({ params }: Props) {
  redirect({ href: `/quiniela/${params.slug}`, locale: params.locale });
}

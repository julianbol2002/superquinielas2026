import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl text-pitch">404</p>
      <p className="mt-2 text-slate-400">Jugador no encontrado</p>
      <Link href="/" className="mt-6 text-pitch hover:underline">
        ← Volver al inicio
      </Link>
    </div>
  );
}

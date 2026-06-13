import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUPER QUINIELAS — Mundial 2026",
  description:
    "Clasificación familiar del Mundial 2026 — World Cup bracket challenge leaderboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SUPER QUINIELAS",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const appearanceScript = `(function(){try{var g=function(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):null};var t=g("theme")==="light"?"light":"dark";var c=g("colorway");var v=["classic","ocean","sunset","royal","rojo"];if(!v.includes(c))c="classic";var r=document.documentElement;r.classList.add(t,"colorway-"+c);r.dataset.colorway=c;}catch(e){document.documentElement.classList.add("dark","colorway-classic");}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark colorway-classic" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="min-h-screen font-body antialiased">{children}</body>
    </html>
  );
}

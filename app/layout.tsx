import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://super-quinielas.vercel.app"
  ),
  title: "Super Quinielas — Mundial 2026",
  description: "Quiniela familiar del Mundial 2026",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-152x152.png",
  },
  openGraph: {
    title: "Super Quinielas — Mundial 2026",
    description: "Quiniela familiar del Mundial 2026",
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Super Quinielas",
  },
};

export const viewport: Viewport = {
  themeColor: "#cc0000",
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
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="min-h-screen font-body antialiased">{children}</body>
    </html>
  );
}

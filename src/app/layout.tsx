import { Suspense } from "react";
import type { Metadata } from "next";
import { Quicksand, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const helveticaNowMonks = localFont({
  src: "./fonts/HelveticaNowforMonks-ExtXBd.otf",
  variable: "--font-helvetica-monks",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Medialab OS Hub",
  description: "Hub operativo de Medialab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${quicksand.variable} ${geistMono.variable} ${helveticaNowMonks.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <Suspense fallback={children}>
          {children}
        </Suspense>

        {/* Screen too narrow overlay — shown below 1100px wide */}
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background px-8 text-center min-[1100px]:hidden">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="7" width="38" height="26" rx="4" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
            <path d="M8 33v3M32 33v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground" />
            <path d="M15 20h10M20 15v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground" strokeDasharray="3 2" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-foreground">Pantalla demasiado angosta</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
              Esta aplicación necesita una pantalla de al menos 1100px de ancho. Abrila desde una computadora o ampliá la ventana del navegador.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

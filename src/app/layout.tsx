import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { HydrationProvider } from "@/components/providers/HydrationProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PAQUIURCISNER - Sistema de Informes de Obra",
  description: "Sistema inteligente de generación de informes de obra para estructuras metálicas. Potenciado por IA para OCR y descripciones automáticas.",
  keywords: ["PAQUIURCISNER", "Informes de Obra", "Estructuras Metálicas", "Next.js", "IA", "OCR"],
  authors: [{ name: "PAQUIURCISNER" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "PAQUIURCISNER - Sistema de Informes de Obra",
    description: "Sistema inteligente de generación de informes de obra",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <HydrationProvider>
            {children}
            <Toaster />
          </HydrationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

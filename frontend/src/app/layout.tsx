// =====================================================================
// AutoQuote — Layout root
// Apenas duas fontes: Space Grotesk (display) e Inter (body).
// suppressHydrationWarning é necessário para o next-themes injetar
// a classe de tema antes da hidratação sem warning do React.
// =====================================================================
import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoQuote",
  description: "Automação de extração de cotações Vale — multi-tenant.",
  icons: { icon: "/assets/symbol-ink-amber-tail-1024.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable}`}
    >
      <body className="antialiased min-h-screen font-body">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

"use client";

// =====================================================================
// AutoQuote — ThemeProvider
// Encapsula o next-themes. Default: light. Toggle expõe apenas
// dois modos (light/dark) sem seguir o tema do sistema.
// =====================================================================
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

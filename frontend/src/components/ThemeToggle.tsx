"use client";

// =====================================================================
// AutoQuote — ThemeToggle
// Alterna entre light e dark via next-themes.
// Lua quando estiver no claro (clique vai pro escuro); Sol no escuro.
// =====================================================================
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type Props = {
  className?: string;
};

export default function ThemeToggle({ className = "" }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita flash de ícone errado durante a hidratação
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
      className={`text-carbon/40 dark:text-bone/40 hover:text-carbon dark:hover:text-bone transition-colors ${className}`}
    >
      {mounted ? (
        isDark ? <Sun size={18} /> : <Moon size={18} />
      ) : (
        <span className="inline-block w-[18px] h-[18px]" />
      )}
    </button>
  );
}

"use client";

// =====================================================================
// AutoQuote — /login
// Tela cheia centralizada. Sem sidebar, sem header. Apenas o card de
// autenticação e o ThemeToggle no canto superior direito.
// =====================================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErro("Credenciais inválidas");
        return;
      }
      router.refresh();
      router.push("/");
    } catch {
      setErro("Falha inesperada ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-bone dark:bg-carbon h-screen w-screen flex items-center justify-center px-4 relative">
      {/* Theme toggle no canto superior direito */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div
        className="
          w-full max-w-sm
          bg-carbon/5 dark:bg-bone/5
          border border-carbon/10 dark:border-bone/10
          rounded-md p-8
        "
      >
        <div className="flex justify-center mb-8">
          <Image
            src="/assets/logo.png"
            alt="AutoQuote"
            width={240}
            height={48}
            priority
            className="block dark:hidden h-12 w-auto"
            style={{ width: "auto" }}
          />
          <Image
            src="/assets/logo-dark.png"
            alt="AutoQuote"
            width={240}
            height={48}
            priority
            className="hidden dark:block h-12 w-auto"
            style={{ width: "auto" }}
          />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide">
              E-mail
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className="
                bg-bone dark:bg-carbon
                border border-carbon/20 dark:border-bone/20
                text-carbon dark:text-bone
                placeholder:text-carbon/40 dark:placeholder:text-bone/40
                rounded px-3 py-2
                focus:border-amber focus:outline-none
              "
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="
                bg-bone dark:bg-carbon
                border border-carbon/20 dark:border-bone/20
                text-carbon dark:text-bone
                placeholder:text-carbon/40 dark:placeholder:text-bone/40
                rounded px-3 py-2
                focus:border-amber focus:outline-none
              "
            />
          </div>

          {erro && (
            <p
              className="font-body text-red-600 dark:text-red-400 text-xs"
              role="alert"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              bg-amber text-carbon
              font-display font-bold
              w-full py-2.5 rounded mt-2
              hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity
            "
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

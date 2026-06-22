"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Phase = "loading" | "logged-in" | "signup" | "done" | "error";

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center">
        <Loader2 size={28} className="text-amber animate-spin" />
      </main>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}

function BillingSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setPhase("logged-in");
        return;
      }

      if (!sessionId) {
        // Sem session_id — mostra signup sem email pré-preenchido
        setPhase("signup");
        return;
      }

      // Busca email da sessão Stripe
      const res = await fetch(`/api/billing/session?session_id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email ?? "");
      }
      setPhase("signup");
    })();
  }, [sessionId]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    setPhase("done");
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (phase === "loading") {
    return (
      <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center">
        <Loader2 size={28} className="text-amber animate-spin" />
      </main>
    );
  }

  if (phase === "logged-in") {
    return (
      <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md p-8 flex flex-col items-center gap-6 text-center">
          <CheckCircle2 size={48} className="text-green-500" />
          <div>
            <h1 className="font-display font-bold text-xl text-carbon dark:text-bone">
              Assinatura ativada!
            </h1>
            <p className="font-body text-carbon/60 dark:text-bone/60 text-sm mt-2">
              Seu plano AutoQuote Empresarial está ativo.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-amber text-carbon font-display font-bold w-full py-2.5 rounded hover:opacity-90 transition-opacity"
          >
            Ir para o Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md p-8 flex flex-col items-center gap-6 text-center">
          <CheckCircle2 size={48} className="text-green-500" />
          <div>
            <h1 className="font-display font-bold text-xl text-carbon dark:text-bone">
              Conta criada!
            </h1>
            <p className="font-body text-carbon/60 dark:text-bone/60 text-sm mt-2">
              Redirecionando para o Dashboard…
            </p>
          </div>
          <Loader2 size={20} className="text-amber animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md p-8 flex flex-col gap-6">
        <div className="text-center">
          <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
          <h1 className="font-display font-bold text-xl text-carbon dark:text-bone">
            Pagamento confirmado!
          </h1>
          <p className="font-body text-carbon/60 dark:text-bone/60 text-sm mt-2">
            Crie sua senha para acessar a plataforma.
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {/* Email travado — vem do Stripe */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-medium text-carbon/50 dark:text-bone/50 uppercase tracking-wide">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="
                bg-carbon/5 dark:bg-bone/5
                border border-carbon/10 dark:border-bone/10
                text-carbon/60 dark:text-bone/60
                rounded px-3 py-2 font-body text-sm
                cursor-not-allowed select-none
              "
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-medium text-carbon/50 dark:text-bone/50 uppercase tracking-wide">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 8 caracteres"
              className="
                bg-bone dark:bg-carbon border border-carbon/20 dark:border-bone/20
                text-carbon dark:text-bone placeholder:text-carbon/40 dark:placeholder:text-bone/40
                rounded px-3 py-2 font-body text-sm
                focus:outline-none focus:border-amber transition-colors
              "
            />
          </div>

          {error && (
            <p className="font-body text-red-600 dark:text-red-400 text-xs" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="
              bg-amber text-carbon font-display font-bold
              py-2.5 rounded hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity
            "
          >
            {submitting ? "Criando conta…" : "Criar conta e acessar"}
          </button>
        </form>
      </div>
    </main>
  );
}

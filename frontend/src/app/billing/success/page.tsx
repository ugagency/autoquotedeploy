"use client";

// =====================================================================
// AutoQuote — /billing/success
// Exibida após pagamento bem-sucedido no Stripe Checkout.
// - Se já logado: tela de sucesso com link para /dashboard
// - Se não logado: formulário de signup (o trigger SQL linka a subscription)
// =====================================================================
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function BillingSuccessPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  // Formulário de signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      setChecking(false);
    });
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Trigger SQL já linkou a subscription pelo email
    setDone(true);
    setLoading(false);
    // Aguarda um instante para deixar o usuário ver o sucesso, então redireciona
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center">
        <Loader2 size={28} className="text-amber animate-spin" />
      </main>
    );
  }

  // Usuário já estava logado — mostrar tela simples
  if (loggedIn) {
    return (
      <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md p-8 flex flex-col items-center gap-6 text-center">
          <CheckCircle2 size={48} className="text-green-500" />
          <div>
            <h1 className="font-display font-bold text-xl text-carbon dark:text-bone">
              Assinatura ativada!
            </h1>
            <p className="font-body text-carbon/60 dark:text-bone/60 text-sm mt-2">
              Seu plano AutoQuote Empresarial está ativo. O robô já está liberado para uso.
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

  // Usuário ainda não tem conta — exibir formulário de signup
  return (
    <main className="min-h-screen bg-bone dark:bg-carbon flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md p-8 flex flex-col gap-6">
        {done ? (
          <div className="flex flex-col items-center gap-4 text-center">
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
        ) : (
          <>
            <div className="text-center">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
              <h1 className="font-display font-bold text-xl text-carbon dark:text-bone">
                Pagamento confirmado!
              </h1>
              <p className="font-body text-carbon/60 dark:text-bone/60 text-sm mt-2">
                Crie sua conta para acessar a plataforma. Use o mesmo e-mail do pagamento.
              </p>
            </div>

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs font-medium text-carbon/50 dark:text-bone/50 uppercase tracking-wide">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mesmo e-mail do pagamento"
                  className="
                    bg-bone dark:bg-carbon border border-carbon/20 dark:border-bone/20
                    text-carbon dark:text-bone placeholder:text-carbon/40 dark:placeholder:text-bone/40
                    rounded px-3 py-2 font-body text-sm
                    focus:outline-none focus:border-amber transition-colors
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
                disabled={loading}
                className="
                  bg-amber text-carbon font-display font-bold
                  py-2.5 rounded hover:opacity-90
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-opacity
                "
              >
                {loading ? "Criando conta…" : "Criar conta e acessar"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

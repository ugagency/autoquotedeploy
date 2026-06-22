// =====================================================================
// AutoQuote — /billing/success
// Exibida após pagamento bem-sucedido no Stripe Checkout.
// =====================================================================
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
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

        <Link
          href="/dashboard"
          className="bg-amber text-carbon font-display font-bold w-full py-2.5 rounded hover:opacity-90 transition-opacity text-center"
        >
          Ir para o Dashboard
        </Link>
      </div>
    </main>
  );
}

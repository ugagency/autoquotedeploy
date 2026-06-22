"use client";

// =====================================================================
// AutoQuote — BillingView (client component)
// Exibe status da assinatura e botões de ação para o Stripe.
// =====================================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";

type Props = {
  userEmail: string;
  userId: string;
  status: string | null;
  currentPeriodEnd: string | null;
};

type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PlanStatus }) {
  const map: Record<PlanStatus, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
    trialing: { label: "Período de teste", className: "bg-amber/10 text-amber" },
    past_due: { label: "Pagamento pendente", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
    canceled: { label: "Cancelado", className: "bg-carbon/10 dark:bg-bone/10 text-carbon/60 dark:text-bone/60" },
    inactive: { label: "Inativo", className: "bg-carbon/10 dark:bg-bone/10 text-carbon/60 dark:text-bone/60" },
  };
  const { label, className } = map[status] ?? map.inactive;
  return (
    <span className={`text-xs font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded ${className}`}>
      {label}
    </span>
  );
}

export default function BillingView({ userEmail, userId, status, currentPeriodEnd }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const planStatus = (status as PlanStatus) ?? "inactive";
  const isActive = planStatus === "active" || planStatus === "trialing";
  const renewDate = formatDate(currentPeriodEnd);

  async function handleCheckout() {
    setErro(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/billing/create-checkout-session", { method: "POST" });
      const body = await resp.json();
      if (!resp.ok) { setErro(body?.error || body?.detail || "Erro ao criar sessão"); return; }
      window.location.href = body.url;
    } catch {
      setErro("Falha ao contatar o servidor");
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setErro(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/billing/create-portal-session", { method: "POST" });
      const body = await resp.json();
      if (!resp.ok) { setErro(body?.error || body?.detail || "Erro ao abrir portal"); return; }
      window.location.href = body.url;
    } catch {
      setErro("Falha ao contatar o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bone dark:bg-carbon text-carbon dark:text-bone">
      <Sidebar userEmail={userEmail} onOpenSettings={() => setShowSettings(true)} />

      <main className="ml-[220px] min-h-screen px-10 py-10">
        <div className="max-w-2xl">
          <header className="mb-8">
            <h1 className="font-display font-semibold text-2xl text-carbon dark:text-bone">
              Billing
            </h1>
            <p className="font-body text-carbon/50 dark:text-bone/50 text-sm mt-1">
              Gerencie sua assinatura do AutoQuote.
            </p>
          </header>

          {/* Card principal */}
          <div className="bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md p-6 flex flex-col gap-6">

            {/* Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-body text-xs uppercase tracking-widest text-carbon/40 dark:text-bone/40 font-medium">
                  Plano atual
                </p>
                <p className="font-display font-bold text-lg text-carbon dark:text-bone">
                  AutoQuote Empresarial
                </p>
                {renewDate && isActive && (
                  <p className="font-body text-xs text-carbon/50 dark:text-bone/50">
                    Renova em {renewDate}
                  </p>
                )}
                {renewDate && !isActive && planStatus === "canceled" && (
                  <p className="font-body text-xs text-carbon/50 dark:text-bone/50">
                    Acesso até {renewDate}
                  </p>
                )}
              </div>
              <StatusBadge status={planStatus} />
            </div>

            {/* Ícone de estado */}
            <div className="flex items-center gap-3 py-2">
              {isActive && (
                <CheckCircle2 size={20} className="text-green-500 shrink-0" />
              )}
              {planStatus === "past_due" && (
                <AlertTriangle size={20} className="text-amber shrink-0" />
              )}
              {(planStatus === "canceled" || planStatus === "inactive") && (
                <XCircle size={20} className="text-carbon/30 dark:text-bone/30 shrink-0" />
              )}
              <p className="font-body text-sm text-carbon/70 dark:text-bone/70">
                {isActive && "Seu plano está ativo. O robô está disponível para uso."}
                {planStatus === "past_due" && "Há um problema com seu pagamento. Regularize para continuar usando o robô."}
                {planStatus === "canceled" && "Sua assinatura foi cancelada. Assine novamente para reativar o robô."}
                {planStatus === "inactive" && "Você ainda não tem uma assinatura ativa. Assine para desbloquear o robô."}
              </p>
            </div>

            {erro && (
              <p className="font-body text-red-600 dark:text-red-400 text-xs" role="alert">
                {erro}
              </p>
            )}

            {/* Ações */}
            {isActive ? (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-carbon/5 dark:bg-bone/5 border border-carbon/15 dark:border-bone/15 text-carbon dark:text-bone font-display font-bold py-2.5 rounded hover:bg-carbon/10 dark:hover:bg-bone/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CreditCard size={16} />
                {loading ? "Abrindo portal..." : "Gerenciar assinatura"}
                <ExternalLink size={14} className="text-carbon/40 dark:text-bone/40" />
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="bg-amber text-carbon font-display font-bold py-2.5 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {loading ? "Redirecionando..." : "Assinar agora"}
              </button>
            )}

            {planStatus === "past_due" && (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="flex items-center justify-center gap-2 border border-amber text-amber font-display font-bold py-2.5 rounded hover:bg-amber/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <AlertTriangle size={16} />
                {loading ? "Abrindo portal..." : "Regularizar pagamento"}
              </button>
            )}
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={userId}
        onSaved={() => {}}
      />
    </div>
  );
}

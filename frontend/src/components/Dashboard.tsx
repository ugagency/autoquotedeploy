"use client";

// =====================================================================
// AutoQuote — Dashboard
// Layout com Sidebar lateral fixa (220px) e área de conteúdo à direita.
// Sem header superior. Tipografia: Space Grotesk (display) + Inter (body).
// =====================================================================
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import DatePicker from "./DatePicker";
import HistoryPanel, { type HistoryPanelHandle } from "./HistoryPanel";
import SettingsModal from "./SettingsModal";
import Sidebar from "./Sidebar";
import StatusCard from "./StatusCard";

type Props = { userEmail: string; userId: string };

const ACTIVE_STATUSES = ["active", "trialing"];

// Converte Date → DDMMAA (formato esperado pelo backend)
function dateParaDDMMAA(d: Date): string {
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const aa = String(d.getFullYear()).slice(-2);
  return `${dia}${mes}${aa}`;
}

export default function Dashboard({ userEmail, userId }: Props) {
  const historyRef = useRef<HistoryPanelHandle>(null);

  const [data, setData] = useState<Date>(() => new Date());
  const [modoColeta, setModoColeta] = useState<"somente_novos" | "todos">(
    "somente_novos"
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);

  // Ao montar: verifica credenciais Vale, assinatura e retoma job em andamento
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();

      const [{ data: cfg }, { data: jobs }, { data: sub }] = await Promise.all([
        supabase
          .from("user_settings")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle(),
        // Pega o último job ainda ativo (queued/running) — re-conecta o
        // StatusCard depois de F5. Limit 1 evita scan grande.
        supabase
          .from("robot_jobs")
          .select("id, status")
          .eq("user_id", userId)
          .in("status", ["queued", "running"])
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      const ok = !!cfg;
      setHasCredentials(ok);
      if (!ok) setShowSettings(true);

      setSubscriptionActive(
        !!sub && ACTIVE_STATUSES.includes(sub.status ?? "")
      );

      if (jobs && jobs.length > 0) {
        setJobId(jobs[0].id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!hasCredentials) {
      setShowSettings(true);
      return;
    }
    if (!(data instanceof Date) || isNaN(data.getTime())) {
      setErro("Selecione uma data válida");
      return;
    }
    const ddmmaa = dateParaDDMMAA(data);

    setLoading(true);
    setJobId(null);
    try {
      const resp = await fetch("/api/run-robot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_coleta: ddmmaa, modo_coleta: modoColeta }),
      });
      const body = await resp.json();
      if (!resp.ok) {
        setErro(body?.detail || body?.error || "Falha ao iniciar o robô");
        return;
      }
      setJobId(body.job_id);
    } catch {
      setErro("Falha ao contatar o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bone dark:bg-carbon text-carbon dark:text-bone">
      <Sidebar
        userEmail={userEmail}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Área de conteúdo */}
      <main className="ml-[220px] min-h-screen px-10 py-10">
        <div className="max-w-3xl">
          <header className="mb-8">
            <h1 className="font-display font-semibold text-carbon dark:text-bone text-2xl">
              Nova extração
            </h1>
            <p className="font-body text-carbon/50 dark:text-bone/50 text-sm mt-1">
              Eventos da Vale para a data informada.
            </p>
          </header>

          {/* Banner: assinatura inativa */}
          {subscriptionActive === false && (
            <div className="mb-4 flex items-center justify-between gap-4 bg-amber/10 border border-amber/30 rounded-md px-4 py-3">
              <p className="font-body text-sm text-carbon dark:text-bone">
                Ative seu plano para usar o robô.
              </p>
              <Link
                href="/billing"
                className="font-display font-bold text-xs bg-amber text-carbon px-3 py-1.5 rounded hover:opacity-90 transition-opacity shrink-0"
              >
                Ver planos
              </Link>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="
              bg-carbon/5 dark:bg-bone/5
              border border-carbon/10 dark:border-bone/10
              rounded-md p-6 flex flex-col gap-5
            "
          >
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide">
                Data da coleta
              </label>
              <DatePicker value={data} onChange={setData} maxDate={new Date()} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide">
                Modo de coleta
              </label>
              <select
                value={modoColeta}
                onChange={(e) =>
                  setModoColeta(e.target.value as "somente_novos" | "todos")
                }
                className="
                  bg-bone dark:bg-carbon
                  border border-carbon/20 dark:border-bone/20
                  text-carbon dark:text-bone
                  rounded px-3 py-2
                  focus:border-amber focus:outline-none
                "
              >
                <option value="somente_novos">Somente eventos novos</option>
                <option value="todos">Todos os eventos do dia</option>
              </select>
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
              disabled={loading || hasCredentials === false || subscriptionActive === false}
              className="
                bg-amber text-carbon
                font-display font-bold
                py-2.5 rounded
                hover:opacity-90
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-opacity
              "
            >
              {loading ? "Iniciando..." : "Iniciar extração"}
            </button>

            {hasCredentials === false && (
              <p className="font-body text-carbon/40 dark:text-bone/40 text-xs">
                Configure suas credenciais Vale para liberar o robô.
              </p>
            )}
            {subscriptionActive === false && hasCredentials !== false && (
              <p className="font-body text-carbon/40 dark:text-bone/40 text-xs">
                Plano inativo — <Link href="/billing" className="underline">ative sua assinatura</Link> para continuar.
              </p>
            )}
          </form>

          <StatusCard
            jobId={jobId}
            userId={userId}
            onDone={() => historyRef.current?.refresh()}
          />

          <HistoryPanel ref={historyRef} userId={userId} />
        </div>
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={userId}
        onSaved={() => setHasCredentials(true)}
      />
    </div>
  );
}

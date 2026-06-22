"use client";

// =====================================================================
// AutoQuote — Landing Page pública
// =====================================================================
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ToggleLeft,
  FileSpreadsheet,
  History,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Download,
  TrendingUp,
  X,
  ArrowRight,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const WHATSAPP_URL = "https://wa.me/5531975142675";

// Modal de email → checkout público
function CheckoutModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/create-checkout-session-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar. Tente novamente.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-carbon/40 dark:bg-carbon/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18 }}
        className="bg-bone dark:bg-[#111] border border-carbon/15 dark:border-bone/15 rounded-xl p-7 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg text-carbon dark:text-bone">
              Começar agora
            </h2>
            <p className="font-body text-sm text-carbon/60 dark:text-bone/60 mt-0.5">
              Informe seu e-mail para ir ao pagamento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-carbon/40 dark:text-bone/40 hover:text-carbon dark:hover:text-bone transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="
              w-full bg-carbon/5 dark:bg-bone/5
              border border-carbon/20 dark:border-bone/20
              text-carbon dark:text-bone placeholder:text-carbon/40 dark:placeholder:text-bone/40
              rounded-md px-4 py-2.5 font-body text-sm
              focus:outline-none focus:border-amber
              transition-colors
            "
          />

          {error && (
            <p className="font-body text-red-600 dark:text-red-400 text-xs" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              flex items-center justify-center gap-2
              bg-amber text-carbon font-display font-bold
              py-2.5 rounded-md
              hover:opacity-90 disabled:opacity-50
              transition-opacity
            "
          >
            {loading ? "Aguarde..." : (
              <>
                Continuar para pagamento
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="font-body text-xs text-carbon/40 dark:text-bone/40 text-center">
            Você criará sua conta após o pagamento.
          </p>
        </form>
      </motion.div>
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bone/80 dark:bg-carbon/80 backdrop-blur-sm border-b border-carbon/10 dark:border-bone/10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/assets/logo.png"
            alt="AutoQuote"
            width={140}
            height={28}
            priority
            className="block dark:hidden h-7 w-auto"
            style={{ width: "auto" }}
          />
          <Image
            src="/assets/logo-dark.png"
            alt="AutoQuote"
            width={140}
            height={28}
            priority
            className="hidden dark:block h-7 w-auto"
            style={{ width: "auto" }}
          />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="font-display font-medium text-sm text-carbon dark:text-bone border border-carbon/20 dark:border-bone/20 px-4 py-1.5 rounded hover:bg-carbon/5 dark:hover:bg-bone/5 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Mock visual do dashboard para o Hero
function DashboardPreview() {
  return (
    <div className="relative w-full max-w-2xl mx-auto mt-14">
      {/* Sombra decorativa */}
      <div className="absolute inset-0 translate-y-4 scale-95 bg-amber/20 dark:bg-amber/10 blur-2xl rounded-2xl" />

      {/* Frame do app */}
      <div className="relative rounded-xl overflow-hidden border border-carbon/15 dark:border-bone/15 shadow-2xl bg-bone dark:bg-carbon">
        {/* Barra do browser */}
        <div className="bg-carbon/5 dark:bg-bone/5 border-b border-carbon/10 dark:border-bone/10 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/70" />
            <span className="w-3 h-3 rounded-full bg-amber/70" />
            <span className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 bg-carbon/5 dark:bg-bone/5 rounded px-3 py-0.5 text-xs text-center font-body text-carbon/40 dark:text-bone/40 max-w-xs mx-auto">
            autoquote.app/dashboard
          </div>
        </div>

        {/* Conteúdo do app */}
        <div className="flex h-56 sm:h-72">
          {/* Sidebar mock */}
          <div className="w-[110px] sm:w-[140px] border-r border-carbon/10 dark:border-bone/10 flex flex-col p-3 gap-2 shrink-0">
            <div className="mb-2">
              <Image
                src="/assets/logo.png"
                alt="AutoQuote"
                width={100}
                height={20}
                className="block dark:hidden h-5 w-auto"
                style={{ width: "auto" }}
              />
              <Image
                src="/assets/logo-dark.png"
                alt="AutoQuote"
                width={100}
                height={20}
                className="hidden dark:block h-5 w-auto"
                style={{ width: "auto" }}
              />
            </div>
            {[
              { label: "Dashboard", active: true },
              { label: "Analytics", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`text-xs font-body px-2 py-1.5 rounded flex items-center gap-1.5 ${
                  item.active
                    ? "bg-amber/15 text-carbon dark:text-bone font-medium"
                    : "text-carbon/40 dark:text-bone/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? "bg-amber" : "bg-carbon/20 dark:bg-bone/20"}`}
                />
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content mock */}
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
            <p className="font-display font-bold text-sm text-carbon dark:text-bone">
              Nova extração
            </p>

            {/* Data picker mock */}
            <div className="flex items-center gap-2 bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded px-3 py-2 w-full max-w-xs">
              <Calendar size={12} className="text-carbon/40 dark:text-bone/40 shrink-0" />
              <span className="text-xs font-body text-carbon/60 dark:text-bone/60">
                22/06/2025
              </span>
            </div>

            {/* Modo select mock */}
            <div className="flex items-center justify-between bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded px-3 py-2 w-full max-w-xs">
              <span className="text-xs font-body text-carbon/60 dark:text-bone/60">
                Somente eventos novos
              </span>
              <ChevronDown size={12} className="text-carbon/40 dark:text-bone/40" />
            </div>

            {/* Botão mock */}
            <div className="bg-amber text-carbon text-xs font-display font-bold rounded px-4 py-2 w-fit">
              Iniciar extração
            </div>

            {/* Progress card mock */}
            <div className="mt-auto bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded p-3 flex flex-col gap-2 max-w-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-body font-medium text-carbon dark:text-bone">
                  Extraindo eventos...
                </span>
                <span className="text-xs font-body text-amber font-medium">68%</span>
              </div>
              <div className="h-1.5 bg-carbon/10 dark:bg-bone/10 rounded-full overflow-hidden">
                <div className="h-full w-[68%] bg-amber rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-carbon/40 dark:text-bone/40">
                  142 eventos coletados
                </span>
                <Download size={11} className="text-carbon/30 dark:text-bone/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onAssinar }: { onAssinar: () => void }) {
  return (
    <section className="pt-36 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-medium uppercase tracking-widest text-amber font-body">
            Para equipes da Vale
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-carbon dark:text-bone mt-4 mb-6 leading-tight">
            Extração de cotações
            <br />
            automática, sem esforço
          </h1>
          <p className="font-body text-carbon/60 dark:text-bone/60 text-lg max-w-2xl mx-auto mb-10">
            Conecte suas credenciais Coupa Host, selecione a data e baixe a
            planilha Excel em segundos — sem copiar, sem errar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onAssinar}
              className="font-display font-bold bg-amber text-carbon px-6 py-3 rounded hover:opacity-90 transition-opacity"
            >
              Assinar agora
            </button>
            <Link
              href="/login"
              className="font-display font-medium text-carbon dark:text-bone border border-carbon/20 dark:border-bone/20 px-6 py-3 rounded hover:bg-carbon/5 dark:hover:bg-bone/5 transition-colors"
            >
              Entrar na plataforma
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Configure suas credenciais",
    description:
      "Informe seu e-mail e senha Vale uma única vez — ficam salvos com segurança.",
  },
  {
    number: "02",
    title: "Selecione data e modo",
    description:
      "Escolha entre eventos novos ou todos os eventos do dia e informe a data desejada.",
  },
  {
    number: "03",
    title: "Baixe sua planilha",
    description:
      "O robô faz tudo automaticamente e gera o Excel pronto para análise.",
  },
];

// Mock visual do analytics para a seção "Como funciona"
function AnalyticsPreview() {
  const bars = [40, 65, 30, 85, 55, 72, 48, 90, 62, 77, 45, 88];
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 translate-y-3 scale-95 bg-amber/15 dark:bg-amber/10 blur-xl rounded-2xl" />
      <div className="relative rounded-xl overflow-hidden border border-carbon/15 dark:border-bone/15 shadow-xl bg-bone dark:bg-carbon p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-display font-bold text-sm text-carbon dark:text-bone">
              Eventos coletados
            </p>
            <p className="font-body text-xs text-carbon/40 dark:text-bone/40">
              Últimos 30 dias
            </p>
          </div>
          <div className="flex items-center gap-1 bg-amber/10 text-amber rounded px-2 py-1">
            <TrendingUp size={12} />
            <span className="text-xs font-display font-bold">+24%</span>
          </div>
        </div>

        {/* Gráfico de barras mock */}
        <div className="flex items-end gap-1 h-28">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background:
                  i === bars.length - 1
                    ? "var(--color-amber)"
                    : `color-mix(in srgb, var(--color-amber) ${30 + h * 0.3}%, transparent)`,
                opacity: i === bars.length - 1 ? 1 : 0.6,
              }}
            />
          ))}
        </div>

        {/* KPI cards mock */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Total eventos", value: "1.842" },
            { label: "UFs distintas", value: "12" },
            { label: "Extrações", value: "38" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-carbon/5 dark:bg-bone/5 rounded p-2 text-center"
            >
              <p className="font-display font-bold text-sm text-carbon dark:text-bone">
                {kpi.value}
              </p>
              <p className="font-body text-xs text-carbon/40 dark:text-bone/40 mt-0.5">
                {kpi.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-carbon/5 dark:bg-bone/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-medium uppercase tracking-widest text-amber font-body">
            Como funciona
          </span>
          <h2 className="font-display font-bold text-3xl text-carbon dark:text-bone mt-3">
            Três passos, resultado em minutos
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="flex flex-col gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex gap-5"
              >
                <span className="font-display font-bold text-3xl text-amber leading-none mt-1 w-10 shrink-0">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg text-carbon dark:text-bone">
                    {step.title}
                  </h3>
                  <p className="font-body text-carbon/60 dark:text-bone/60 text-sm mt-1">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Analytics preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AnalyticsPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    Icon: Zap,
    title: "Extração 100% automática",
    description:
      "O robô acessa o Coupa Host, coleta os dados e gera o arquivo sem intervenção manual.",
  },
  {
    Icon: ToggleLeft,
    title: "Dois modos de coleta",
    description: "Somente eventos novos ou todos os eventos do dia — você escolhe.",
  },
  {
    Icon: FileSpreadsheet,
    title: "Download em Excel",
    description:
      "Arquivo .xlsx formatado, pronto para abrir no Excel ou Google Sheets.",
  },
  {
    Icon: History,
    title: "Histórico completo",
    description:
      "Todas as planilhas ficam salvas e disponíveis para download a qualquer momento.",
  },
  {
    Icon: BarChart3,
    title: "Analytics integrado",
    description:
      "Gráficos e métricas sobre os eventos coletados, tudo dentro da plataforma.",
  },
  {
    Icon: ShieldCheck,
    title: "Multi-tenant seguro",
    description: "Cada usuário vê apenas seus próprios dados e credenciais.",
  },
];

function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-medium uppercase tracking-widest text-amber font-body">
            Benefícios
          </span>
          <h2 className="font-display font-bold text-3xl text-carbon dark:text-bone mt-3">
            Feito para quem não tem tempo a perder
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md p-5 flex flex-col gap-3"
            >
              <Icon size={20} className="text-amber" />
              <h3 className="font-display font-bold text-carbon dark:text-bone">
                {title}
              </h3>
              <p className="font-body text-carbon/60 dark:text-bone/60 text-sm">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLAN_FEATURES = [
  "Extração automática ilimitada",
  "Dois modos de coleta",
  "Download em Excel (.xlsx)",
  "Histórico de planilhas geradas",
  "Analytics e gráficos",
  "Suporte dedicado",
];

function Pricing({ onAssinar }: { onAssinar: () => void }) {
  return (
    <section className="py-24 px-6 bg-carbon/5 dark:bg-bone/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-medium uppercase tracking-widest text-amber font-body">
            Planos
          </span>
          <h2 className="font-display font-bold text-3xl text-carbon dark:text-bone mt-3">
            Simples e direto
          </h2>
          <p className="font-body text-carbon/60 dark:text-bone/60 mt-2">
            Um plano para sua equipe, sem surpresas
          </p>
        </div>
        <div className="max-w-sm mx-auto bg-bone dark:bg-carbon border border-carbon/10 dark:border-bone/10 rounded-md p-8 flex flex-col gap-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-widest text-amber font-body">
              Plano Empresarial
            </span>
            <p className="font-display font-bold text-3xl text-carbon dark:text-bone mt-3">
              Sob consulta
            </p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {PLAN_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 font-body text-sm text-carbon/80 dark:text-bone/80"
              >
                <CheckCircle2 size={16} className="text-amber flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={onAssinar}
            className="font-display font-bold bg-amber text-carbon w-full text-center py-2.5 rounded hover:opacity-90 transition-opacity"
          >
            Assinar agora
          </button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display font-medium text-carbon/60 dark:text-bone/60 text-sm text-center hover:text-carbon dark:hover:text-bone transition-colors"
          >
            Falar com vendas primeiro →
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-carbon/10 dark:border-bone/10 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/logo.png"
            alt="AutoQuote"
            width={120}
            height={24}
            className="block dark:hidden h-6 w-auto"
            style={{ width: "auto" }}
          />
          <Image
            src="/assets/logo-dark.png"
            alt="AutoQuote"
            width={120}
            height={24}
            className="hidden dark:block h-6 w-auto"
            style={{ width: "auto" }}
          />
          <span className="font-body text-carbon/40 dark:text-bone/40 text-sm">
            Automatizando o que é manual
          </span>
        </div>
        <div className="flex items-center gap-6 font-body text-sm text-carbon/60 dark:text-bone/60">
          <Link
            href="/login"
            className="hover:text-carbon dark:hover:text-bone transition-colors"
          >
            Entrar na plataforma
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-carbon dark:hover:text-bone transition-colors"
          >
            Falar com vendas
          </a>
        </div>
        <span className="font-body text-xs text-carbon/30 dark:text-bone/30">
          © 2025 AutoQuote
        </span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-bone dark:bg-carbon">
      <Navbar />
      <main>
        <Hero onAssinar={() => setShowModal(true)} />
        <HowItWorks />
        <Features />
        <Pricing onAssinar={() => setShowModal(true)} />
      </main>
      <Footer />

      <AnimatePresence>
        {showModal && <CheckoutModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

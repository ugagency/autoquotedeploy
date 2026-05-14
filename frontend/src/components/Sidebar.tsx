"use client";

// =====================================================================
// AutoQuote — Sidebar lateral (220px, fixa)
// Dashboard e Analytics são rotas reais (<Link>). Configurações abre
// modal — fica como botão. O item ativo é derivado de usePathname().
// =====================================================================
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  BarChart2,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ThemeToggle from "./ThemeToggle";

type Props = {
  userEmail: string;
  onOpenSettings: () => void;
};

export default function Sidebar({ userEmail, onOpenSettings }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-30 w-[220px]
        bg-bone dark:bg-carbon
        border-r border-carbon/10 dark:border-bone/10
        flex flex-col
      "
    >
      {/* Logo ----------------------------------------------------- */}
      <div className="px-5 pt-6 pb-8">
        <Image
          src="/assets/logo.png"
          alt="AutoQuote"
          width={180}
          height={36}
          priority
          className="block dark:hidden h-9 w-auto"
        />
        <Image
          src="/assets/logo-dark.png"
          alt="AutoQuote"
          width={180}
          height={36}
          priority
          className="hidden dark:block h-9 w-auto"
        />
      </div>

      {/* Navegação ------------------------------------------------ */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        <NavLink
          href="/"
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
          active={pathname === "/"}
        />
        <NavLink
          href="/analytics"
          icon={<BarChart2 size={16} />}
          label="Analytics"
          active={pathname === "/analytics"}
        />
        <NavButton
          icon={<SettingsIcon size={16} />}
          label="Configurações"
          onClick={onOpenSettings}
        />
      </nav>

      {/* Rodapé --------------------------------------------------- */}
      <div className="border-t border-carbon/10 dark:border-bone/10 px-4 py-4 flex flex-col gap-3">
        <p
          className="text-carbon/40 dark:text-bone/40 text-xs truncate"
          title={userEmail}
        >
          {userEmail}
        </p>

        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            title="Sair"
            className="text-carbon/40 dark:text-bone/40 hover:text-carbon dark:hover:text-bone transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------
// Item de navegação (rota real)
// ---------------------------------------------------------------------
function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded text-sm
        transition-colors
        ${
          active
            ? "bg-carbon/5 dark:bg-bone/10 text-carbon dark:text-bone"
            : "text-carbon/60 dark:text-bone/60 hover:text-carbon dark:hover:text-bone hover:bg-carbon/5 dark:hover:bg-bone/5"
        }
      `}
    >
      <span className="shrink-0">{icon}</span>
      <span className="font-body">{label}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------
// Item de ação (modal, não rota)
// ---------------------------------------------------------------------
function NavButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center gap-3 px-3 py-2 rounded text-sm text-left
        text-carbon/60 dark:text-bone/60
        hover:text-carbon dark:hover:text-bone
        hover:bg-carbon/5 dark:hover:bg-bone/5
        transition-colors
      "
    >
      <span className="shrink-0">{icon}</span>
      <span className="font-body">{label}</span>
    </button>
  );
}

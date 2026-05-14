"use client";

// =====================================================================
// AutoQuote — SettingsModal
// Credenciais Vale por tenant. Mantém entrada animada (framer-motion)
// porque é um overlay que aparece dinamicamente.
// =====================================================================
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSaved?: () => void;
};

export default function SettingsModal({
  isOpen,
  onClose,
  userId,
  onSaved,
}: Props) {
  const [valeEmail, setValeEmail] = useState("");
  const [valePassword, setValePassword] = useState("");
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErro(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_settings")
        .select("vale_email, vale_password")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Erro ao carregar credenciais:", error);
      }
      if (data) {
        setValeEmail(data.vale_email ?? "");
        setValePassword(data.vale_password ?? "");
        setHasExisting(true);
      } else {
        setValeEmail("");
        setValePassword("");
        setHasExisting(false);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!valeEmail.trim() || !valePassword.trim()) {
      setErro("Preencha e-mail e senha");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: userId,
            vale_email: valeEmail.trim(),
            vale_password: valePassword,
          },
          { onConflict: "user_id" }
        );
      if (error) {
        setErro("Falha ao salvar");
        return;
      }
      setHasExisting(true);
      onSaved?.();
      onClose();
    } catch {
      setErro("Falha inesperada");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // Scrim escuro funciona sobre os dois temas
          className="fixed inset-0 z-50 bg-carbon/40 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => hasExisting && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="
              bg-bone dark:bg-carbon
              border border-carbon/10 dark:border-bone/10
              rounded-md p-6 max-w-md w-full relative shadow-sm
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={!hasExisting}
              aria-label="Fechar"
              className="
                absolute top-3 right-3
                text-carbon/40 dark:text-bone/40
                hover:text-carbon dark:hover:text-bone
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <X size={18} />
            </button>

            <h2 className="font-display font-semibold text-carbon dark:text-bone text-lg mb-1">
              Credenciais Vale
            </h2>
            <p className="font-body text-carbon/50 dark:text-bone/50 text-xs mb-6">
              vale.coupahost.com
            </p>

            {loading ? (
              <p className="font-body text-carbon/40 dark:text-bone/40 text-xs">
                Carregando...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide">
                    E-mail Vale
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={valeEmail}
                    onChange={(e) => setValeEmail(e.target.value)}
                    placeholder="seu.usuario@empresa.com"
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
                    Senha Vale
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={valePassword}
                    onChange={(e) => setValePassword(e.target.value)}
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
                  disabled={saving}
                  className="
                    bg-amber text-carbon
                    font-display font-bold
                    w-full py-2.5 rounded mt-2
                    hover:opacity-90
                    disabled:opacity-50
                    transition-opacity
                  "
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>

                {!hasExisting && (
                  <p className="font-body text-carbon/40 dark:text-bone/40 text-xs">
                    Configure as credenciais para liberar o robô.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

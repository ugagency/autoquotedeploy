"use client";

// =====================================================================
// AutoQuote — HistoryPanel
// Lista as últimas planilhas geradas em planilhas/{userId}/...
// Atualiza via Realtime e expõe refresh() para o Dashboard via ref.
// =====================================================================
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Download, Trash2, FileSpreadsheet } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Props = { userId: string };
type FileItem = {
  name: string;
  created_at?: string | null;
};

export type HistoryPanelHandle = { refresh: () => void };

const HistoryPanel = forwardRef<HistoryPanelHandle, Props>(function HistoryPanel(
  { userId },
  ref
) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("planilhas")
      .list(userId, {
        limit: 10,
        sortBy: { column: "created_at", order: "desc" },
      });
    setLoading(false);
    if (error) {
      console.error("Erro ao listar planilhas:", error);
      return;
    }
    setFiles(
      (data ?? [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map((f) => ({ name: f.name, created_at: f.created_at }))
    );
  }, [userId]);

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  useEffect(() => {
    refresh();

    const supabase = createClient();
    const channel = supabase
      .channel(`storage_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "storage",
          table: "objects",
        },
        (payload) => {
          const row = payload.new as { bucket_id?: string; name?: string };
          if (row?.bucket_id === "planilhas" && row.name?.startsWith(`${userId}/`)) {
            refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  async function handleDownload(filename: string) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("planilhas")
      .createSignedUrl(`${userId}/${filename}`, 60 * 60);
    if (error || !data?.signedUrl) {
      console.error("Falha ao gerar link:", error);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(filename: string) {
    if (!window.confirm(`Excluir "${filename}"? Esta ação é irreversível.`)) return;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("planilhas")
      .remove([`${userId}/${filename}`]);
    if (error) {
      console.error("Erro ao excluir:", error);
      return;
    }
    refresh();
  }

  function formatDate(iso?: string | null) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display font-semibold text-carbon dark:text-bone text-lg">
          Histórico
        </h2>
        {files.length > 0 && (
          <span className="font-body text-carbon/40 dark:text-bone/40 text-xs">
            {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
          </span>
        )}
      </div>

      <div
        className="
          bg-carbon/5 dark:bg-bone/5
          border border-carbon/10 dark:border-bone/10
          rounded-md
        "
      >
        {loading && (
          <p className="font-body text-carbon/40 dark:text-bone/40 text-xs p-4">
            Carregando...
          </p>
        )}

        {!loading && files.length === 0 && (
          <p className="font-body text-carbon/40 dark:text-bone/40 text-xs p-4">
            Nenhuma planilha gerada ainda.
          </p>
        )}

        {!loading &&
          files.map((f) => (
            <div
              key={f.name}
              className="
                border-b border-carbon/10 dark:border-bone/10 last:border-b-0
                py-3 px-4 flex justify-between items-center gap-3
              "
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet
                  size={16}
                  className="text-carbon/40 dark:text-bone/40 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-body text-carbon dark:text-bone text-sm truncate">
                    {f.name}
                  </p>
                  <p className="font-body text-carbon/40 dark:text-bone/40 text-xs">
                    {formatDate(f.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleDownload(f.name)}
                  className="text-amber hover:opacity-80 transition-opacity"
                  aria-label="Baixar"
                  title="Baixar"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleDelete(f.name)}
                  className="text-carbon/30 dark:text-bone/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label="Excluir"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
});

export default HistoryPanel;

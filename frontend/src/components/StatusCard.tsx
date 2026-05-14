"use client";

// =====================================================================
// AutoQuote — StatusCard
// Acompanhamento do job em tempo real. Mantém entrada animada
// (framer-motion) porque o cartão surge dinamicamente após o submit.
// =====================================================================
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useRobotJob } from "@/hooks/useRobotJob";
import { createClient } from "@/utils/supabase/client";

type Props = {
  jobId: string | null;
  userId: string;
  onDone?: () => void;
};

export default function StatusCard({ jobId, userId, onDone }: Props) {
  const { status, progresso, mensagem, filename } = useRobotJob(jobId);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [doneNotified, setDoneNotified] = useState(false);

  // Bucket é privado: gera URL assinada quando o job conclui.
  useEffect(() => {
    if (status !== "done" || !filename) return;
    if (doneNotified) return;
    setDoneNotified(true);
    onDone?.();

    const supabase = createClient();
    supabase.storage
      .from("planilhas")
      .createSignedUrl(`${userId}/${filename}`, 60 * 60)
      .then(({ data }) => {
        if (data?.signedUrl) setDownloadUrl(data.signedUrl);
      });
  }, [status, filename, userId, onDone, doneNotified]);

  if (!jobId) return null;

  const statusColor =
    status === "done"
      ? "text-amber"
      : status === "error"
      ? "text-red-600 dark:text-red-400"
      : "text-carbon/50 dark:text-bone/50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="
        bg-carbon/5 dark:bg-bone/5
        border border-carbon/10 dark:border-bone/10
        rounded-md p-4 mt-6
      "
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`font-body font-medium text-xs uppercase tracking-wide ${statusColor}`}
        >
          {status}
        </span>
        <span className="font-body text-carbon/40 dark:text-bone/40 text-xs">
          {progresso}%
        </span>
      </div>

      <div className="bg-carbon/10 dark:bg-bone/10 h-1 rounded-full w-full overflow-hidden">
        <div
          className="bg-amber h-1 rounded-full transition-all duration-500"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {mensagem && (
        <p
          className={`font-body text-xs mt-3 ${
            status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-carbon/50 dark:text-bone/50"
          }`}
        >
          {mensagem}
        </p>
      )}

      {status === "done" && downloadUrl && (
        <a
          href={downloadUrl}
          download={filename ?? undefined}
          className="inline-flex items-center gap-2 text-amber underline font-body font-medium text-xs mt-3 hover:opacity-80"
        >
          <Download size={14} />
          Baixar planilha
        </a>
      )}
    </motion.div>
  );
}

// =====================================================================
// AutoQuote — Hook de acompanhamento de job via Supabase Realtime
// Escuta UPDATEs na linha do robot_jobs e devolve o estado atual.
// Cancela a subscription ao concluir ('done') ou em caso de 'error'.
// =====================================================================
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type JobState = {
  status: "queued" | "running" | "done" | "error" | string;
  progresso: number;
  mensagem: string;
  filename: string | null;
};

const INITIAL: JobState = {
  status: "queued",
  progresso: 0,
  mensagem: "",
  filename: null,
};

export function useRobotJob(jobId: string | null): JobState {
  const [state, setState] = useState<JobState>(INITIAL);

  useEffect(() => {
    if (!jobId) {
      setState(INITIAL);
      return;
    }

    const supabase = createClient();

    // Faz um fetch inicial para preencher o estado antes do primeiro evento.
    let cancelled = false;
    supabase
      .from("robot_jobs")
      .select("status, progresso, mensagem, filename")
      .eq("id", jobId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setState({
          status: data.status,
          progresso: data.progresso ?? 0,
          mensagem: data.mensagem ?? "",
          filename: data.filename ?? null,
        });
      });

    const channel = supabase
      .channel(`robot_job_${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "robot_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: string;
            progresso: number | null;
            mensagem: string | null;
            filename: string | null;
          };
          setState({
            status: row.status,
            progresso: row.progresso ?? 0,
            mensagem: row.mensagem ?? "",
            filename: row.filename ?? null,
          });

          // Encerra a subscription ao chegar a um estado terminal
          if (row.status === "done" || row.status === "error") {
            supabase.removeChannel(channel);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return state;
}

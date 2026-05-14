// =====================================================================
// AutoQuote — Analytics: hook de fetch + agregação
// 1 round-trip ao Supabase por range. Agrega no client com useMemo.
// TODO: se volume passar de ~10k linhas/período, migrar para agregação
// via RPC no banco e paginar a tabela com .range().
// =====================================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  aggregateByDay,
  aggregateTopN,
  computeSummary,
  NULL_DESC_LABEL,
  NULL_UF_LABEL,
  type Evento,
  type Summary,
  type DailyPoint,
  type TopRow,
} from "./aggregate";

const COLUNAS =
  "id, numero_evento, uf, data_evento, descricao, quantidade, unidade, created_at";

type Aggregations = {
  summary: Summary;
  perDay: DailyPoint[];
  topUFs: TopRow[];
  topDescriptions: TopRow[];
};

type State = {
  rows: Evento[];
  loading: boolean;
  error: string | null;
  aggregations: Aggregations;
};

export function useAnalyticsData(
  userId: string,
  start: Date,
  end: Date
): State {
  const [rows, setRows] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // end inclusivo → para a query, somar 1 dia e usar .lt
    const endExclusive = new Date(end);
    endExclusive.setDate(endExclusive.getDate() + 1);
    endExclusive.setHours(0, 0, 0, 0);
    const startNorm = new Date(start);
    startNorm.setHours(0, 0, 0, 0);

    setLoading(true);
    setError(null);

    supabase
      .from("eventos_coletados")
      .select(COLUNAS)
      .eq("user_id", userId)
      .gte("created_at", startNorm.toISOString())
      .lt("created_at", endExclusive.toISOString())
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error("Erro ao carregar eventos:", err);
          setError("Falha ao carregar dados");
          setRows([]);
        } else {
          setRows((data ?? []) as Evento[]);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, start, end]);

  const aggregations = useMemo<Aggregations>(
    () => ({
      summary: computeSummary(rows),
      perDay: aggregateByDay(rows, start, end),
      topUFs: aggregateTopN(rows, "uf", 8, NULL_UF_LABEL),
      topDescriptions: aggregateTopN(rows, "descricao", 8, NULL_DESC_LABEL),
    }),
    [rows, start, end]
  );

  return { rows, loading, error, aggregations };
}

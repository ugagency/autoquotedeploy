"use client";

// =====================================================================
// AutoQuote — Analytics: orquestrador (filtros + dados + apresentação)
// =====================================================================
import { useState } from "react";
import DateRangePicker from "../DateRangePicker";
import { useAnalyticsData } from "./useAnalyticsData";
import SummaryCards from "./SummaryCards";
import EventsPerDayChart from "./EventsPerDayChart";
import TopBarsChart from "./TopBarsChart";
import EventsTable from "./EventsTable";

type Props = { userId: string };

const RANGE_MAX_DAYS = 365;

function rangePadrao(): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 29); // últimos 30 dias inclusivo
  return { start, end };
}

export default function AnalyticsContent({ userId }: Props) {
  // Range aplicado (alimenta o fetch)
  const [range, setRange] = useState<{ start: Date; end: Date }>(rangePadrao);
  // Range em edição (botão Aplicar transfere para `range`)
  const [draft, setDraft] = useState<{ start: Date; end: Date }>(range);

  const { rows, loading, error, aggregations } = useAnalyticsData(
    userId,
    range.start,
    range.end
  );

  function handleAplicar() {
    let { start, end } = draft;
    // Defesa: se invertido, reordena
    if (start > end) [start, end] = [end, start];
    // Defesa: limita a 365 dias
    const diff = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > RANGE_MAX_DAYS) {
      console.warn(
        `Range > ${RANGE_MAX_DAYS} dias — limitando para ${RANGE_MAX_DAYS} dias`
      );
      end = new Date(start);
      end.setDate(end.getDate() + RANGE_MAX_DAYS);
    }
    setRange({ start, end });
    setDraft({ start, end });
  }

  const semDados = !loading && rows.length === 0;

  return (
    <div className="max-w-6xl">
      <header className="mb-8">
        <h1 className="font-display font-semibold text-carbon dark:text-bone text-2xl">
          Analytics
        </h1>
        <p className="font-body text-carbon/50 dark:text-bone/50 text-sm mt-1">
          Análise dos eventos coletados no período selecionado.
        </p>
      </header>

      {/* Filtros ------------------------------------------------- */}
      <section
        className="
          bg-carbon/5 dark:bg-bone/5
          border border-carbon/10 dark:border-bone/10
          rounded-md p-5 mb-6
        "
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 min-w-0">
            <DateRangePicker
              start={draft.start}
              end={draft.end}
              onChange={setDraft}
            />
          </div>
          <button
            type="button"
            onClick={handleAplicar}
            disabled={loading}
            className="
              bg-amber text-carbon
              font-display font-bold
              px-6 py-2.5 rounded
              hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity
              shrink-0
            "
          >
            Aplicar
          </button>
        </div>
      </section>

      {error && (
        <p
          className="font-body text-red-600 dark:text-red-400 text-sm mb-4"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* KPIs --------------------------------------------------- */}
      <SummaryCards summary={aggregations.summary} loading={loading} />

      {/* Conteúdo --------------------------------------------- */}
      {semDados ? (
        <div
          className="
            mt-6
            bg-carbon/5 dark:bg-bone/5
            border border-carbon/10 dark:border-bone/10
            rounded-md p-10
          "
        >
          <p className="font-body text-carbon/40 dark:text-bone/40 text-sm text-center">
            Nenhum evento encontrado no período selecionado.
            <br />
            Tente expandir o intervalo de datas.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <EventsPerDayChart data={aggregations.perDay} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {loading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                <TopBarsChart
                  title="Top UFs"
                  data={aggregations.topUFs}
                  variant="amber"
                  labelMaxChars={6}
                />
                <TopBarsChart
                  title="Itens mais pedidos"
                  data={aggregations.topDescriptions}
                  variant="neutral"
                  labelMaxChars={22}
                />
              </>
            )}
          </div>

          {loading ? (
            <div className="mt-6 h-96 bg-carbon/5 dark:bg-bone/5 border border-carbon/10 dark:border-bone/10 rounded-md animate-pulse" />
          ) : (
            <EventsTable rows={rows} />
          )}
        </>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="
        bg-carbon/5 dark:bg-bone/5
        border border-carbon/10 dark:border-bone/10
        rounded-md h-80 animate-pulse
      "
    />
  );
}

"use client";

// =====================================================================
// AutoQuote — Analytics: 3 KPIs do topo
// =====================================================================
import type { Summary } from "./aggregate";
import { truncate } from "./aggregate";

type Props = {
  summary: Summary;
  loading: boolean;
};

export default function SummaryCards({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        label="Total de eventos"
        value={loading ? null : String(summary.total)}
      />
      <Card
        label="UFs distintas"
        value={loading ? null : String(summary.distinctUFs)}
      />
      <Card
        label="Item mais pedido"
        value={
          loading
            ? null
            : summary.topDescricao
            ? truncate(summary.topDescricao, 40)
            : "—"
        }
        small
      />
    </div>
  );
}

function Card({
  label,
  value,
  small,
}: {
  label: string;
  value: string | null;
  small?: boolean;
}) {
  return (
    <div
      className="
        bg-carbon/5 dark:bg-bone/5
        border border-carbon/10 dark:border-bone/10
        rounded-md p-5
      "
    >
      <p className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide mb-3">
        {label}
      </p>
      {value === null ? (
        <div className="h-9 w-24 bg-carbon/10 dark:bg-bone/10 animate-pulse rounded" />
      ) : (
        <p
          className={`font-display font-bold text-carbon dark:text-bone ${
            small ? "text-lg" : "text-3xl"
          }`}
          title={value}
        >
          {value}
        </p>
      )}
    </div>
  );
}

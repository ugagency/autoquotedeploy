"use client";

// =====================================================================
// AutoQuote — Analytics: tabela de eventos com paginação client (20/p)
// =====================================================================
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Evento } from "./aggregate";
import { truncate } from "./aggregate";

type Props = { rows: Evento[] };

const PAGE_SIZE = 20;

export default function EventsTable({ rows }: Props) {
  const [page, setPage] = useState(0);

  // Reseta a página sempre que o conjunto de dados muda
  useEffect(() => {
    setPage(0);
  }, [rows]);

  if (rows.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="mt-6">
      <h3 className="font-display font-semibold text-carbon dark:text-bone text-lg mb-3">
        Eventos coletados
      </h3>

      <div
        className="
          bg-carbon/5 dark:bg-bone/5
          border border-carbon/10 dark:border-bone/10
          rounded-md overflow-hidden
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-carbon/10 dark:border-bone/10">
                <Th>Nº Evento</Th>
                <Th>UF</Th>
                <Th>Data</Th>
                <Th className="w-full">Descrição</Th>
                <Th>Qtde</Th>
                <Th>Unid.</Th>
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr
                  key={r.id}
                  className="
                    border-b border-carbon/5 dark:border-bone/5 last:border-b-0
                    hover:bg-carbon/[0.04] dark:hover:bg-bone/5
                    transition-colors
                  "
                >
                  <Td>{r.numero_evento}</Td>
                  <Td muted={!r.uf}>{r.uf || "—"}</Td>
                  <Td muted={!r.data_evento}>{r.data_evento || "—"}</Td>
                  <Td muted={!r.descricao} title={r.descricao ?? undefined}>
                    {r.descricao ? truncate(r.descricao, 60) : "—"}
                  </Td>
                  <Td muted={!r.quantidade}>{r.quantidade || "—"}</Td>
                  <Td muted={!r.unidade}>{r.unidade || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-carbon/10 dark:border-bone/10">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="
              flex items-center gap-1
              font-body font-medium text-carbon/50 dark:text-bone/50 text-xs
              hover:text-carbon dark:hover:text-bone
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <ChevronLeft size={14} />
            Anterior
          </button>

          <span className="font-body text-carbon/50 dark:text-bone/50 text-xs">
            Página {page + 1} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="
              flex items-center gap-1
              font-body font-medium text-carbon/50 dark:text-bone/50 text-xs
              hover:text-carbon dark:hover:text-bone
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Próximo
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`
        text-left px-4 py-3
        font-body font-medium text-carbon/50 dark:text-bone/50
        text-xs uppercase tracking-wide
        ${className}
      `}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  muted,
  title,
}: {
  children: React.ReactNode;
  muted?: boolean;
  title?: string;
}) {
  return (
    <td
      title={title}
      className={`
        px-4 py-3 font-body text-sm
        ${
          muted
            ? "text-carbon/40 dark:text-bone/40"
            : "text-carbon dark:text-bone"
        }
      `}
    >
      {children}
    </td>
  );
}

// =====================================================================
// AutoQuote — Analytics: agregações puras
// Recebe linhas brutas de eventos_coletados e devolve séries prontas
// para os gráficos e KPIs. Sem efeitos colaterais, fáceis de testar.
// =====================================================================

export const NULL_UF_LABEL = "Sem UF";
export const NULL_DESC_LABEL = "Sem descrição";

export type Evento = {
  id: string;
  numero_evento: string;
  uf: string | null;
  data_evento: string | null;
  descricao: string | null;
  quantidade: string | null;
  unidade: string | null;
  created_at: string;
};

// ---------------------------------------------------------------------
// Eventos por dia (zero-fill em todo o range)
// ---------------------------------------------------------------------
export type DailyPoint = { date: string; count: number };

export function aggregateByDay(
  rows: Evento[],
  start: Date,
  end: Date
): DailyPoint[] {
  const buckets = new Map<string, number>();

  // Zero-fill: cada dia do range começa em 0
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor <= last) {
    buckets.set(toISODate(cursor), 0);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of rows) {
    const dia = toISODate(new Date(row.created_at));
    if (buckets.has(dia)) {
      buckets.set(dia, (buckets.get(dia) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

// ---------------------------------------------------------------------
// Top N por UF ou descrição
// ---------------------------------------------------------------------
export type TopRow = { label: string; count: number };

export function aggregateTopN<K extends "uf" | "descricao">(
  rows: Evento[],
  key: K,
  n: number,
  nullLabel: string
): TopRow[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const raw = row[key];
    const label = raw && raw.trim().length > 0 ? raw : nullLabel;
    totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  return Array.from(totals.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// ---------------------------------------------------------------------
// KPIs do topo
// ---------------------------------------------------------------------
export type Summary = {
  total: number;
  distinctUFs: number;
  topDescricao: string | null;
};

export function computeSummary(rows: Evento[]): Summary {
  if (rows.length === 0) {
    return { total: 0, distinctUFs: 0, topDescricao: null };
  }
  const ufs = new Set<string>();
  const descCount = new Map<string, number>();
  for (const row of rows) {
    if (row.uf && row.uf.trim().length > 0) ufs.add(row.uf);
    if (row.descricao && row.descricao.trim().length > 0) {
      descCount.set(row.descricao, (descCount.get(row.descricao) ?? 0) + 1);
    }
  }
  let topDescricao: string | null = null;
  let maxCount = 0;
  for (const [desc, count] of descCount) {
    if (count > maxCount) {
      maxCount = count;
      topDescricao = desc;
    }
  }
  return { total: rows.length, distinctUFs: ufs.size, topDescricao };
}

// ---------------------------------------------------------------------
// Helpers de data
// ---------------------------------------------------------------------
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Util público: 'yyyy-MM-dd' → 'DD/MM' para legenda dos gráficos
export function formatDayShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// Util público: limita texto sem quebrar palavras grosseiramente
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

"use client";

// =====================================================================
// AutoQuote — DateRangePicker
// Wrapper de 2 <DatePicker>: começa + fim, garante end >= start,
// limita ambos a no máximo hoje.
// =====================================================================
import DatePicker from "./DatePicker";

type Props = {
  start: Date;
  end: Date;
  onChange: (range: { start: Date; end: Date }) => void;
};

export default function DateRangePicker({ start, end, onChange }: Props) {
  const hoje = new Date();

  function handleStart(d: Date) {
    // Se a nova data inicial passou da final, empurra a final junto
    const novaEnd = d > end ? d : end;
    onChange({ start: d, end: novaEnd });
  }

  function handleEnd(d: Date) {
    // Se a nova data final ficou antes da inicial, empurra a inicial junto
    const novoStart = d < start ? d : start;
    onChange({ start: novoStart, end: d });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide">
          Início
        </label>
        <DatePicker
          value={start}
          onChange={handleStart}
          maxDate={hoje}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-body font-medium text-carbon/50 dark:text-bone/50 text-xs uppercase tracking-wide">
          Fim
        </label>
        <DatePicker
          value={end}
          onChange={handleEnd}
          minDate={start}
          maxDate={hoje}
        />
      </div>
    </div>
  );
}

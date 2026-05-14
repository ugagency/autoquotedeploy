"use client";

// =====================================================================
// AutoQuote — DatePicker
// Botão + popover com calendário real (react-day-picker) em pt-BR.
// Estilizado para os dois temas via variáveis CSS no .rdp-custom
// (definidas em globals.css).
// =====================================================================
import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-day-picker/style.css";

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
};

export default function DatePicker({ value, onChange, maxDate, minDate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const labelData = value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="
          w-full flex items-center justify-between
          bg-bone dark:bg-carbon
          border border-carbon/20 dark:border-bone/20
          text-carbon dark:text-bone
          rounded px-3 py-2
          hover:border-carbon/40 dark:hover:border-bone/40
          focus:border-amber focus:outline-none
          transition-colors
        "
      >
        <span className="font-body capitalize">{labelData}</span>
        <CalendarIcon
          size={16}
          className="text-carbon/40 dark:text-bone/40 shrink-0 ml-3"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Selecionar data"
          className="
            absolute z-50 mt-2 left-0
            bg-bone dark:bg-carbon
            border border-carbon/10 dark:border-bone/10
            rounded-md p-3 shadow-sm
          "
        >
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(d) => {
              if (d) {
                onChange(d);
                setOpen(false);
              }
            }}
            disabled={[
              ...(maxDate ? [{ after: maxDate }] : []),
              ...(minDate ? [{ before: minDate }] : []),
            ]}
            locale={ptBR}
            weekStartsOn={0}
            className="rdp-custom"
            showOutsideDays
          />
        </div>
      )}
    </div>
  );
}

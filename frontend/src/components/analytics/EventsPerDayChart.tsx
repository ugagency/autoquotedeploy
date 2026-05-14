"use client";

// =====================================================================
// AutoQuote — Analytics: gráfico de eventos por dia (linha, full width)
// =====================================================================
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "./aggregate";
import { formatDayShort } from "./aggregate";

type Props = { data: DailyPoint[] };

const AMBER = "#E8A020";

export default function EventsPerDayChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const palette = useMemo(() => {
    const isDark = resolvedTheme === "dark";
    return isDark
      ? {
          grid: "rgba(245,240,232,0.10)",
          axis: "rgba(245,240,232,0.55)",
          tooltipBg: "#101010",
          tooltipFg: "#F5F0E8",
          border: "rgba(245,240,232,0.10)",
        }
      : {
          grid: "rgba(13,13,13,0.08)",
          axis: "rgba(13,13,13,0.55)",
          tooltipBg: "#F5F0E8",
          tooltipFg: "#0D0D0D",
          border: "rgba(13,13,13,0.10)",
        };
  }, [resolvedTheme]);

  if (!mounted) return <ChartSkeleton />;

  // Formato amigável para o XAxis (DD/MM)
  const dadosX = data.map((p) => ({ ...p, label: formatDayShort(p.date) }));

  return (
    <div
      className="
        bg-carbon/5 dark:bg-bone/5
        border border-carbon/10 dark:border-bone/10
        rounded-md p-5
      "
    >
      <h3 className="font-display font-semibold text-carbon dark:text-bone text-base mb-4">
        Eventos por dia
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dadosX}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              stroke={palette.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke={palette.axis}
              tick={{ fontSize: 11, fontFamily: "var(--font-inter)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={palette.axis}
              tick={{ fontSize: 11, fontFamily: "var(--font-inter)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: AMBER, strokeOpacity: 0.3 }}
              contentStyle={{
                background: palette.tooltipBg,
                color: palette.tooltipFg,
                border: `1px solid ${palette.border}`,
                borderRadius: 6,
                fontFamily: "var(--font-inter)",
                fontSize: 12,
              }}
              labelStyle={{ color: palette.tooltipFg }}
              formatter={(value) => [String(value), "Eventos"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={AMBER}
              strokeWidth={2}
              dot={{ r: 3, fill: AMBER, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: AMBER, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="
        bg-carbon/5 dark:bg-bone/5
        border border-carbon/10 dark:border-bone/10
        rounded-md p-5 h-80 animate-pulse
      "
    />
  );
}

"use client";

// =====================================================================
// AutoQuote — Analytics: bar chart horizontal (top N)
// Reusado para Top UFs (fill âmbar) e Top descrições (fill bone/0.8).
// =====================================================================
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TopRow } from "./aggregate";
import { truncate } from "./aggregate";

type Props = {
  title: string;
  data: TopRow[];
  /** "amber" usa âmbar fixo; "neutral" usa bone/carbon segundo o tema */
  variant: "amber" | "neutral";
  /** corta o label do eixo Y para não estourar a coluna */
  labelMaxChars?: number;
};

const AMBER = "#E8A020";

export default function TopBarsChart({
  title,
  data,
  variant,
  labelMaxChars = 18,
}: Props) {
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
          neutralFill: "rgba(245,240,232,0.55)",
        }
      : {
          grid: "rgba(13,13,13,0.08)",
          axis: "rgba(13,13,13,0.55)",
          tooltipBg: "#F5F0E8",
          tooltipFg: "#0D0D0D",
          border: "rgba(13,13,13,0.10)",
          neutralFill: "rgba(13,13,13,0.55)",
        };
  }, [resolvedTheme]);

  if (!mounted) {
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

  const fillColor = variant === "amber" ? AMBER : palette.neutralFill;

  const prepared = data.map((d) => ({
    ...d,
    label: truncate(d.label, labelMaxChars),
    fullLabel: d.label,
  }));

  return (
    <div
      className="
        bg-carbon/5 dark:bg-bone/5
        border border-carbon/10 dark:border-bone/10
        rounded-md p-5
      "
    >
      <h3 className="font-display font-semibold text-carbon dark:text-bone text-base mb-4">
        {title}
      </h3>
      <div className="h-64">
        {prepared.length === 0 ? (
          <p className="font-body text-carbon/40 dark:text-bone/40 text-sm text-center pt-12">
            Sem dados no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepared}
              layout="vertical"
              margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                stroke={palette.grid}
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke={palette.axis}
                tick={{ fontSize: 11, fontFamily: "var(--font-inter)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke={palette.axis}
                tick={{ fontSize: 11, fontFamily: "var(--font-inter)" }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  background: palette.tooltipBg,
                  color: palette.tooltipFg,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 6,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                }}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.fullLabel ?? ""
                }
                formatter={(value) => [String(value), "Ocorrências"]}
              />
              <Bar dataKey="count" fill={fillColor} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

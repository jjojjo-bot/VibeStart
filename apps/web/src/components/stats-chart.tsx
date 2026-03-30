"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";
import type { DailyStat } from "@/lib/stats";

interface StatsChartProps {
  data: DailyStat[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  const t = useTranslations("Landing");
  if (!active || !payload || !label) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-sm shadow-md">
      <div className="mb-1 font-medium">{formatDate(label)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="text-muted-foreground">
          {entry.dataKey === "visitors" ? t("chartTooltip.visitors") : t("chartTooltip.completions")}: {entry.value}{t("chartTooltip.unit")}
        </div>
      ))}
    </div>
  );
}

export function StatsChart({ data }: StatsChartProps) {
  const chartData = data.map((row) => ({
    ...row,
    label: formatDate(row.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="completionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="visitors"
          stroke="#a78bfa"
          strokeWidth={2}
          fill="url(#visitorsGradient)"
        />
        <Area
          type="monotone"
          dataKey="completions"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#completionsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

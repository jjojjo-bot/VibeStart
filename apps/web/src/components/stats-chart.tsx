"use client";

import { useMemo } from "react";
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

export type Period = "daily" | "weekly" | "monthly";

interface StatsChartProps {
  data: DailyStat[];
  period: Period;
  onPeriodChange: (period: Period) => void;
}

/* ── 날짜 포맷 ── */

function formatDaily(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatWeekly(dateStr: string): string {
  // dateStr = 주 시작일 (YYYY-MM-DD)
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMonthlyRaw(dateStr: string): number {
  // dateStr = YYYY-MM
  return Number(dateStr.split("-")[1]);
}

/* ── 집계 ── */

function aggregateWeekly(data: DailyStat[]): DailyStat[] {
  const weeks = new Map<string, DailyStat>();

  for (const row of data) {
    const d = new Date(row.date + "T00:00:00");
    // 월요일 기준 주 시작일 계산
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const key = monday.toISOString().slice(0, 10);

    const existing = weeks.get(key);
    if (existing) {
      existing.visitors += row.visitors;
      existing.completions += row.completions;
    } else {
      weeks.set(key, { date: key, visitors: row.visitors, completions: row.completions });
    }
  }

  return Array.from(weeks.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateMonthly(data: DailyStat[]): DailyStat[] {
  const months = new Map<string, DailyStat>();

  for (const row of data) {
    const key = row.date.slice(0, 7); // YYYY-MM

    const existing = months.get(key);
    if (existing) {
      existing.visitors += row.visitors;
      existing.completions += row.completions;
    } else {
      months.set(key, { date: key, visitors: row.visitors, completions: row.completions });
    }
  }

  return Array.from(months.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/* ── 툴팁 ── */

function CustomTooltip({
  active,
  payload,
  label,
  period,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  period: Period;
}) {
  const t = useTranslations("Landing");
  if (!active || !payload || !label) return null;

  const formattedLabel =
    period === "monthly"
      ? t("chartMonth", { month: formatMonthlyRaw(label) })
      : period === "weekly"
        ? `${formatWeekly(label)}~`
        : formatDaily(label);

  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-sm shadow-md">
      <div className="mb-1 font-medium">{formattedLabel}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="text-muted-foreground">
          {entry.dataKey === "visitors"
            ? t("chartTooltip.visitors")
            : t("chartTooltip.completions")}
          : {entry.value.toLocaleString()}
          {t("chartTooltip.unit")}
        </div>
      ))}
    </div>
  );
}

/* ── 탭 버튼 ── */

function PeriodTabs({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const t = useTranslations("Landing");
  const tabs: { key: Period; label: string }[] = [
    { key: "daily", label: t("chartPeriod.daily") },
    { key: "weekly", label: t("chartPeriod.weekly") },
    { key: "monthly", label: t("chartPeriod.monthly") },
  ];

  return (
    <div className="mb-3 flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            period === tab.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ── 메인 차트 ── */

export function StatsChart({ data, period, onPeriodChange }: StatsChartProps) {
  const t = useTranslations("Landing");

  const formatMonth = useMemo(() => {
    return (dateStr: string): string =>
      t("chartMonth", { month: formatMonthlyRaw(dateStr) });
  }, [t]);

  const { chartData, tickFormatter } = useMemo(() => {
    switch (period) {
      case "weekly": {
        const agg = aggregateWeekly(data).slice(-12);
        return { chartData: agg, tickFormatter: formatWeekly };
      }
      case "monthly": {
        const agg = aggregateMonthly(data).slice(-12);
        return { chartData: agg, tickFormatter: formatMonth };
      }
      default: {
        const sliced = data.slice(-14);
        return { chartData: sliced, tickFormatter: formatDaily };
      }
    }
  }, [data, period, formatMonth]);

  return (
    <div>
      <PeriodTabs period={period} onChange={onPeriodChange} />
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
            tickFormatter={tickFormatter}
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
          <Tooltip content={<CustomTooltip period={period} />} />
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
    </div>
  );
}

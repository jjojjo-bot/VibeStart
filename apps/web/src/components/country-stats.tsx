"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { DailyCountryStat, DailyStat, CountryStat } from "@/lib/stats";
import type { Period } from "@/components/stats-chart";

function FlagImage({ code }: { code: string }) {
  const lower = code.toLowerCase();
  if (lower.length !== 2) return <span className="text-base">🌐</span>;
  return (
    <img
      src={`https://flagcdn.com/20x15/${lower}.png`}
      srcSet={`https://flagcdn.com/40x30/${lower}.png 2x`}
      width={20}
      height={15}
      alt={code}
      className="rounded-sm"
    />
  );
}

/** KST(UTC+9) 기준 현재 시각 */
function getKSTNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

/** 기간에 해당하는 날짜 범위의 시작일 계산 (KST 기준) */
function getPeriodStartDate(period: Period): string {
  const now = getKSTNow();
  switch (period) {
    case "daily": {
      const d = new Date(now);
      d.setDate(d.getDate() - 14);
      return d.toISOString().slice(0, 10);
    }
    case "weekly": {
      const d = new Date(now);
      d.setDate(d.getDate() - 12 * 7);
      return d.toISOString().slice(0, 10);
    }
    case "monthly": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 12);
      return d.toISOString().slice(0, 10);
    }
  }
}

/** dailyCountries를 기간 필터링 후 국가별로 집계하여 visitors 내림차순 정렬 */
function aggregateByCountry(
  dailyCountries: DailyCountryStat[],
  period: Period,
): CountryStat[] {
  const startDate = getPeriodStartDate(period);
  const map = new Map<string, CountryStat>();

  for (const row of dailyCountries) {
    if (row.date < startDate) continue;

    const existing = map.get(row.countryCode);
    if (existing) {
      existing.visitors += row.visitors;
      existing.completions += row.completions;
    } else {
      map.set(row.countryCode, {
        countryCode: row.countryCode,
        visitors: row.visitors,
        completions: row.completions,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);
}

interface CountryStatsProps {
  dailyCountries: DailyCountryStat[];
  daily: DailyStat[];
  period: Period;
}

export function CountryStats({ dailyCountries, period }: CountryStatsProps) {
  const t = useTranslations("Landing");

  const countries = useMemo(
    () => aggregateByCountry(dailyCountries, period),
    [dailyCountries, period],
  );

  if (countries.length === 0) return null;

  const maxVisitors = Math.max(...countries.map((c) => c.visitors), 1);

  return (
    <div className="mt-6 border-t border-border/50 pt-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        {t("countryStats.title")} · {t(`chartPeriod.${period}`)}
      </h3>
      <div className="space-y-3">
        {countries.map((country, index) => {
          const barWidth = Math.round((country.visitors / maxVisitors) * 100);
          const completionRate =
            country.visitors > 0
              ? Math.round((country.completions / country.visitors) * 100)
              : 0;

          return (
            <div key={country.countryCode} className="flex items-center gap-3">
              {/* 순위 */}
              <span className="w-5 text-right text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>

              {/* 국기 + 국가명 */}
              <span className="flex w-20 items-center gap-1.5 text-sm">
                <FlagImage code={country.countryCode} />
                <span className="truncate">
                  {t.has(`countryStats.countries.${country.countryCode}`)
                    ? t(`countryStats.countries.${country.countryCode}`)
                    : country.countryCode}
                </span>
              </span>

              {/* 프로그레스바 */}
              <div className="flex flex-1 items-center gap-2">
                <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-muted/50">
                  {/* 시작 (보라) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/30 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                  {/* 완료 (초록) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#22c55e]/50 transition-all duration-500"
                    style={{ width: `${Math.round((country.completions / maxVisitors) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 숫자 */}
              <div className="flex items-center gap-2 text-xs tabular-nums">
                <span className="text-primary">{country.visitors.toLocaleString()}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-[#22c55e]">{country.completions.toLocaleString()}</span>
                <span className="w-10 text-right text-muted-foreground">
                  {completionRate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-primary/30" />
          {t("countryStats.legendStarted")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e]/50" />
          {t("countryStats.legendCompleted")}
        </span>
        <span className="ml-auto">{t("countryStats.completionRate")}</span>
      </div>
    </div>
  );
}

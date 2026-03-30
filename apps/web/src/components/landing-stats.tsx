"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type { Period } from "@/components/stats-chart";
import { getSiteStats, type SiteStats } from "@/lib/stats";

const StatsChart = dynamic(
  () => import("@/components/stats-chart").then((m) => m.StatsChart),
  { ssr: false },
);
const CountryStats = dynamic(
  () => import("@/components/country-stats").then((m) => m.CountryStats),
  { ssr: false },
);

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function LandingStats() {
  const t = useTranslations("Landing");
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const containerRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetched.current) {
          fetched.current = true;
          getSiteStats().then(setStats);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onPeriodChange = useCallback((p: Period) => setPeriod(p), []);

  const hasStats = stats && (stats.totalVisitors > 0 || stats.totalCompletions > 0);

  if (!hasStats) return <div ref={containerRef} />;

  return (
    <div ref={containerRef} className="mt-16 rounded-xl border border-border/50 bg-card p-6 text-left">
      {/* 오늘 숫자 */}
      <div className="mb-6 flex items-center justify-around text-center">
        <div>
          <div className="text-sm text-muted-foreground">{t("stats.todayStart")}</div>
          <div className="text-3xl font-bold text-primary">
            {formatNumber(stats.today.visitors)}
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <div className="text-sm text-muted-foreground">{t("stats.todayComplete")}</div>
          <div className="text-3xl font-bold text-[#22c55e]">
            {formatNumber(stats.today.completions)}
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <div className="text-sm text-muted-foreground">{t("stats.totalStart")}</div>
          <div className="text-3xl font-bold text-foreground">
            {formatNumber(stats.totalVisitors)}
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <div className="text-sm text-muted-foreground">{t("stats.totalComplete")}</div>
          <div className="text-3xl font-bold text-foreground">
            {formatNumber(stats.totalCompletions)}
          </div>
        </div>
      </div>

      {/* 그래프 */}
      <div>
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            {t("stats.legendStarted")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e]" />
            {t("stats.legendCompleted")}
          </span>
        </div>
        <StatsChart data={stats.daily} period={period} onPeriodChange={onPeriodChange} />
      </div>

      {/* 국가별 통계 */}
      <CountryStats dailyCountries={stats.dailyCountries} daily={stats.daily} period={period} />
    </div>
  );
}

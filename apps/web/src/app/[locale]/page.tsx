"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const StatsChart = dynamic(() => import("@/components/stats-chart").then((m) => m.StatsChart), { ssr: false });
import { getSiteStats, type SiteStats } from "@/lib/stats";

const STEP_NUMBERS = ["1", "2", "3"] as const;

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

export default function LandingPage() {
  const t = useTranslations("Landing");
  const tc = useTranslations("Common");
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    getSiteStats().then(setStats);
  }, []);

  const hasStats = stats && (stats.totalVisitors > 0 || stats.totalCompletions > 0);

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        {/* 히어로 */}
        <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
          {t("badge")}
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("heroTitle")}
          <br />
          <span className="text-primary">{t("heroHighlight")}</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
          {t("heroDescription")}
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link href="/onboarding">
            <Button size="lg" className="h-12 px-8 text-base">
              {t("ctaButton")}
            </Button>
          </Link>
        </div>

        {/* 진행 방식 소개 */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {STEP_NUMBERS.map((num) => (
            <div
              key={num}
              className="rounded-xl border border-border/50 bg-card p-6 text-left"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {num}
              </div>
              <h3 className="font-semibold">{t(`steps.${num}.title`)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t(`steps.${num}.description`)}
              </p>
            </div>
          ))}
        </div>

        {/* 통계 */}
        {hasStats && (
          <div className="mt-16 rounded-xl border border-border/50 bg-card p-6 text-left">
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
              <StatsChart data={stats.daily} />
            </div>
          </div>
        )}

        {/* 안심 메시지 */}
        <p className="mt-16 text-sm text-muted-foreground/70">
          {t("reassurance")}
        </p>
      </div>
    </main>
  );
}

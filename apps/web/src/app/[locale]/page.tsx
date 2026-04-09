import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LandingStats } from "@/components/landing-stats";

const STEP_NUMBERS = ["1", "2", "3"] as const;

export default function LandingPage() {
  const t = useTranslations("Landing");

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

        {/* TEMP: Phase 2 dev 진입점. Phase 2 정식 오픈 전까지 개발 편의용. */}
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-4"
          >
            Phase 2 미리보기 →
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

        {/* 통계 (클라이언트 컴포넌트) */}
        <LandingStats />

        {/* 안심 메시지 */}
        <p className="mt-16 text-sm text-muted-foreground/70">
          {t("reassurance")}
        </p>
      </div>
    </main>
  );
}

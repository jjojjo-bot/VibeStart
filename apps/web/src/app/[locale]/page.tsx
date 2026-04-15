import Script from "next/script";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LandingStats } from "@/components/landing-stats";

const STEP_NUMBERS = ["1", "2", "3"] as const;
const FAQ_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <main id="main-content" className="flex flex-col items-center px-6">
      {/* ───── 히어로 ───── */}
      <section className="flex min-h-[85vh] max-w-3xl flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
          {t("badge")}
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {t("heroTitle")}
          <br />
          <span className="text-primary">{t("heroHighlight")}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
          {t("heroDescription")}
        </p>

        {/* 결과 약속 뱃지 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1">
            <span className="text-emerald-400">✓</span> {t("promise.free")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1">
            <span className="text-emerald-400">✓</span> {t("promise.time")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1">
            <span className="text-emerald-400">✓</span> {t("promise.noExp")}
          </span>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Link href="/onboarding">
            <Button size="lg" className="h-12 px-8 text-base">
              {t("ctaButton")}
            </Button>
          </Link>
        </div>

        <div className="mt-5 text-sm text-muted-foreground">
          <span>{t("secondaryCta.prefix")} </span>
          <Link
            href="/dashboard"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {t("secondaryCta.link")}
          </Link>
        </div>
      </section>

      {/* ───── 결과물 미리보기 ───── */}
      <section className="w-full max-w-2xl pb-24">
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-primary/5">
          {/* 브라우저 타이틀바 */}
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <div className="mx-auto flex h-6 w-56 items-center justify-center rounded-md bg-background/80 text-xs text-muted-foreground">
              my-portfolio.vercel.app
            </div>
          </div>
          {/* CSS 랜딩페이지 목업 */}
          <div className="bg-zinc-950 p-6 sm:p-8">
            {/* 미니 네비게이션 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-violet-500" />
                <span className="text-[10px] font-semibold text-zinc-200 sm:text-xs">Portfolio</span>
              </div>
              <div className="flex gap-3 text-[9px] text-zinc-500 sm:text-[10px]">
                <span>About</span>
                <span>Work</span>
                <span>Contact</span>
              </div>
            </div>
            {/* 히어로 */}
            <div className="mb-6">
              <div className="mb-2 inline-block rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[9px] text-violet-400 sm:text-[10px]">
                Full-Stack Developer
              </div>
              <h3 className="text-lg font-bold text-zinc-100 leading-tight sm:text-xl">
                Hi, I&apos;m <span className="text-violet-400">Minjun</span>
              </h3>
              <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500 sm:text-xs">
                I build beautiful web experiences with modern tools.
              </p>
              <div className="mt-3 flex gap-2">
                <div className="rounded-md bg-violet-500 px-3 py-1 text-[9px] font-medium text-white sm:text-[10px]">
                  View Projects
                </div>
                <div className="rounded-md border border-zinc-700 px-3 py-1 text-[9px] text-zinc-400 sm:text-[10px]">
                  Contact Me
                </div>
              </div>
            </div>
            {/* 프로젝트 카드 */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg bg-zinc-900 p-3">
                <div className="mb-2 h-16 rounded-md bg-gradient-to-br from-violet-500/20 to-indigo-500/20 sm:h-20" />
                <span className="text-[10px] font-medium text-zinc-300 sm:text-xs">E-commerce App</span>
                <p className="mt-0.5 text-[8px] text-zinc-600 sm:text-[9px]">Next.js · Stripe · Tailwind</p>
              </div>
              <div className="rounded-lg bg-zinc-900 p-3">
                <div className="mb-2 h-16 rounded-md bg-gradient-to-br from-emerald-500/20 to-teal-500/20 sm:h-20" />
                <span className="text-[10px] font-medium text-zinc-300 sm:text-xs">AI Chat Bot</span>
                <p className="mt-0.5 text-[8px] text-zinc-600 sm:text-[9px]">React · OpenAI · Vercel</p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("demo.caption")}
        </p>
      </section>

      {/* ───── 3스텝 ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">{t("howItWorks")}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
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
      </section>

      {/* ───── Before / After ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">{t("compare.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Before */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
            <div className="mb-3 text-sm font-medium text-destructive">{t("compare.before.label")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(["1", "2", "3", "4"] as const).map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-0.5 text-destructive/60">✗</span>
                  {t(`compare.before.${n}`)}
                </li>
              ))}
            </ul>
          </div>
          {/* After */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="mb-3 text-sm font-medium text-emerald-400">{t("compare.after.label")}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(["1", "2", "3", "4"] as const).map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {t(`compare.after.${n}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───── Phase 2 미리보기 ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-3 text-center text-2xl font-bold">{t("phase2.title")}</h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">{t("phase2.subtitle")}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["deploy", "auth", "vibe"] as const).map((key) => (
            <div
              key={key}
              className="rounded-xl border border-border/50 bg-card p-5 text-center"
            >
              <div className="mb-2 text-2xl">{t(`phase2.${key}.emoji`)}</div>
              <h3 className="text-sm font-semibold">{t(`phase2.${key}.title`)}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t(`phase2.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">{t("faq.title")}</h2>
        <div className="space-y-3">
          {FAQ_NUMBERS.map((num) => (
            <details
              key={num}
              className="group rounded-xl border border-border/50 bg-card"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium">
                {t(`faq.${num}.q`)}
                <span className="ml-2 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="border-t border-border/30 px-5 py-4 text-sm text-muted-foreground">
                {t(`faq.${num}.a`)}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* FAQ JSON-LD */}
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_NUMBERS.map((num) => ({
              "@type": "Question",
              name: t(`faq.${num}.q`),
              acceptedAnswer: {
                "@type": "Answer",
                text: t(`faq.${num}.a`),
              },
            })),
          }),
        }}
      />

      {/* ───── 통계 ───── */}
      <section className="w-full max-w-2xl pb-16">
        <LandingStats />
      </section>

      {/* ───── 하단 CTA ───── */}
      <section className="w-full max-w-2xl pb-24 text-center">
        <h2 className="text-2xl font-bold">{t("bottomCta.title")}</h2>
        <p className="mt-3 text-muted-foreground">{t("bottomCta.desc")}</p>
        <div className="mt-8">
          <Link href="/onboarding">
            <Button size="lg" className="h-12 px-8 text-base">
              {t("ctaButton")}
            </Button>
          </Link>
        </div>
        <p className="mt-16 text-sm text-muted-foreground">
          {t("reassurance")}
        </p>
      </section>
    </main>
  );
}

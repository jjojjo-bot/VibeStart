import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LandingStats } from "@/components/landing-stats";
import { LandingHeroTerminal } from "@/components/landing-hero-terminal";
import { HeroVideoLazy } from "@/components/hero-video-lazy";

const STEPS = [
  { num: "1", gradient: "from-sky-500 to-cyan-400" },
  { num: "2", gradient: "from-violet-500 to-purple-400" },
  { num: "3", gradient: "from-pink-500 to-rose-400" },
] as const;

const PHASE2_TRACKS = [
  { key: "deploy", gradient: "from-sky-500 to-cyan-400" },
  { key: "auth", gradient: "from-violet-500 to-purple-400" },
  { key: "vibe", gradient: "from-pink-500 to-rose-400" },
] as const;

const FAQ_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const FAQ_GROUPS = [
  { key: "start", items: ["1", "2", "3"] as const },
  { key: "install", items: ["4", "7"] as const },
  { key: "next", items: ["5", "6", "8"] as const },
] as const;

export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <main id="main-content" className="flex flex-col items-center px-6">
      {/* ───── 히어로 ───── */}
      <section className="grid w-full max-w-6xl items-center gap-10 py-16 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-24">
        <div className="text-center">
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
          <div className="mt-10 flex justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="h-12 px-8 text-base">
                {t("ctaButton")}
              </Button>
            </Link>
          </div>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            <span>{t("secondaryCta.prefix")} </span>
            <Link
              href="/dashboard"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t("secondaryCta.link")}
            </Link>
          </div>
        </div>

        <div className="lg:order-last">
          <LandingHeroTerminal />
        </div>
      </section>

      {/* ───── Hero Video (제품 스토리) ───── */}
      <section className="w-full max-w-5xl pb-16">
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-black shadow-2xl shadow-primary/10">
          <HeroVideoLazy />
        </div>
      </section>

      {/* ───── 통계 (소셜 proof) ───── */}
      <section className="w-full max-w-2xl pb-24">
        <LandingStats />
      </section>

      {/* ───── 3스텝 ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">{t("howItWorks")}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ num, gradient }) => (
            <div
              key={num}
              className="overflow-hidden rounded-xl border border-border/50 bg-card text-left"
            >
              <div className={`h-1 bg-gradient-to-r ${gradient}`} />
              <div className="p-6">
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-base font-bold text-white shadow-md`}
                >
                  {num}
                </div>
                <h3 className="font-semibold">{t(`steps.${num}.title`)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t(`steps.${num}.description`)}
                </p>
              </div>
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
          {PHASE2_TRACKS.map(({ key, gradient }) => (
            <div
              key={key}
              className="overflow-hidden rounded-xl border border-border/50 bg-card text-center"
            >
              <div className={`h-1 bg-gradient-to-r ${gradient}`} />
              <div className="p-5">
                <div className="mb-2 text-2xl">{t(`phase2.${key}.emoji`)}</div>
                <h3 className="text-sm font-semibold">{t(`phase2.${key}.title`)}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t(`phase2.${key}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">{t("faq.title")}</h2>
        <div className="space-y-8">
          {FAQ_GROUPS.map(({ key, items }) => (
            <div key={key}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {t(`faq.groups.${key}`)}
              </h3>
              <div className="space-y-3">
                {items.map((num) => (
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
            </div>
          ))}
        </div>
      </section>

      {/* FAQ JSON-LD */}
      <script
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

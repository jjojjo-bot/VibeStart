"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const TARGET_KEYS = ["noCode", "sideProject", "vibeCoding"] as const;
const PHASE_KEYS = ["1", "2", "3"] as const;
const TOOL_KEYS = ["git", "node", "vscode", "nextjs"] as const;

const TOOL_ICONS: Record<string, { src: string; alt: string }> = {
  git: { src: "/about/git.png", alt: "Git" },
  node: { src: "/about/nodejs.png", alt: "Node.js" },
  vscode: { src: "/about/vscode.png", alt: "VS Code" },
  nextjs: { src: "/about/nextjs.png", alt: "Next.js" },
};
const MYTH_KEYS = ["1", "2", "3"] as const;

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <main id="main-content" className="flex flex-col items-center px-6">
      {/* ───── 히어로 ───── */}
      <section className="flex min-h-[70vh] max-w-3xl flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
          {t("hero.badge")}
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {t("hero.title")}
          <br />
          <span className="text-primary">{t("hero.highlight")}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
          {t("hero.description")}
        </p>
        <div className="mt-10">
          <Link href="/onboarding">
            <Button size="lg" className="h-14 px-10 text-base font-semibold">
              {t("hero.cta")}
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t("hero.subCta")}</p>
      </section>

      {/* ───── 결과 미리보기 ───── */}
      <section className="w-full max-w-3xl pb-24">
        <h2 className="mb-3 text-center text-2xl font-bold">
          {t("result.title")}
        </h2>
        <p className="mb-8 text-center text-muted-foreground">
          {t("result.description")}
        </p>

        {/* 브라우저 프레임 목업 */}
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-primary/5">
          {/* 브라우저 타이틀바 */}
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-background/80 text-xs text-muted-foreground">
              my-site.vercel.app
            </div>
          </div>
          {/* 스크린샷 */}
          <div className="relative">
            <Image
              src="/about/result-example.png"
              alt={t("result.imageAlt")}
              width={1200}
              height={675}
              className="w-full"
              priority
            />
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {t("result.caption")}
        </p>
      </section>

      {/* ───── 누구를 위한 서비스? ───── */}
      <section className="w-full max-w-3xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("target.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TARGET_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-xl border border-border/50 bg-card p-6 text-center"
            >
              <div className="mb-3 text-3xl">{t(`target.${key}.emoji`)}</div>
              <h3 className="font-semibold">{t(`target.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`target.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 로드맵 타임라인 ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-3 text-center text-2xl font-bold">
          {t("roadmap.title")}
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          {t("roadmap.description")}
        </p>

        <div className="relative space-y-0">
          {/* 세로 연결선 */}
          <div className="absolute left-6 top-8 bottom-8 w-px bg-border/60 sm:left-8" />

          {PHASE_KEYS.map((num) => (
            <div key={num} className="relative flex gap-5 py-6 sm:gap-6">
              {/* 원형 넘버 */}
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary sm:h-16 sm:w-16 sm:text-base">
                {t(`roadmap.phases.${num}.step`)}
              </div>
              {/* 내용 */}
              <div className="flex-1 pt-1">
                <div className="mb-1 text-xs font-medium text-primary">
                  {t(`roadmap.phases.${num}.time`)}
                </div>
                <h3 className="text-lg font-semibold">
                  {t(`roadmap.phases.${num}.title`)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`roadmap.phases.${num}.desc`)}
                </p>
                {/* 결과 미니 프리뷰 (터미널/브라우저 목업) */}
                <div className="mt-3 overflow-hidden rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-emerald-400">
                      {t(`roadmap.phases.${num}.resultIcon`)}
                    </span>
                    <span>{t(`roadmap.phases.${num}.result`)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 중간 CTA */}
        <div className="mt-8 text-center">
          <Link href="/onboarding">
            <Button size="lg" className="h-12 px-8 text-base">
              {t("roadmap.cta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* ───── 설치되는 도구 ───── */}
      <section className="w-full max-w-3xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("tools.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOL_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Image
                  src={TOOL_ICONS[key].src}
                  alt={TOOL_ICONS[key].alt}
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              </div>
              <div>
                <h3 className="font-semibold">{t(`tools.${key}.name`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`tools.${key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 오해 해소 ───── */}
      <section className="w-full max-w-2xl pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("myths.title")}
        </h2>
        <div className="space-y-4">
          {MYTH_KEYS.map((num) => (
            <div
              key={num}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg text-destructive/70">✗</span>
                <div>
                  <p className="font-medium text-muted-foreground line-through decoration-destructive/40">
                    {t(`myths.${num}.wrong`)}
                  </p>
                  <p className="mt-1.5 font-medium text-foreground">
                    <span className="mr-1.5 text-emerald-400">✓</span>
                    {t(`myths.${num}.right`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 하단 CTA ───── */}
      <section className="w-full max-w-2xl pb-24 text-center">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t("bottomCta.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("bottomCta.desc")}
          </p>
          <div className="mt-8">
            <Link href="/onboarding">
              <Button
                size="lg"
                className="h-14 px-10 text-base font-semibold"
              >
                {t("bottomCta.button")}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("bottomCta.reassurance")}
          </p>
        </div>
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { ProjectReadinessCheck } from "@/components/projects/project-readiness-check";
import { goToDashboardWithPhase1Action } from "@/app/[locale]/login/actions";
import { pageAlternates } from "@/lib/canonical";

interface ReadinessPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ReadinessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Readiness" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: true },
    alternates: pageAlternates(locale, "readiness"),
  };
}

export default async function ReadinessPage({ params }: ReadinessPageProps): Promise<React.ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Readiness" });
  const userAgent = (await headers()).get("user-agent") ?? "";
  const initialOs = /macintosh|mac os x/i.test(userAgent) ? "macos" : "windows";

  return (
    <main id="main-content" className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
      <header className="mb-10 text-center">
        <div className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {t("badge")}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <ProjectReadinessCheck
        locale={locale}
        initialOs={initialOs}
        continueAction={goToDashboardWithPhase1Action}
      />
    </main>
  );
}

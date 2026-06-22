import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageAlternates } from "./canonical";

export async function createPageMetadata(
  locale: string,
  page: "onboarding" | "plan" | "setup" | "complete" | "about" | "terms" | "privacy",
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t(`${page}.title`),
    description: t(`${page}.description`),
    // page 키는 각 라우트 경로(/onboarding 등)와 1:1 — 자기 자신 canonical+hreflang.
    // 없으면 루트 레이아웃의 로케일-루트 canonical을 상속해 홈을 가리킨다.
    alternates: pageAlternates(locale, page),
  };
}

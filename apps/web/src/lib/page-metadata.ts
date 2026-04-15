import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function createPageMetadata(
  locale: string,
  page: "onboarding" | "plan" | "setup" | "complete" | "about" | "terms",
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t(`${page}.title`),
    description: t(`${page}.description`),
  };
}

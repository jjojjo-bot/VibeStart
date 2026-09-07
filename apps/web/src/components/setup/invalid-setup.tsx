"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
export function InvalidSetup() {
  const t = useTranslations("Wizard");
  return <main id="main-content" className="mx-auto max-w-lg space-y-6 px-6 py-20">
    <h1 className="text-2xl font-bold">{t("invalid")}</h1>
    <Link className="underline" href="/onboarding">{t("restart")}</Link>
  </main>;
}

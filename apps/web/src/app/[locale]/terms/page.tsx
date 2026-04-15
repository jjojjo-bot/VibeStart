"use client";

import { useTranslations } from "next-intl";

const SECTION_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export default function TermsPage() {
  const t = useTranslations("Terms");

  return (
    <main id="main-content" className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("effectiveDate")}
      </p>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-muted-foreground">
        {SECTION_KEYS.map((num) => (
          <section key={num}>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t(`sections.${num}.title`)}
            </h2>
            <p>{t(`sections.${num}.content`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

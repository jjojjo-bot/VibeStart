"use client";

import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("Privacy");

  return (
    <main id="main-content" className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("effectiveDate")}
      </p>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.1.title")}
          </h2>
          <p>{t("sections.1.intro")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{t("sections.1.items.0")}</li>
            <li>{t("sections.1.items.1")}</li>
          </ul>
          <p className="mt-2">{t("sections.1.note")}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.2.title")}
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("sections.2.items.0")}</li>
            <li>{t("sections.2.items.1")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.3.title")}
          </h2>
          <p>{t.rich("sections.3.content", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.4.title")}
          </h2>
          <p>{t("sections.4.intro")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{t("sections.4.items.0")}</li>
            <li>{t("sections.4.items.1")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.5.title")}
          </h2>
          <p>{t("sections.5.content")}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.6.title")}
          </h2>
          <p>{t("sections.6.content")}</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.7.title")}
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {t("sections.7.emailLabel")}:{" "}
              <a
                href="mailto:dearlune2100@gmail.com"
                className="text-primary hover:underline"
              >
                dearlune2100@gmail.com
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.8.title")}
          </h2>
          <p>{t("sections.8.content")}</p>
        </section>
      </div>
    </main>
  );
}

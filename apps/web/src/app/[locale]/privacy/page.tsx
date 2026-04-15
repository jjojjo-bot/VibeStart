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
        {/* 1. 수집 항목 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.1.title")}
          </h2>
          <p>{t("sections.1.intro")}</p>
          <h3 className="mt-3 font-medium text-foreground">
            {t("sections.1.autoTitle")}
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>{t("sections.1.autoItems.0")}</li>
            <li>{t("sections.1.autoItems.1")}</li>
          </ul>
          <h3 className="mt-3 font-medium text-foreground">
            {t("sections.1.loginTitle")}
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>{t("sections.1.loginItems.0")}</li>
            <li>{t("sections.1.loginItems.1")}</li>
            <li>{t("sections.1.loginItems.2")}</li>
          </ul>
          <p className="mt-2">{t("sections.1.note")}</p>
        </section>

        {/* 2. 이용 목적 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.2.title")}
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("sections.2.items.0")}</li>
            <li>{t("sections.2.items.1")}</li>
            <li>{t("sections.2.items.2")}</li>
            <li>{t("sections.2.items.3")}</li>
          </ul>
        </section>

        {/* 3. 보유 기간 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.3.title")}
          </h2>
          <p>{t.rich("sections.3.content", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
          <p className="mt-2">{t("sections.3.accountNote")}</p>
        </section>

        {/* 4. 제3자 제공 및 위탁 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.4.title")}
          </h2>
          <p>{t("sections.4.intro")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{t("sections.4.items.0")}</li>
            <li>{t("sections.4.items.1")}</li>
          </ul>
          <p className="mt-3">{t("sections.4.delegateIntro")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{t("sections.4.delegateItems.0")}</li>
            <li>{t("sections.4.delegateItems.1")}</li>
          </ul>
        </section>

        {/* 5. 쿠키 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.5.title")}
          </h2>
          <p>{t("sections.5.content")}</p>
        </section>

        {/* 6. 소셜 로그인 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.6.title")}
          </h2>
          <p>{t("sections.6.content")}</p>
        </section>

        {/* 7. 이용자 권리 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.7.title")}
          </h2>
          <p>{t("sections.7.content")}</p>
        </section>

        {/* 8. 보호책임자 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.8.title")}
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {t("sections.8.emailLabel")}:{" "}
              <a
                href="mailto:dearlune2100@gmail.com"
                className="text-primary hover:underline"
              >
                dearlune2100@gmail.com
              </a>
            </li>
          </ul>
        </section>

        {/* 9. 방침 변경 */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("sections.9.title")}
          </h2>
          <p>{t("sections.9.content")}</p>
        </section>
      </div>
    </main>
  );
}

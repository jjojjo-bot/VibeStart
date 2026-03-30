export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const GA_ID = "G-PE36D37TDG";
const siteUrl = "https://vibe-start-web.vercel.app";

const LOCALE_MAP: Record<string, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
  es: "es_ES",
  hi: "hi_IN",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = loc === routing.defaultLocale ? siteUrl : `${siteUrl}/${loc}`;
  }
  languages["x-default"] = siteUrl;

  return {
    verification: {
      google: "KRpn29rCSZ7cSBZ-Q_al_8GqvENUm2q3aqiXthtQN8U",
    },
    title: {
      default: t("title.default"),
      template: t("title.template"),
    },
    description: t("description"),
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: locale === routing.defaultLocale ? siteUrl : `${siteUrl}/${locale}`,
      languages,
    },
    openGraph: {
      title: t("og.title"),
      description: t("og.description"),
      url: siteUrl,
      siteName: "VibeStart",
      locale: LOCALE_MAP[locale] ?? "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitter.title"),
      description: t("twitter.description"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  const t = await getTranslations({ locale, namespace: "Metadata" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "VibeStart",
        url: siteUrl,
        description: t("description"),
        inLanguage: routing.locales.map((loc) => LOCALE_MAP[loc] ?? loc),
      },
      {
        "@type": "WebApplication",
        name: "VibeStart",
        url: siteUrl,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Windows, macOS",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="beforeInteractive"
      />
      <Script id="gtag-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Header />
        {children}
        <Footer />
      </NextIntlClientProvider>
    </>
  );
}

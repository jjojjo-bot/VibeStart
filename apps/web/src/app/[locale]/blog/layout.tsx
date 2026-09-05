import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BLOG_LOCALES } from "@/lib/blog";
import { routing } from "@/i18n/routing";

const SITE_URL = "https://vibe-start.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const isSupported = BLOG_LOCALES.includes(locale as (typeof BLOG_LOCALES)[number]);
  const canonical = `${SITE_URL}${locale === routing.defaultLocale ? "" : `/${locale}`}/blog`;
  const languages = Object.fromEntries(
    BLOG_LOCALES.map((candidate) => [
      candidate,
      `${SITE_URL}${candidate === routing.defaultLocale ? "" : `/${candidate}`}/blog`,
    ]),
  );
  languages["x-default"] = `${SITE_URL}/blog`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical, languages },
    robots: isSupported ? undefined : { index: false, follow: true },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      type: "website",
    },
  };
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

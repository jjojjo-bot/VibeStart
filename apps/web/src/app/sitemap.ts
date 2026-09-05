import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { BLOG_LOCALES, getBlogPosts } from "@/lib/blog";

const siteUrl = "https://vibe-start.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // 실제 콘텐츠 수정일 기준 (기능 업데이트 시 갱신)
  const lastModified = new Date("2026-03-30");

  const paths = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/onboarding", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/plan", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/setup", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/complete", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of paths) {
    // 각 URL에 대한 다국어 alternate 링크 생성
    const alternates: Record<string, string> = {};
    for (const loc of routing.locales) {
      const prefix = loc === routing.defaultLocale ? "" : `/${loc}`;
      alternates[loc] = `${siteUrl}${prefix}${path}`;
    }
    alternates["x-default"] = `${siteUrl}${path}`;

    for (const locale of routing.locales) {
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      entries.push({
        url: `${siteUrl}${prefix}${path}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages: alternates },
      });
    }
  }

  const blogIndexAlternates = Object.fromEntries(
    BLOG_LOCALES.map((locale) => [
      locale,
      `${siteUrl}${locale === routing.defaultLocale ? "" : `/${locale}`}/blog`,
    ]),
  );
  blogIndexAlternates["x-default"] = `${siteUrl}/blog`;

  for (const locale of BLOG_LOCALES) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    entries.push({
      url: `${siteUrl}${prefix}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: blogIndexAlternates },
    });
  }

  const postsByLocale = Object.fromEntries(
    BLOG_LOCALES.map((locale) => [locale, getBlogPosts(locale)]),
  ) as Record<(typeof BLOG_LOCALES)[number], ReturnType<typeof getBlogPosts>>;
  const allSlugs = new Set(BLOG_LOCALES.flatMap((locale) => postsByLocale[locale].map((post) => post.slug)));

  for (const slug of allSlugs) {
    const availableLocales = BLOG_LOCALES.filter((locale) =>
      postsByLocale[locale].some((post) => post.slug === slug),
    );
    const alternates: Record<string, string> = {};
    for (const locale of availableLocales) {
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      alternates[locale] = `${siteUrl}${prefix}/blog/${slug}`;
    }
    if (availableLocales.some((locale) => locale === routing.defaultLocale)) {
      alternates["x-default"] = `${siteUrl}/blog/${slug}`;
    }

    for (const locale of availableLocales) {
      const post = postsByLocale[locale].find((candidate) => candidate.slug === slug);
      if (!post) continue;
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      entries.push({
        url: `${siteUrl}${prefix}/blog/${slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: alternates },
      });
    }
  }

  return entries;
}

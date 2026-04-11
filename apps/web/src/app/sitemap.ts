import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllBlogSlugs } from "@/lib/blog";

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
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  // 블로그 글도 사이트맵에 추가
  const blogSlugs = getAllBlogSlugs("ko");
  for (const slug of blogSlugs) {
    paths.push({ path: `/blog/${slug}`, changeFrequency: "monthly" as const, priority: 0.6 });
  }

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

  return entries;
}

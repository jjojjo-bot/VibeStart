import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://vibestart.dev";

  const paths = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/onboarding", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/plan", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/setup", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/complete", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of paths) {
    for (const locale of routing.locales) {
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      entries.push({
        url: `${siteUrl}${prefix}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      });
    }
  }

  return entries;
}

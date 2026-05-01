import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  getBlogPost,
  getAllBlogSlugs,
  getAvailableBlogLocales,
  getWpCanonicalUrl,
} from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const SITE_URL = "https://vibe-start.com";

function blogPostUrl(locale: string, slug: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}/blog/${slug}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(locale, slug);
  if (!post) return {};

  const wpCanonical = getWpCanonicalUrl(locale, slug);
  const selfUrl = blogPostUrl(locale, slug);

  // hreflang alternates: 실제 MDX가 존재하는 locale만 가리킨다.
  const availableLocales = getAvailableBlogLocales(slug, routing.locales);
  const languages: Record<string, string> = {};
  for (const loc of availableLocales) {
    languages[loc] = blogPostUrl(loc, slug);
  }
  if (availableLocales.includes(routing.defaultLocale)) {
    languages["x-default"] = blogPostUrl(routing.defaultLocale, slug);
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: wpCanonical ?? selfUrl,
      languages,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: selfUrl,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const post = getBlogPost(locale, slug);

  if (!post) notFound();

  const selfUrl = blogPostUrl(locale, slug);
  const blogIndexUrl = `${SITE_URL}${
    locale === routing.defaultLocale ? "" : `/${locale}`
  }/blog`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: locale,
    keywords: post.tags.join(", "),
    url: selfUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": selfUrl },
    author: {
      "@type": "Person",
      name: "Brandon",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "VibeStart",
      url: SITE_URL,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "VibeStart",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("backToList"),
        item: blogIndexUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: selfUrl,
      },
    ],
  };

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <article className="mx-auto w-full max-w-2xl">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {t("backToList")}
        </Link>

        <header className="mt-6">
          <time className="text-sm text-muted-foreground">{post.date}</time>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{post.description}</p>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-invert mt-10 max-w-none prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-4 prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-li:text-muted-foreground prose-ol:text-muted-foreground prose-ul:my-4 prose-ol:my-4 prose-table:my-6 prose-table:w-full prose-th:border prose-th:border-border/50 prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-foreground prose-th:text-left prose-td:border prose-td:border-border/50 prose-td:px-4 prose-td:py-2 prose-td:text-muted-foreground prose-hr:border-border/50 prose-hr:my-8 prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-img:rounded-lg">
          <MDXRemote source={post.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>

        <div className="mt-16 border-t border-border/50 pt-8">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; {t("backToList")}
          </Link>
        </div>
      </article>
    </main>
  );
}

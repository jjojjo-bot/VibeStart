import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  getBlogPost,
  getAvailableBlogLocales,
  getRelatedBlogPosts,
  getWpCanonicalUrl,
} from "@/lib/blog";
import { extractBlogHeadings, remarkBlogHeadingIds } from "@/lib/blog-headings";
import { blogMdxComponents } from "@/components/blog/blog-mdx-components";
import { BlogToc, ReadingProgress } from "@/components/blog/blog-reading-tools";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const SITE_URL = "https://vibe-start.com";

// OG article 카드 렌더 버전. 카드 레이아웃/폰트를 바꾸면 이 숫자를 올려
// og:image URL을 변경 → 소셜 스크래퍼가 옛 이미지 캐시를 버리고 새로 가져온다.
const OG_VERSION = 2;

const BLOG_LABELS = {
  en: {
    categories: { guides: "Guides", builds: "Builds", fixes: "Fixes" },
    minRead: "min read",
    toc: "On this page",
    related: "Keep reading",
    relatedDescription: "More practical articles selected from the same topic.",
  },
  ko: {
    categories: { guides: "가이드", builds: "만들기", fixes: "문제 해결" },
    minRead: "분",
    toc: "이 글의 목차",
    related: "함께 읽으면 좋은 글",
    relatedDescription: "같은 주제에서 이어서 읽기 좋은 글을 골랐습니다.",
  },
};

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
  const ogImageUrl = `${SITE_URL}/api/og?type=article&v=${OG_VERSION}&title=${encodeURIComponent(
    post.title,
  )}`;

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
    title: { absolute: `${post.title} — VibeStart` },
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
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImageUrl],
    },
    other: {
      "article:section": post.category,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const post = getBlogPost(locale, slug);

  if (!post) notFound();

  const labels = locale === "ko" ? BLOG_LABELS.ko : BLOG_LABELS.en;
  const headings = extractBlogHeadings(post.content);
  const relatedPosts = getRelatedBlogPosts(locale, post);

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
    articleSection: labels.categories[post.category],
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${post.readingMinutes}M`,
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
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
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
        name: locale === "ko" ? "블로그" : "Blog",
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
    <main id="main-content" className="min-h-screen px-6 py-24">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-14 xl:grid-cols-[minmax(0,768px)_240px] xl:justify-center">
        <article data-blog-article className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">VibeStart</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="hover:text-foreground">{locale === "ko" ? "블로그" : "Blog"}</Link>
          </nav>

          <header className="mt-8 border-b border-border/60 pb-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{labels.categories[post.category]}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{post.date}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} {labels.minRead}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
            {post.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </header>

          {headings.length > 0 && (
            <details className="mt-8 rounded-xl border border-border/60 bg-card/60 p-4 xl:hidden">
              <summary className="font-semibold">{labels.toc}</summary>
              <ol className="mt-3 space-y-2 border-l border-border pl-4 text-sm text-muted-foreground">
                {headings.map((heading) => (
                  <li key={heading.id} className={heading.level === 3 ? "pl-4" : ""}>
                    <a href={`#${heading.id}`} className="hover:text-foreground">{heading.text}</a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <div className="prose prose-invert mt-10 max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-4 prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-li:text-muted-foreground prose-ol:text-muted-foreground prose-ul:my-4 prose-ol:my-4 prose-table:my-6 prose-table:w-full prose-th:border prose-th:border-border/50 prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-foreground prose-th:text-left prose-td:border prose-td:border-border/50 prose-td:px-4 prose-td:py-2 prose-td:text-muted-foreground prose-hr:border-border/50 prose-hr:my-8 prose-blockquote:rounded-r-lg prose-blockquote:border-primary/50 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:text-muted-foreground prose-img:rounded-lg">
            <MDXRemote
              source={post.content}
              components={blogMdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm, remarkBlogHeadingIds] } }}
            />
          </div>

          {relatedPosts.length > 0 && (
            <section aria-labelledby="related-posts" className="mt-16 border-t border-border/60 pt-10">
              <h2 id="related-posts" className="text-2xl font-bold">{labels.related}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{labels.relatedDescription}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="rounded-xl border border-border/60 bg-card/70 p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="text-xs font-semibold text-primary">{labels.categories[related.category]}</span>
                    <h3 className="mt-2 line-clamp-3 font-semibold leading-snug">{related.title}</h3>
                    <span className="mt-3 block text-xs text-muted-foreground">{related.readingMinutes} {labels.minRead}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12">
            <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              &larr; {t("backToList")}
            </Link>
          </div>
        </article>

        <aside className="hidden xl:block">
          <BlogToc headings={headings} tocLabel={labels.toc} />
        </aside>
      </div>
    </main>
  );
}

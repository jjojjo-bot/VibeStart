import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getBlogPost, getAllBlogSlugs } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(locale, slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const post = getBlogPost(locale, slug);

  if (!post) notFound();

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center px-6 py-24">
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
            <div className="mt-4 flex gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-invert mt-10 max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-li:text-muted-foreground prose-ol:text-muted-foreground">
          <MDXRemote source={post.content} />
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

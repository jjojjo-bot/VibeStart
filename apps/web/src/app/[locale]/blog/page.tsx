import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getBlogPosts } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";

export default function BlogListPage() {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const posts = getBlogPosts(locale);

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center px-6 py-24">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-12 space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`}>
                <div className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30">
                  <time className="text-xs text-muted-foreground">{post.date}</time>
                  <h2 className="mt-2 text-xl font-semibold group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {post.description}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          ))}

          {posts.length === 0 && (
            <p className="text-center text-muted-foreground">{t("noPosts")}</p>
          )}
        </div>
      </div>
    </main>
  );
}

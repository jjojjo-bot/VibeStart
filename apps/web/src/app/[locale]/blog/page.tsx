import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { getBlogPosts } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { BlogSearch } from "./blog-search";

const POSTS_PER_PAGE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function BlogListPage({ searchParams }: PageProps) {
  const { page: pageParam, q } = await searchParams;
  const t = await getTranslations("Blog");
  const locale = await getLocale();
  const allPosts = getBlogPosts(locale);

  const query = q?.trim().toLowerCase() ?? "";
  const filteredPosts = query
    ? allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    : allPosts;

  const currentPage = Math.max(1, Number(pageParam) || 1);
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const posts = filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const searchBase = query ? `q=${encodeURIComponent(query)}` : "";
  function pageHref(p: number): string {
    if (p === 1 && !searchBase) return "/blog";
    if (p === 1) return `/blog?${searchBase}`;
    if (!searchBase) return `/blog?page=${p}`;
    return `/blog?${searchBase}&page=${p}`;
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center px-6 py-24">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-8">
          <BlogSearch placeholder={t("searchPlaceholder")} defaultValue={q ?? ""} />
        </div>

        <div className="mt-8 space-y-8">
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
            <p className="text-center text-muted-foreground">
              {query ? t("noResults") : t("noPosts")}
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label={t("pagination")} className="mt-12 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                {t("prev")}
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "border border-border hover:bg-accent"
                }`}
              >
                {p}
              </Link>
            ))}

            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                {t("next")}
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}

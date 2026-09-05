import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { BLOG_CATEGORIES, getBlogPosts, type BlogCategory } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { BlogSearch } from "./blog-search";

const POSTS_PER_PAGE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}

const CATEGORY_LABELS = {
  en: { all: "All", guides: "Guides", builds: "Builds", fixes: "Fixes", read: "min read" },
  ko: { all: "전체", guides: "가이드", builds: "만들기", fixes: "문제 해결", read: "분" },
};

export default async function BlogListPage({ searchParams }: PageProps) {
  const { page: pageParam, q, category: categoryParam } = await searchParams;
  const t = await getTranslations("Blog");
  const locale = await getLocale();
  const allPosts = getBlogPosts(locale);
  const labels = locale === "ko" ? CATEGORY_LABELS.ko : CATEGORY_LABELS.en;
  const category = BLOG_CATEGORIES.includes(categoryParam as BlogCategory)
    ? (categoryParam as BlogCategory)
    : undefined;

  const query = q?.trim().toLowerCase() ?? "";
  const categoryPosts = category
    ? allPosts.filter((post) => post.category === category)
    : allPosts;
  const filteredPosts = query
    ? categoryPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    : categoryPosts;

  const currentPage = Math.max(1, Number(pageParam) || 1);
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const posts = filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const searchParts = [
    query ? `q=${encodeURIComponent(query)}` : "",
    category ? `category=${category}` : "",
  ].filter(Boolean);
  const searchBase = searchParts.join("&");
  function pageHref(p: number): string {
    if (p === 1 && !searchBase) return "/blog";
    if (p === 1) return `/blog?${searchBase}`;
    if (!searchBase) return `/blog?page=${p}`;
    return `/blog?${searchBase}&page=${p}`;
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center px-6 py-24">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-8">
          <BlogSearch placeholder={t("searchPlaceholder")} defaultValue={q ?? ""} />
        </div>

        <nav aria-label="Blog categories" className="mt-5 flex flex-wrap gap-2">
          {[undefined, ...BLOG_CATEGORIES].map((item) => {
            const isActive = item === category;
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (item) params.set("category", item);
            const href = params.size > 0 ? `/blog?${params.toString()}` : "/blog";
            return (
              <Link
                key={item ?? "all"}
                href={href}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {labels[item ?? "all"]}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`}>
                <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-primary/90">{labels[post.category]}</span>
                    <span><time dateTime={post.date}>{post.date}</time> · {post.readingMinutes} {labels.read}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
                    {post.description}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
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

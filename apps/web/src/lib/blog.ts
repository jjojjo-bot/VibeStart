import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: BlogCategory;
  readingMinutes: number;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: BlogCategory;
  readingMinutes: number;
}

export const BLOG_CATEGORIES = ["guides", "builds", "fixes"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const BLOG_LOCALES = ["ko", "en"] as const;

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

const KO_TO_WP_CANONICAL: Record<string, string> = {
  "ai-coding-prompt-writing-tips": "https://1daymillion.com/ai-coding-prompt-writing-tips/",
  "ai-coding-tools-comparison-2026": "https://1daymillion.com/ai-coding-tools-comparison-2026/",
  "claude-code-beginner-guide": "https://1daymillion.com/claude-code-beginner-guide/",
  "create-next-app-error-solutions": "https://1daymillion.com/create-next-app-error-solutions/",
  "cursor-install-first-project": "https://1daymillion.com/cursor-install-first-project/",
  "cursor-vs-claude-code": "https://1daymillion.com/cursor-vs-claude-code/",
  "env-file-api-key-management": "https://1daymillion.com/env-file-api-key-management/",
  "github-signup-repository-guide": "https://1daymillion.com/github-signup-repository-guide/",
  "google-ai-studio-vibe-coding-guide": "https://1daymillion.com/google-ai-studio-vibe-coding/",
  "localhost-3000-not-working-fix": "https://1daymillion.com/localhost-3000-not-working-fix/",
  "nodejs-install-vibe-coding": "https://1daymillion.com/vibe-coding-nodejs-install/",
  "non-major-coding-self-study-roadmap-2026": "https://1daymillion.com/non-major-coding-self-study-roadmap-2026/",
  "vibe-coding-dev-environment-setup-guide": "https://1daymillion.com/vibe-coding-dev-environment-setup/",
  "vibe-coding-first-wall-environment-setup": "https://1daymillion.com/vibe-coding-first-wall-environment-setup/",
  "vibe-coding-git-install": "https://1daymillion.com/vibe-coding-git-install-guide/",
  "vibe-coding-macos-setup": "https://1daymillion.com/vibe-coding-mac-dev-environment-homebrew/",
  "vibe-coding-nextjs-project-create": "https://1daymillion.com/vibe-coding-nextjs-project-create/",
  "vibe-coding-portfolio-site-one-hour": "https://1daymillion.com/vibe-coding-portfolio-site-one-hour/",
  "vibe-coding-terminal-basics": "https://1daymillion.com/vibe-coding-terminal-guide-beginners/",
  "vibe-coding-tool-requirements": "https://1daymillion.com/vibe-coding-tool-requirements/",
  "vibe-coding-vercel-free-deploy": "https://1daymillion.com/vibe-coding-vercel-free-deploy/",
  "vibe-coding-vscode-settings": "https://1daymillion.com/vibe-coding-vscode-setup-guide/",
  "vibe-coding-windows-setup": "https://1daymillion.com/vibe-coding-windows-environment-setup/",
  "what-is-claude-design": "https://1daymillion.com/claude-design-usage-guide/",
  "windows-path-environment-variable-guide": "https://1daymillion.com/windows-path-environment-variable-guide/",
};

export function getWpCanonicalUrl(locale: string, slug: string): string | undefined {
  if (locale !== "ko") return undefined;
  return KO_TO_WP_CANONICAL[slug];
}

function getLocaleDir(locale: string): string | null {
  const dir = path.join(CONTENT_DIR, locale);
  if (fs.existsSync(dir)) return dir;
  return null;
}

function inferCategory(slug: string, tags: string[], category?: string): BlogCategory {
  if (BLOG_CATEGORIES.includes(category as BlogCategory)) {
    return category as BlogCategory;
  }

  const searchable = `${slug} ${tags.join(" ")}`.toLowerCase();
  if (/(fix|error|troubleshoot|not-working|solution|에러|오류|해결)/.test(searchable)) {
    return "fixes";
  }
  if (/(build|create|portfolio|todo|saas|production|deploy|만들|구축|프로젝트|배포)/.test(searchable)) {
    return "builds";
  }
  return "guides";
}

function estimateReadingMinutes(content: string): number {
  const plainText = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>|[#*_>`~\[\]()!-]/g, " ");
  const latinWords = plainText.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  const cjkCharacters = plainText.match(/[\u3000-\u9fff\uac00-\ud7af]/g)?.length ?? 0;
  return Math.max(1, Math.ceil(latinWords / 220 + cjkCharacters / 500));
}

export function getBlogPosts(locale: string): BlogPostMeta[] {
  const dir = getLocaleDir(locale);
  if (!dir || !fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);
    const tags = (data.tags as string[]) ?? [];

    return {
      slug,
      title: (data.title as string) ?? slug,
      description: (data.description as string) ?? "",
      date: (data.date as string) ?? "",
      tags,
      category: inferCategory(slug, tags, data.category as string | undefined),
      readingMinutes: estimateReadingMinutes(content),
    };
  });

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPost(locale: string, slug: string): BlogPost | null {
  const dir = getLocaleDir(locale);
  if (!dir) return null;
  const filePath = path.join(dir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const tags = (data.tags as string[]) ?? [];

  return {
    slug,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? "",
    date: (data.date as string) ?? "",
    tags,
    category: inferCategory(slug, tags, data.category as string | undefined),
    readingMinutes: estimateReadingMinutes(content),
    content,
  };
}

export function getAllBlogSlugs(locale: string): string[] {
  const dir = getLocaleDir(locale);
  if (!dir || !fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getRelatedBlogPosts(
  locale: string,
  post: BlogPost,
  limit = 3,
): BlogPostMeta[] {
  const normalizedTags = new Set(post.tags.map((tag) => tag.toLowerCase()));

  return getBlogPosts(locale)
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      score:
        (candidate.category === post.category ? 4 : 0) +
        candidate.tags.filter((tag) => normalizedTags.has(tag.toLowerCase())).length * 2,
    }))
    .sort((a, b) => b.score - a.score || b.candidate.date.localeCompare(a.candidate.date))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

/**
 * 특정 slug의 MDX가 실제로 존재하는 locale 목록.
 * 실제 파일 존재 여부를 기준으로 hreflang alternate를 구성할 때 사용한다.
 */
export function getAvailableBlogLocales(
  slug: string,
  candidates: readonly string[],
): string[] {
  return candidates.filter((loc) =>
    fs.existsSync(path.join(CONTENT_DIR, loc, `${slug}.mdx`)),
  );
}

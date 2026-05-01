import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

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

function getLocaleDir(locale: string): string {
  const dir = path.join(CONTENT_DIR, locale);
  if (fs.existsSync(dir)) return dir;
  // fallback to ko
  return path.join(CONTENT_DIR, "ko");
}

export function getBlogPosts(locale: string): BlogPostMeta[] {
  const dir = getLocaleDir(locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data } = matter(raw);

    return {
      slug,
      title: (data.title as string) ?? slug,
      description: (data.description as string) ?? "",
      date: (data.date as string) ?? "",
      tags: (data.tags as string[]) ?? [],
    };
  });

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPost(locale: string, slug: string): BlogPost | null {
  const dir = getLocaleDir(locale);
  const filePath = path.join(dir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? "",
    date: (data.date as string) ?? "",
    tags: (data.tags as string[]) ?? [],
    content,
  };
}

export function getAllBlogSlugs(locale: string): string[] {
  const dir = getLocaleDir(locale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/**
 * 특정 slug의 MDX가 실제로 존재하는 locale 목록.
 * fallback (getLocaleDir의 ko 폴백)을 거치지 않은 진짜 파일 존재 여부 기준.
 * hreflang alternate 출력 시 fallback 콘텐츠를 가리키지 않으려고 사용.
 */
export function getAvailableBlogLocales(
  slug: string,
  candidates: readonly string[],
): string[] {
  return candidates.filter((loc) =>
    fs.existsSync(path.join(CONTENT_DIR, loc, `${slug}.mdx`)),
  );
}

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

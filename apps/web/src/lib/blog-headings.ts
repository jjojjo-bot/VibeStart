export interface BlogHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface MarkdownNode {
  type?: string;
  value?: string;
  depth?: number;
  children?: MarkdownNode[];
  data?: {
    hProperties?: Record<string, unknown>;
  };
}

function nodeText(node: MarkdownNode): string {
  if (typeof node.value === "string") return node.value;
  return node.children?.map(nodeText).join("") ?? "";
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function uniqueId(text: string, seen: Map<string, number>): string {
  const base = headingId(text) || "section";
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

export function extractBlogHeadings(source: string): BlogHeading[] {
  const seen = new Map<string, number>();
  let inFence = false;
  const headings: BlogHeading[] = [];

  for (const line of source.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(##|###)\s+(.+?)\s*#*$/);
    if (!match) continue;

      const text = match[2]
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .trim();
      headings.push({
        id: uniqueId(text, seen),
        text,
        level: match[1] === "##" ? 2 : 3,
      });
  }

  return headings;
}

export function remarkBlogHeadingIds() {
  return (tree: MarkdownNode) => {
    const seen = new Map<string, number>();

    function visit(node: MarkdownNode): void {
      if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
        node.data ??= {};
        node.data.hProperties ??= {};
        node.data.hProperties.id = uniqueId(nodeText(node), seen);
      }
      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

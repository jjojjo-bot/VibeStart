import { describe, expect, it } from "vitest";
import { extractBlogHeadings, headingId } from "./blog-headings";

describe("blog headings", () => {
  it("creates stable unicode-friendly ids", () => {
    expect(headingId("🚀 첫 프로젝트 만들기")).toBe("첫-프로젝트-만들기");
    expect(headingId("Create a Next.js App")).toBe("create-a-nextjs-app");
  });

  it("extracts h2 and h3 headings, de-duplicates ids, and skips code fences", () => {
    const source = [
      "## Setup",
      "### Install `Node.js`",
      "## Setup",
      "```md",
      "## Not a heading",
      "```",
      "#### Ignored depth",
    ].join("\n");

    expect(extractBlogHeadings(source)).toEqual([
      { id: "setup", text: "Setup", level: 2 },
      { id: "install-nodejs", text: "Install Node.js", level: 3 },
      { id: "setup-2", text: "Setup", level: 2 },
    ]);
  });
});

// @vitest-environment node
/**
 * (라)-4 배포 관련 함수 단위 테스트.
 *
 * - buildLandingHtml: 순수 함수, fetch mock 불필요
 * - pushFileToGitHub: global.fetch mock
 * - createVercelProject: global.fetch mock
 * - getLatestDeployment / getDeployment: global.fetch mock
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── buildLandingHtml ─────────────────────────────────────────
import { buildLandingHtml } from "@/lib/deploy/landing-template";

describe("buildLandingHtml", () => {
  it("프로젝트 이름과 기본 HTML 구조를 포함한다", () => {
    const html = buildLandingHtml("My Blog");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>My Blog</title>");
    expect(html).toContain("My Blog");
    expect(html).toContain("cdn.tailwindcss.com");
    expect(html).toContain("VibeStart");
  });

  it("HTML 특수문자를 이스케이프한다", () => {
    const html = buildLandingHtml('<script>alert("xss")</script>');
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});

// ── fetch-based 함수들 ──────────────────────────────────────

import { pushFileToGitHub } from "@/lib/adapters/github/github-adapter";
import {
  createVercelProject,
  getDeployment,
  getLatestDeployment,
} from "@/lib/adapters/vercel/vercel-adapter";

interface FetchCall {
  url: string;
  init: RequestInit;
}

const fetchCalls: FetchCall[] = [];

beforeEach(() => {
  fetchCalls.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function stubFetchSequence(responses: Response[]): void {
  let idx = 0;
  global.fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      fetchCalls.push({ url: String(input), init: init ?? {} });
      if (idx < responses.length) return responses[idx++]!;
      throw new Error("unexpected fetch call");
    },
  ) as typeof fetch;
}

function stubFetch(response: Response): void {
  stubFetchSequence([response]);
}

// ── pushFileToGitHub ─────────────────────────────────────────

describe("pushFileToGitHub", () => {
  it("201 성공 시 sha를 반환한다", async () => {
    stubFetch(
      new Response(
        JSON.stringify({ content: { sha: "abc123" } }),
        { status: 201 },
      ),
    );

    const result = await pushFileToGitHub(
      "token",
      "owner",
      "repo",
      "index.html",
      "<html></html>",
      "feat: add landing",
    );
    expect(result.sha).toBe("abc123");
    expect(fetchCalls[0]!.url).toContain("/repos/owner/repo/contents/index.html");
  });

  it("422 시 GET으로 sha 조회 후 재시도한다", async () => {
    stubFetchSequence([
      new Response("conflict", { status: 422 }),
      new Response(JSON.stringify({ sha: "existing-sha" }), { status: 200 }),
      new Response(
        JSON.stringify({ content: { sha: "updated-sha" } }),
        { status: 200 },
      ),
    ]);

    const result = await pushFileToGitHub(
      "token",
      "owner",
      "repo",
      "index.html",
      "<html></html>",
      "update",
    );
    expect(result.sha).toBe("updated-sha");
    expect(fetchCalls).toHaveLength(3); // PUT → GET → PUT
  });
});

// ── createVercelProject ──────────────────────────────────────

describe("createVercelProject", () => {
  it("성공 시 프로젝트 ID/name을 반환한다", async () => {
    stubFetch(
      new Response(
        JSON.stringify({ id: "prj_123", name: "my-blog" }),
        { status: 200 },
      ),
    );

    const result = await createVercelProject("token", "my-blog", "owner/repo");
    expect(result).toEqual({ id: "prj_123", name: "my-blog" });
  });

  it("409 시 GET으로 기존 프로젝트를 반환한다", async () => {
    stubFetchSequence([
      new Response("conflict", { status: 409 }),
      new Response(
        JSON.stringify({ id: "prj_existing", name: "my-blog" }),
        { status: 200 },
      ),
    ]);

    const result = await createVercelProject("token", "my-blog", "owner/repo");
    expect(result.id).toBe("prj_existing");
  });

  it("402 시 vercel:plan_limit 에러를 던진다", async () => {
    stubFetch(new Response("payment required", { status: 402 }));

    await expect(
      createVercelProject("token", "x", "o/r"),
    ).rejects.toThrow("vercel:plan_limit");
  });
});

// ── getLatestDeployment ──────────────────────────────────────

describe("getLatestDeployment", () => {
  it("배포가 있으면 첫 항목을 반환한다", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          deployments: [
            { uid: "dpl_1", url: "my-blog.vercel.app", readyState: "READY" },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await getLatestDeployment("token", "prj_123");
    expect(result).toEqual({
      id: "dpl_1",
      url: "my-blog.vercel.app",
      readyState: "READY",
      alias: [],
    });
  });

  it("배포가 없으면 null을 반환한다", async () => {
    stubFetch(
      new Response(JSON.stringify({ deployments: [] }), { status: 200 }),
    );

    expect(await getLatestDeployment("token", "prj_123")).toBeNull();
  });
});

// ── getDeployment ────────────────────────────────────────────

describe("getDeployment", () => {
  it("배포 상태를 반환한다", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          id: "dpl_1",
          url: "my-blog.vercel.app",
          readyState: "BUILDING",
        }),
        { status: 200 },
      ),
    );

    const result = await getDeployment("token", "dpl_1");
    expect(result.readyState).toBe("BUILDING");
  });
});

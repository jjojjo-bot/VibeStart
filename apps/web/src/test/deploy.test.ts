// @vitest-environment node
/**
 * (라)-4 배포 관련 함수 단위 테스트.
 *
 * - buildNextJsLandingFiles: 순수 함수, fetch mock 불필요
 * - pushFileToGitHub: global.fetch mock
 * - createVercelProject: global.fetch mock
 * - getLatestDeployment / getDeployment: global.fetch mock
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── buildNextJsLandingFiles ──────────────────────────────────
import { buildNextJsLandingFiles } from "@/lib/deploy/nextjs-landing-template";

describe("buildNextJsLandingFiles", () => {
  it("Vercel이 요구하는 package.json과 src/app 파일을 포함한다", () => {
    const files = buildNextJsLandingFiles({ projectName: "My Blog" });
    const byPath = new Map(files.map((f) => [f.path, f.content]));

    expect(byPath.has("package.json")).toBe(true);
    expect(byPath.has("tsconfig.json")).toBe(true);
    expect(byPath.has("src/app/layout.tsx")).toBe(true);
    expect(byPath.has("src/app/page.tsx")).toBe(true);

    const pkg = JSON.parse(byPath.get("package.json")!);
    expect(pkg.dependencies.next).toBeDefined();
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies["react-dom"]).toBeDefined();

    const page = byPath.get("src/app/page.tsx")!;
    expect(page).toContain('"My Blog"');
  });

  it("프로젝트 이름에 들어간 따옴표/백슬래시를 JS 문자열 리터럴로 안전하게 임베드한다", () => {
    const files = buildNextJsLandingFiles({
      projectName: 'My "Blog" \\ test',
    });
    const page = files.find((f) => f.path === "src/app/page.tsx")!;
    // JSON.stringify로 이스케이프돼야 함
    expect(page.content).toContain('"My \\"Blog\\" \\\\ test"');
    // raw 따옴표가 JSX를 깨뜨리지 않아야 함
    expect(page.content).not.toContain('"My "Blog"');
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

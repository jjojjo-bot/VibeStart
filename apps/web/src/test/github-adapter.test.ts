// @vitest-environment node
/**
 * github-adapter.createRepo 단위 테스트.
 *
 * - github-env는 mock해서 환경변수 의존성 제거
 * - global.fetch를 vi.fn()으로 대체해 응답 stub
 * - server-only는 setup.ts에서 이미 mock됨
 *
 * 검증:
 *   1) 201 성공 → VcsRepo 매핑 정확 + 요청 URL/headers/body 형태 검증
 *   2) 422 → "github:name_exists" throw
 *   3) 401 → "github:unauthorized" throw
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/adapters/github/github-env", () => ({
  getGitHubOAuthConfig: (): {
    clientId: string;
    clientSecret: string;
    scope: string;
  } => ({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    scope: "repo,user:email",
  }),
}));

import { createGitHubAdapter } from "@/lib/adapters/github/github-adapter";

interface FetchCall {
  url: string;
  init: RequestInit;
}

const fetchCalls: FetchCall[] = [];

beforeEach(() => {
  fetchCalls.length = 0;
  global.fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      fetchCalls.push({ url: String(input), init: init ?? {} });
      throw new Error("fetch not stubbed for this case");
    },
  ) as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function stubFetch(response: Response): void {
  global.fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      fetchCalls.push({ url: String(input), init: init ?? {} });
      return response;
    },
  ) as typeof fetch;
}

describe("createGitHubAdapter().createRepo", () => {
  it("성공 시 VcsRepo로 매핑하고 올바른 요청을 보낸다", async () => {
    const repoJson = {
      id: 12345,
      name: "my-blog",
      full_name: "octocat/my-blog",
      html_url: "https://github.com/octocat/my-blog",
      clone_url: "https://github.com/octocat/my-blog.git",
      default_branch: "main",
      private: true,
    };
    stubFetch(
      new Response(JSON.stringify(repoJson), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const adapter = createGitHubAdapter();
    const result = await adapter.createRepo("ghp_token123", {
      name: "my-blog",
      description: "내 블로그",
      isPrivate: true,
    });

    expect(result).toEqual({
      id: "12345",
      name: "my-blog",
      fullName: "octocat/my-blog",
      htmlUrl: "https://github.com/octocat/my-blog",
      cloneUrl: "https://github.com/octocat/my-blog.git",
      defaultBranch: "main",
      isPrivate: true,
    });

    expect(fetchCalls).toHaveLength(1);
    const call = fetchCalls[0]!;
    expect(call.url).toBe("https://api.github.com/user/repos");
    expect(call.init.method).toBe("POST");

    const headers = call.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer ghp_token123");
    expect(headers.Accept).toBe("application/vnd.github+json");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-GitHub-Api-Version"]).toBe("2022-11-28");

    const body = JSON.parse(call.init.body as string);
    expect(body).toEqual({
      name: "my-blog",
      description: "내 블로그",
      private: true,
      auto_init: false,
    });
  });

  it("422 응답이면 github:name_exists 에러를 던진다", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          message: "Validation Failed",
          errors: [{ message: "name already exists on this account" }],
        }),
        { status: 422 },
      ),
    );

    const adapter = createGitHubAdapter();
    await expect(
      adapter.createRepo("token", {
        name: "dup",
        description: "",
        isPrivate: true,
      }),
    ).rejects.toThrow("github:name_exists");
  });

  it("401 응답이면 github:unauthorized 에러를 던진다", async () => {
    stubFetch(
      new Response(JSON.stringify({ message: "Bad credentials" }), {
        status: 401,
      }),
    );

    const adapter = createGitHubAdapter();
    await expect(
      adapter.createRepo("expired-token", {
        name: "x",
        description: "",
        isPrivate: true,
      }),
    ).rejects.toThrow("github:unauthorized");
  });

  it("403 응답이면 github:forbidden 에러를 던진다", async () => {
    stubFetch(
      new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
        status: 403,
      }),
    );

    const adapter = createGitHubAdapter();
    await expect(
      adapter.createRepo("token", {
        name: "x",
        description: "",
        isPrivate: true,
      }),
    ).rejects.toThrow("github:forbidden");
  });

  it("기타 에러 상태 코드는 github:http_<status> 형태로 던진다", async () => {
    stubFetch(new Response("oops", { status: 500 }));

    const adapter = createGitHubAdapter();
    await expect(
      adapter.createRepo("token", {
        name: "x",
        description: "",
        isPrivate: true,
      }),
    ).rejects.toThrow("github:http_500");
  });
});

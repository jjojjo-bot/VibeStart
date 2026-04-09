// @vitest-environment node
/**
 * vercel-adapter.fetchVercelUser 단위 테스트.
 *
 * - global.fetch를 vi.fn()으로 stub
 * - server-only는 setup.ts에서 mock됨
 *
 * 검증:
 *   1) 200 + { user: {...} } → VercelUserMeta 매핑
 *   2) 200 + 래퍼 없음 형태(uid 직접) → 정상 매핑 (응답 변형 가드)
 *   3) 401 → vercel:invalid_token
 *   4) 403 → vercel:forbidden
 *   5) 500 → vercel:service_unavailable
 *   6) 응답에 uid 없음 → vercel:malformed_response
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchVercelUser } from "@/lib/adapters/vercel/vercel-adapter";

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

describe("fetchVercelUser", () => {
  it("성공 응답({ user: {...} })을 VercelUserMeta로 매핑한다", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          user: {
            id: "u_abc123",
            username: "octocat",
            name: "Octo Cat",
            email: "octo@cat.io",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const meta = await fetchVercelUser("ver_token_xyz");

    expect(meta).toEqual({
      providerUserId: "u_abc123",
      providerUsername: "octocat",
      providerDisplayName: "Octo Cat",
      providerAvatarUrl: null,
    });

    expect(fetchCalls).toHaveLength(1);
    const call = fetchCalls[0]!;
    expect(call.url).toBe("https://api.vercel.com/v2/user");
    expect(call.init.method).toBe("GET");
    const headers = call.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer ver_token_xyz");
    expect(headers.Accept).toBe("application/json");
  });

  it("응답이 래퍼 없는 형태(id 직접)여도 매핑한다", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          id: "u_xyz",
          username: "alice",
          name: null,
          email: "a@b.c",
        }),
        { status: 200 },
      ),
    );

    const meta = await fetchVercelUser("token");
    expect(meta.providerUserId).toBe("u_xyz");
    expect(meta.providerUsername).toBe("alice");
    // name이 null이면 username을 displayName으로 fallback
    expect(meta.providerDisplayName).toBe("alice");
  });

  it("legacy uid 필드만 있는 응답도 매핑한다 (fallback)", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          user: { uid: "u_legacy", username: "legacy", name: "Legacy" },
        }),
        { status: 200 },
      ),
    );

    const meta = await fetchVercelUser("token");
    expect(meta.providerUserId).toBe("u_legacy");
  });

  it("401 응답이면 vercel:invalid_token 에러를 던진다", async () => {
    stubFetch(
      new Response(JSON.stringify({ error: { message: "Forbidden" } }), {
        status: 401,
      }),
    );

    await expect(fetchVercelUser("bad-token")).rejects.toThrow(
      "vercel:invalid_token",
    );
  });

  it("403 응답이면 vercel:forbidden 에러를 던진다", async () => {
    stubFetch(new Response("forbidden", { status: 403 }));

    await expect(fetchVercelUser("token")).rejects.toThrow("vercel:forbidden");
  });

  it("500 응답이면 vercel:service_unavailable 에러를 던진다", async () => {
    stubFetch(new Response("server error", { status: 503 }));

    await expect(fetchVercelUser("token")).rejects.toThrow(
      "vercel:service_unavailable",
    );
  });

  it("id가 없는 응답이면 vercel:malformed_response 에러를 던진다", async () => {
    stubFetch(
      new Response(JSON.stringify({ user: { username: "x" } }), {
        status: 200,
      }),
    );

    await expect(fetchVercelUser("token")).rejects.toThrow(
      "vercel:malformed_response",
    );
  });
});

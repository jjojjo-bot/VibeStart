// @vitest-environment node
/**
 * Supabase Management OAuth 어댑터 단위 테스트.
 *
 * - SUPABASE_OAUTH_* env는 mock으로 stub
 * - global.fetch는 vi.fn()으로 응답 제어
 *
 * 검증:
 *   1) beginAuthorize: URL에 client_id/redirect_uri/response_type/state 포함
 *   2) completeAuthorize 성공: token + profile 호출 → OAuthExchangeResult 매핑
 *   3) HTTP Basic auth 헤더 검증
 *   4) token 401 → supabase:invalid_grant
 *   5) profile 401 → supabase:profile_unauthorized
 *   6) expires_in → expiresAt ISO 변환
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/adapters/supabase-mgmt/supabase-mgmt-env", () => ({
  getSupabaseMgmtOAuthConfig: (): {
    clientId: string;
    clientSecret: string;
  } => ({
    clientId: "client123",
    clientSecret: "secret456",
  }),
  hasSupabaseMgmtOAuthEnv: (): boolean => true,
}));

import { createSupabaseMgmtAdapter } from "@/lib/adapters/supabase-mgmt/supabase-mgmt-adapter";

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

describe("createSupabaseMgmtAdapter().beginAuthorize", () => {
  it("올바른 authorize URL을 생성한다", async () => {
    const adapter = createSupabaseMgmtAdapter();
    const { url } = await adapter.beginAuthorize(
      "csrf-state-xyz",
      "http://localhost:3000/auth/supabase/callback",
    );

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://api.supabase.com");
    expect(parsed.pathname).toBe("/v1/oauth/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("client123");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/auth/supabase/callback",
    );
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("state")).toBe("csrf-state-xyz");
  });
});

describe("createSupabaseMgmtAdapter().completeAuthorize", () => {
  it("성공 시 token + organizations를 매핑한다", async () => {
    stubFetchSequence([
      new Response(
        JSON.stringify({
          access_token: "sba_at_xyz",
          refresh_token: "sba_rt_abc",
          expires_in: 3600,
          token_type: "Bearer",
        }),
        { status: 200 },
      ),
      new Response(
        JSON.stringify([
          {
            id: "org-uuid-123",
            slug: "alice-org",
            name: "Alice's Workspace",
          },
        ]),
        { status: 200 },
      ),
    ]);

    const adapter = createSupabaseMgmtAdapter();
    const result = await adapter.completeAuthorize(
      "auth-code-789",
      "http://localhost:3000/auth/supabase/callback",
    );

    expect(result.accessToken).toBe("sba_at_xyz");
    expect(result.refreshToken).toBe("sba_rt_abc");
    expect(result.scope).toBe("all");
    expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.metadata).toMatchObject({
      providerUserId: "org-uuid-123",
      providerUsername: "alice-org",
      providerDisplayName: "Alice's Workspace",
      providerAvatarUrl: null,
      organizationId: "org-uuid-123",
      organizationSlug: "alice-org",
      organizationName: "Alice's Workspace",
    });

    // 첫 호출: token endpoint, Basic 헤더 + form-urlencoded body
    const tokenCall = fetchCalls[0]!;
    expect(tokenCall.url).toBe("https://api.supabase.com/v1/oauth/token");
    expect(tokenCall.init.method).toBe("POST");
    const tokenHeaders = tokenCall.init.headers as Record<string, string>;
    expect(tokenHeaders.Authorization).toBe(
      `Basic ${Buffer.from("client123:secret456").toString("base64")}`,
    );
    expect(tokenHeaders["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    );
    const bodyStr = String(tokenCall.init.body);
    expect(bodyStr).toContain("grant_type=authorization_code");
    expect(bodyStr).toContain("code=auth-code-789");
    expect(bodyStr).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fsupabase%2Fcallback",
    );

    // 두 번째 호출: organizations endpoint, Bearer
    const orgsCall = fetchCalls[1]!;
    expect(orgsCall.url).toBe("https://api.supabase.com/v1/organizations");
    expect(orgsCall.init.method).toBe("GET");
    const orgsHeaders = orgsCall.init.headers as Record<string, string>;
    expect(orgsHeaders.Authorization).toBe("Bearer sba_at_xyz");
  });

  it("token endpoint 401이면 supabase:invalid_grant 에러", async () => {
    stubFetchSequence([
      new Response(JSON.stringify({ error: "invalid_grant" }), { status: 401 }),
    ]);

    const adapter = createSupabaseMgmtAdapter();
    await expect(
      adapter.completeAuthorize("bad-code", "http://localhost:3000/cb"),
    ).rejects.toThrow("supabase:invalid_grant");
  });

  it("organizations endpoint 401이면 supabase:organizations_unauthorized 에러", async () => {
    stubFetchSequence([
      new Response(
        JSON.stringify({ access_token: "tok", expires_in: 60 }),
        { status: 200 },
      ),
      new Response("nope", { status: 401 }),
    ]);

    const adapter = createSupabaseMgmtAdapter();
    await expect(
      adapter.completeAuthorize("code", "http://localhost:3000/cb"),
    ).rejects.toThrow("supabase:organizations_unauthorized");
  });

  it("expires_in 없으면 expiresAt은 null", async () => {
    stubFetchSequence([
      new Response(
        JSON.stringify({ access_token: "tok" }),
        { status: 200 },
      ),
      new Response(JSON.stringify([{ id: "o1", slug: "s", name: "N" }]), {
        status: 200,
      }),
    ]);

    const adapter = createSupabaseMgmtAdapter();
    const result = await adapter.completeAuthorize(
      "c",
      "http://localhost:3000/cb",
    );
    expect(result.expiresAt).toBeNull();
  });

  it("organizations 응답이 빈 배열이어도 매핑은 진행한다", async () => {
    stubFetchSequence([
      new Response(JSON.stringify({ access_token: "tok" }), { status: 200 }),
      new Response(JSON.stringify([]), { status: 200 }),
    ]);

    const adapter = createSupabaseMgmtAdapter();
    const result = await adapter.completeAuthorize(
      "c",
      "http://localhost:3000/cb",
    );
    expect(result.accessToken).toBe("tok");
    expect(result.metadata.organizationId).toBe("");
  });
});

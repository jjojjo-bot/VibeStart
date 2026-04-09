/**
 * Supabase Management API 어댑터.
 *
 * Phase 2a (마)-1: beginAuthorize / completeAuthorize.
 * 사용자가 자기 Supabase 계정을 vibestart에 OAuth로 연결한다. 이후 (마)-2
 * 이상에서 createProject 등 Management API를 추가로 호출.
 *
 * GitHub OAuth와의 차이점:
 *   - HTTP Basic auth로 client credentials 전송 (body 아님)
 *   - refresh_token + expires_in 발급
 *   - Profile endpoint: /v1/profile
 *
 * Supabase API 참고:
 *   https://supabase.com/docs/reference/api/oauth-flow
 *   https://supabase.com/docs/reference/api/v1-get-a-profile
 */

import "server-only";

import type { OAuthExchangeResult } from "@vibestart/shared-types";

import { getSupabaseMgmtOAuthConfig } from "./supabase-mgmt-env";

const AUTHORIZE_URL = "https://api.supabase.com/v1/oauth/authorize";
const TOKEN_URL = "https://api.supabase.com/v1/oauth/token";
const ORGANIZATIONS_URL = "https://api.supabase.com/v1/organizations";
const PROJECTS_URL = "https://api.supabase.com/v1/projects";

interface SupabaseTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface SupabaseOrganization {
  id?: string;
  slug?: string;
  name?: string;
}

export interface SupabaseMgmtAdapter {
  beginAuthorize(state: string, redirectTo: string): Promise<{ url: string }>;
  completeAuthorize(
    code: string,
    redirectTo: string,
  ): Promise<OAuthExchangeResult>;
}

export function createSupabaseMgmtAdapter(): SupabaseMgmtAdapter {
  const config = getSupabaseMgmtOAuthConfig();

  return {
    async beginAuthorize(
      state: string,
      redirectTo: string,
    ): Promise<{ url: string }> {
      const url = new URL(AUTHORIZE_URL);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", redirectTo);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("state", state);
      // scope는 OAuth App 등록 시 설정한 권한 범위가 자동 적용된다.
      return { url: url.toString() };
    },

    async completeAuthorize(
      code: string,
      redirectTo: string,
    ): Promise<OAuthExchangeResult> {
      // RFC 6749: redirect_uri는 authorize 요청과 정확히 일치해야 함.
      // Supabase는 client credentials를 Basic 헤더로 받는다 (body 아님).
      const basic = Buffer.from(
        `${config.clientId}:${config.clientSecret}`,
      ).toString("base64");

      const tokenBody = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectTo,
      });

      const tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "VibeStart",
        },
        body: tokenBody.toString(),
      });

      if (tokenRes.status === 401) {
        throw new Error("supabase:invalid_grant");
      }
      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        console.error("[supabase-mgmt] token exchange failed", {
          status: tokenRes.status,
          body: text.slice(0, 300),
        });
        throw new Error(`supabase:token_http_${tokenRes.status}`);
      }

      const tokenData = (await tokenRes.json()) as SupabaseTokenResponse;
      if (!tokenData.access_token) {
        throw new Error(
          `supabase:no_access_token_${tokenData.error ?? "unknown"}`,
        );
      }

      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token ?? null;
      const scope = tokenData.scope ?? "all";
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Supabase Management API에는 별도 /profile 엔드포인트가 없다.
      // 대신 /v1/organizations로 사용자가 접근 가능한 조직 목록을 받아
      // 첫 조직의 이름/슬러그를 식별자로 사용한다. organization_id는 (마)-2
      // createProject에서 어차피 필요하므로 metadata에 함께 저장.
      const orgsRes = await fetch(ORGANIZATIONS_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "User-Agent": "VibeStart",
        },
      });

      if (orgsRes.status === 401) {
        throw new Error("supabase:organizations_unauthorized");
      }
      if (!orgsRes.ok) {
        const text = await orgsRes.text();
        console.error("[supabase-mgmt] organizations fetch failed", {
          status: orgsRes.status,
          body: text.slice(0, 300),
        });
        throw new Error(`supabase:organizations_http_${orgsRes.status}`);
      }

      const orgs = (await orgsRes.json()) as SupabaseOrganization[];
      const firstOrg = Array.isArray(orgs) ? orgs[0] : undefined;
      const orgId = firstOrg?.id ?? "";
      const orgSlug = firstOrg?.slug ?? "";
      const orgName = firstOrg?.name ?? orgSlug ?? orgId;

      return {
        accessToken,
        refreshToken,
        scope,
        expiresAt,
        metadata: {
          providerUserId: String(orgId),
          providerUsername: String(orgSlug),
          providerDisplayName: String(orgName),
          providerAvatarUrl: null,
          // (마)-2 createProject에서 사용
          organizationId: orgId,
          organizationSlug: orgSlug,
          organizationName: orgName,
        },
      };
    },
  };
}

// ─────────────────────────────────────────────────────────────
// (마)-2: Supabase 프로젝트 자동 생성 + 폴링
// ─────────────────────────────────────────────────────────────

const SUPABASE_HEADERS = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": "VibeStart",
});

export interface SupabaseProjectResult {
  /** Supabase project ID (e.g., "uuid-form") */
  id: string;
  /** Subdomain ref (e.g., "abcdefghijklmnop") used in api URLs */
  ref: string;
  name: string;
  /** ACTIVE_HEALTHY | COMING_UP | INIT_FAILED | ... */
  status: string;
  /** API URL: https://{ref}.supabase.co */
  apiUrl: string;
}

export interface CreateSupabaseProjectInput {
  organizationId: string;
  name: string;
  /** 강력한 DB 비밀번호 (호출자가 생성해서 전달) */
  dbPass: string;
  /** 'ap-northeast-2' (Seoul) 등. 기본 'ap-northeast-2' */
  region?: string;
  /** 'free' | 'pro' 등 */
  plan?: string;
}

/**
 * 새 Supabase 프로젝트를 만든다. 응답은 즉시 오지만 status가 COMING_UP이며
 * ACTIVE_HEALTHY 도달까지 보통 30~120초가 걸린다. 호출자가 폴링해야 함.
 */
export async function createSupabaseProject(
  accessToken: string,
  input: CreateSupabaseProjectInput,
): Promise<SupabaseProjectResult> {
  const res = await fetch(PROJECTS_URL, {
    method: "POST",
    headers: SUPABASE_HEADERS(accessToken),
    body: JSON.stringify({
      organization_id: input.organizationId,
      name: input.name,
      db_pass: input.dbPass,
      region: input.region ?? "ap-northeast-2",
      plan: input.plan ?? "free",
    }),
  });

  if (res.status === 401) throw new Error("supabase:invalid_token");
  if (res.status === 402) throw new Error("supabase:plan_limit");
  if (res.status === 403) throw new Error("supabase:forbidden");
  if (!res.ok) {
    const text = await res.text();
    console.error("[supabase-mgmt] createProject failed", {
      status: res.status,
      body: text.slice(0, 300),
    });
    // Supabase는 free plan 한도 초과를 종종 400으로 응답하면서 메시지에
    // "maximum limits" / "project limit" 등의 문구를 포함한다.
    if (
      text.includes("maximum limits") ||
      text.includes("project limit") ||
      text.includes("active free projects")
    ) {
      throw new Error("supabase:plan_limit");
    }
    throw new Error(`supabase:create_http_${res.status}`);
  }

  const data = (await res.json()) as {
    id?: string;
    ref?: string;
    name?: string;
    status?: string;
  };

  if (!data.id || !data.ref) {
    throw new Error("supabase:create_malformed_response");
  }

  return {
    id: data.id,
    ref: data.ref,
    name: data.name ?? input.name,
    status: data.status ?? "COMING_UP",
    apiUrl: `https://${data.ref}.supabase.co`,
  };
}

/**
 * 프로젝트 ref로 현재 상태를 조회한다. 폴링용.
 * 응답에 status 필드가 있으며 ACTIVE_HEALTHY가 "준비 완료" 상태.
 */
export async function getSupabaseProject(
  accessToken: string,
  projectRef: string,
): Promise<SupabaseProjectResult | null> {
  const res = await fetch(
    `${PROJECTS_URL}/${encodeURIComponent(projectRef)}`,
    { method: "GET", headers: SUPABASE_HEADERS(accessToken) },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`supabase:get_http_${res.status}`);

  const data = (await res.json()) as {
    id?: string;
    ref?: string;
    name?: string;
    status?: string;
  };
  if (!data.id || !data.ref) return null;

  return {
    id: data.id,
    ref: data.ref,
    name: data.name ?? "",
    status: data.status ?? "COMING_UP",
    apiUrl: `https://${data.ref}.supabase.co`,
  };
}

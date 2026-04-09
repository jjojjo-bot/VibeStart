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

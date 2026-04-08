/**
 * OAuth 연결 정보 Repository — oauth_connections 테이블 접근.
 *
 * Phase 2a (라)-1: 평문 access_token 저장 (migration 002). RLS로 user_id
 * 기준 격리. Phase 2b에서 Vault(pgsodium)로 이관 예정 — 이 Repository의
 * 시그니처를 유지하면 호출부 변경 없음.
 */

import "server-only";

import type { OAuthProvider } from "@vibestart/shared-types";

import { createAuthServerClient } from "@/lib/supabase/auth-server";

export interface OAuthConnectionSummary {
  id: string;
  provider: OAuthProvider;
  providerUserId: string | null;
  providerUsername: string | null;
  scope: string;
  createdAt: string;
}

export interface SaveOAuthConnectionInput {
  userId: string;
  provider: OAuthProvider;
  accessToken: string;
  refreshToken: string | null;
  scope: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
}

/**
 * (user_id, provider) 기준 upsert. 기존 연결이 있으면 토큰·메타데이터를
 * 갱신하고, 없으면 새 row 생성.
 */
export async function saveOAuthConnection(
  input: SaveOAuthConnectionInput,
): Promise<void> {
  const supabase = await createAuthServerClient();

  const providerUserId =
    typeof input.metadata.providerUserId === "string"
      ? input.metadata.providerUserId
      : null;
  const providerUsername =
    typeof input.metadata.providerUsername === "string"
      ? input.metadata.providerUsername
      : null;

  const { error } = await supabase.from("oauth_connections").upsert(
    {
      user_id: input.userId,
      provider: input.provider,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      scope: input.scope,
      expires_at: input.expiresAt,
      metadata: input.metadata,
      provider_user_id: providerUserId,
      provider_username: providerUsername,
    },
    { onConflict: "user_id,provider" },
  );

  if (error) {
    throw new Error(`OAuth 연결 저장 실패: ${error.message}`);
  }
}

/**
 * UI에 표시할 요약 정보 조회. 토큰은 포함하지 않는다.
 */
export async function getOAuthConnection(
  userId: string,
  provider: OAuthProvider,
): Promise<OAuthConnectionSummary | null> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("oauth_connections")
    .select(
      "id, provider, provider_user_id, provider_username, scope, created_at",
    )
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    provider: data.provider,
    providerUserId: data.provider_user_id,
    providerUsername: data.provider_username,
    scope: data.scope,
    createdAt: data.created_at,
  };
}

/**
 * 서버 사이드에서만 호출. 외부 서비스 API 요청 시 토큰을 읽어오는 용도.
 * 절대 클라이언트에 노출하지 말 것.
 */
export async function getOAuthAccessToken(
  userId: string,
  provider: OAuthProvider,
): Promise<string | null> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("oauth_connections")
    .select("access_token")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !data) return null;
  return data.access_token ?? null;
}

/**
 * 사용자가 연결을 끊을 때 row 삭제. (라)-1 이후 UI에서 사용 예정.
 */
export async function deleteOAuthConnection(
  userId: string,
  provider: OAuthProvider,
): Promise<void> {
  const supabase = await createAuthServerClient();
  const { error } = await supabase
    .from("oauth_connections")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);
  if (error) throw new Error(`OAuth 연결 해제 실패: ${error.message}`);
}

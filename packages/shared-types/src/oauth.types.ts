/**
 * Phase 2 — 외부 서비스 OAuth 연결 도메인.
 *
 * vibestart는 사용자를 대신해 외부 서비스(GitHub/Vercel/Supabase 등)에
 * 리소스를 만들기 위해 OAuth 토큰을 보관한다. 토큰 자체는 Supabase Vault에
 * 저장하고, 도메인 계층은 식별자만 다룬다.
 */

import type { UserId } from './auth.types';

export type OAuthProvider =
  | 'github'
  | 'vercel'
  | 'supabase_mgmt'
  | 'cloudflare'
  | 'resend'
  | 'sentry';

export interface OAuthConnection {
  id: string;
  userId: UserId;
  provider: OAuthProvider;
  /** Supabase Vault secret id (절대 평문 토큰을 직접 다루지 않는다) */
  accessTokenId: string;
  refreshTokenId: string | null;
  scope: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
}

/**
 * 어댑터가 OAuth 코드 교환 직후 받은 결과물.
 * 도메인은 이 값을 받아 Vault에 저장 후 OAuthConnection으로 변환한다.
 */
export interface OAuthExchangeResult {
  accessToken: string;
  refreshToken: string | null;
  scope: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
}

/**
 * AuthPort — vibestart 자체 사용자 인증.
 *
 * 1순위 어댑터: Supabase Auth + Google OAuth.
 * 도메인은 사용자가 어떤 IdP를 쓰는지 모른다 — Google 외에 추가될 수 있다.
 */

import type { AuthUser } from '@vibestart/shared-types';

export interface AuthPort {
  /**
   * Google 로그인 URL을 생성한다. 사용자는 반환된 URL로 리다이렉트된다.
   */
  signInWithGoogle(redirectTo: string): Promise<{ url: string }>;

  /**
   * OAuth 콜백에서 받은 코드를 사용자 정보로 교환한다.
   * 이 호출이 성공하면 세션이 설정된다.
   */
  exchangeCode(code: string): Promise<AuthUser>;

  /**
   * 현재 세션의 사용자. 미로그인 시 null.
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * 세션을 종료한다.
   */
  signOut(): Promise<void>;
}

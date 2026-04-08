/**
 * Phase 2 — vibestart 자체 사용자 인증 도메인.
 *
 * 사용자는 Supabase Auth + Google OAuth로 vibestart에 로그인하며,
 * 외부 서비스(GitHub/Vercel/Supabase 등) 연결과는 별개다.
 */

export type UserId = string;

export interface AuthUser {
  id: UserId;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

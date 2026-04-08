/**
 * AuthPort의 Supabase 어댑터 (서버 사이드).
 *
 * packages/ports의 AuthPort 계약을 구현한다. 이 어댑터는 Server Component,
 * Server Action, Route Handler에서 호출될 때만 작동한다. 클라이언트 컴포넌트는
 * 별도의 브라우저 어댑터를 쓰거나 Server Action을 통해 간접 호출해야 한다.
 */

import "server-only";

import type { AuthPort } from "@vibestart/ports";
import type { AuthUser } from "@vibestart/shared-types";

import { createAuthServerClient } from "@/lib/supabase/auth-server";

/**
 * Supabase 어댑터 인스턴스. 매 요청마다 새로 생성해도 비용이 낮다
 * (createServerClient 내부에서 쿠키 스토어만 캡처한다).
 */
export function createSupabaseAuthAdapter(): AuthPort {
  return {
    async signInWithGoogle(redirectTo: string): Promise<{ url: string }> {
      const supabase = await createAuthServerClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw new Error(`Google 로그인 URL 생성 실패: ${error.message}`);
      if (!data.url) throw new Error("Supabase가 로그인 URL을 반환하지 않았습니다.");
      return { url: data.url };
    },

    async exchangeCode(code: string): Promise<AuthUser> {
      const supabase = await createAuthServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw new Error(`OAuth 코드 교환 실패: ${error.message}`);
      if (!data.user) throw new Error("사용자 정보가 비어 있습니다.");
      return toAuthUser(data.user);
    },

    async getCurrentUser(): Promise<AuthUser | null> {
      const supabase = await createAuthServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return toAuthUser(data.user);
    },

    async signOut(): Promise<void> {
      const supabase = await createAuthServerClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(`로그아웃 실패: ${error.message}`);
    },
  };
}

/**
 * Supabase user 객체를 도메인 AuthUser로 정규화한다.
 * display_name은 Google OAuth 메타데이터의 full_name → name → email 순으로 결정.
 */
function toAuthUser(user: {
  id: string;
  email?: string | undefined;
  user_metadata?: Record<string, unknown> | undefined;
}): AuthUser {
  const meta = user.user_metadata ?? {};
  const fullName = typeof meta.full_name === "string" ? meta.full_name : null;
  const name = typeof meta.name === "string" ? meta.name : null;
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: fullName ?? name ?? user.email ?? "",
    avatarUrl,
  };
}

/**
 * Data Access Layer — Next.js 16 공식 권장 인증 패턴.
 *
 * Server Component와 Route Handler에서 호출해 사용자 세션을 검증한다.
 * React `cache()`로 메모이제이션되어 단일 렌더 패스 내에서 중복 호출되어도
 * Supabase를 한 번만 호출한다.
 *
 * 보안 원칙:
 *   - proxy.ts의 optimistic check는 UX 개선 용도일 뿐, 진짜 인증은 여기서 한다
 *   - Server Component에서 데이터를 가져오기 전에 반드시 getCurrentUser() 호출
 *   - `getSession()`이 아닌 내부적으로 `getUser()`를 쓴다 — Supabase Auth 서버에
 *     토큰 검증까지 수행
 *
 * 로컬라이즈드 리다이렉트는 이 모듈 밖에서 처리한다. DAL은 locale을 알 필요가
 * 없어야 하고, 보호된 페이지가 next-intl의 `redirect`를 써서 "/login"으로 보낸다.
 */

import "server-only";

import { cache } from "react";
import type { AuthUser } from "@vibestart/shared-types";

import { hasAuthSupabaseEnv } from "@/lib/supabase/auth-env";
import { createSupabaseAuthAdapter } from "./supabase-auth.adapter";

/**
 * 현재 세션의 사용자를 반환한다. 없으면 null.
 * Server Component에서 "로그인 했을 때만" 표시되는 UI를 그릴 때 사용.
 *
 * Phase 2 Supabase 환경변수가 아직 설정되지 않은 상태(로컬 개발 초기,
 * SETUP.md 미완료)에서는 예외를 던지지 않고 조용히 null을 반환해 Phase 1
 * 페이지와 공존하게 한다. 보호된 페이지는 null을 받아 /login으로 보내고,
 * /login은 hasAuthSupabaseEnv()로 자체 SetupNotice를 표시한다.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  if (!hasAuthSupabaseEnv()) return null;
  const adapter = createSupabaseAuthAdapter();
  return adapter.getCurrentUser();
});

/**
 * 세션이 존재하는지만 boolean으로 반환한다. 화면 분기에 쓴다.
 */
export async function hasSession(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

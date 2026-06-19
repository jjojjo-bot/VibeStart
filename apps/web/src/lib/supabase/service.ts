/**
 * 서버 전용 service-role Supabase 클라이언트.
 *
 * RLS를 우회하므로 절대 클라이언트로 노출하지 말 것("server-only"). 익명
 * 발행(auth.uid 없음)처럼 RLS로 표현하기 까다로운 서버 작업에만 쓴다.
 * 접근 제어는 호출하는 서버 코드(검증·레이트리밋)가 전적으로 책임진다.
 *
 * 필요한 env: NEXT_PUBLIC_AUTH_SUPABASE_URL +
 *   AUTH_SUPABASE_SERVICE_ROLE_KEY (프로젝트 컨벤션 — .env.example/.env.local) 또는
 *   SUPABASE_SERVICE_ROLE_KEY (별칭). 둘 중 하나만 있으면 된다.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** 두 이름(AUTH_ 우선) 중 설정된 service-role 키를 반환. */
function readServiceKey(): string | undefined {
  return (
    process.env.AUTH_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || undefined
  );
}

export function getServiceSupabaseEnv(): { url: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL;
  const serviceKey = readServiceKey();
  if (!url || !serviceKey) {
    throw new Error(
      "service-role Supabase env 미설정: NEXT_PUBLIC_AUTH_SUPABASE_URL + " +
        "(AUTH_SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SERVICE_ROLE_KEY) 필요",
    );
  }
  return { url, serviceKey };
}

export function hasServiceSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL && readServiceKey());
}

/** RLS 우회 클라이언트. 세션·쿠키 없음(persistSession: false). */
export function createServiceClient(): SupabaseClient {
  const { url, serviceKey } = getServiceSupabaseEnv();
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

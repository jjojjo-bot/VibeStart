/**
 * Phase 2 — vibestart 자체 Supabase 프로젝트 (사용자/프로젝트/OAuth 데이터) env.
 *
 * 통계용 Supabase 프로젝트(NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)와는 완전히
 * 분리된 별도 프로젝트다. 2026-04-08 결정으로 통계와 사용자 데이터는 서로
 * 다른 Supabase 프로젝트에 둔다.
 *
 * 필요한 env:
 *   NEXT_PUBLIC_AUTH_SUPABASE_URL
 *   NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY
 */

export interface AuthSupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Phase 2 Supabase 프로젝트 env를 읽는다. 설정되지 않았으면 명확한 에러를
 * 던져 사용자에게 셋업 가이드를 따라야 한다는 사실을 알린다.
 */
export function getAuthSupabaseEnv(): AuthSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Phase 2 Supabase 프로젝트 환경변수가 설정되지 않았습니다. " +
        "supabase/migrations/phase2/SETUP.md 가이드를 따라 " +
        "NEXT_PUBLIC_AUTH_SUPABASE_URL, NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY를 설정해주세요.",
    );
  }

  return { url, anonKey };
}

/**
 * env가 설정되어 있는지만 조용히 확인한다 (에러 없이).
 * 랜딩/설정 페이지에서 "로그인 기능이 아직 준비되지 않았다" 표시용.
 */
export function hasAuthSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY,
  );
}

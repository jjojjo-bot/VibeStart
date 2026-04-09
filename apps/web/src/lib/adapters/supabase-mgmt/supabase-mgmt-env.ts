/**
 * Supabase Management OAuth App 환경변수 접근.
 *
 * 사용자는 https://supabase.com/dashboard/org/<slug>/apps 에서 OAuth App을
 * 등록하고 Client ID / Client Secret을 발급받아 apps/web/.env.local에 넣는다.
 * Authorization callback URL은 origin + /auth/supabase/callback 으로
 * 호출자가 계산해 beginAuthorize에 넘긴다.
 */

export interface SupabaseMgmtOAuthConfig {
  clientId: string;
  clientSecret: string;
}

export function getSupabaseMgmtOAuthConfig(): SupabaseMgmtOAuthConfig {
  const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "SUPABASE_OAUTH_CLIENT_ID / SUPABASE_OAUTH_CLIENT_SECRET 환경변수가 " +
        "설정되지 않았습니다. https://supabase.com/dashboard/org/<slug>/apps 에서 " +
        "OAuth App을 등록한 뒤 apps/web/.env.local에 추가해주세요.",
    );
  }

  return { clientId, clientSecret };
}

export function hasSupabaseMgmtOAuthEnv(): boolean {
  return Boolean(
    process.env.SUPABASE_OAUTH_CLIENT_ID &&
      process.env.SUPABASE_OAUTH_CLIENT_SECRET,
  );
}

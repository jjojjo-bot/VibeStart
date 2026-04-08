/**
 * GitHub OAuth App 환경변수 접근.
 *
 * 사용자는 https://github.com/settings/developers 에서 OAuth App을 등록하고
 * Client ID / Client Secret을 발급받아 apps/web/.env.local에 넣어야 한다.
 * Callback URL은 이 파일이 계산한다 (origin + /auth/github/callback).
 */

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  /** scope를 공백으로 구분한 문자열. 기본: repo + user:email */
  scope: string;
}

export function getGitHubOAuthConfig(): GitHubOAuthConfig {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET 환경변수가 " +
        "설정되지 않았습니다. https://github.com/settings/developers 에서 " +
        "OAuth App을 등록한 뒤 apps/web/.env.local에 추가해주세요.",
    );
  }

  return {
    clientId,
    clientSecret,
    scope: "repo user:email",
  };
}

export function hasGitHubOAuthEnv(): boolean {
  return Boolean(
    process.env.GITHUB_OAUTH_CLIENT_ID &&
      process.env.GITHUB_OAUTH_CLIENT_SECRET,
  );
}

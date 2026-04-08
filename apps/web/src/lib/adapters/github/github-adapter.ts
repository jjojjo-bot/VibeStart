/**
 * GitHub OAuth + REST 어댑터 — @vibestart/ports VcsPort의 첫 번째 구현체.
 *
 * Phase 2a (라)-1: beginAuthorize / completeAuthorize (OAuth 플로우 + /user
 * 메타데이터 조회).
 * Phase 2a (라)-2: createRepo / ensureCollaborator (저장소 생성 + 템플릿 push).
 *
 * GitHub API 참고:
 *   https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 *   https://docs.github.com/en/rest/users/users
 */

import "server-only";

import type { VcsPort } from "@vibestart/ports";
import type {
  CreateRepoOptions,
  OAuthExchangeResult,
  VcsRepo,
} from "@vibestart/shared-types";

import { getGitHubOAuthConfig } from "./github-env";

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

/**
 * VcsPort 구현체. 각 인스턴스는 stateless하며 요청마다 새로 만들어도 된다.
 */
export function createGitHubAdapter(): VcsPort {
  const config = getGitHubOAuthConfig();

  return {
    async beginAuthorize(
      state: string,
      redirectTo: string,
    ): Promise<{ url: string }> {
      const url = new URL(AUTHORIZE_URL);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", redirectTo);
      url.searchParams.set("scope", config.scope);
      url.searchParams.set("state", state);
      // allow_signup=true는 기본값. prompt=consent는 GitHub에 없음.
      return { url: url.toString() };
    },

    async completeAuthorize(
      code: string,
      _state: string,
    ): Promise<OAuthExchangeResult> {
      const tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "VibeStart",
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(
          `GitHub token 교환 실패: HTTP ${tokenRes.status} ${tokenRes.statusText}`,
        );
      }

      const tokenData = (await tokenRes.json()) as GitHubTokenResponse;

      if (tokenData.error || !tokenData.access_token) {
        throw new Error(
          `GitHub token 교환 실패: ${tokenData.error ?? "unknown"} — ${tokenData.error_description ?? ""}`,
        );
      }

      const accessToken = tokenData.access_token;
      const scope = tokenData.scope ?? config.scope;

      // /user 엔드포인트로 메타데이터 조회 → UI에 "@username" 표시용
      const userRes = await fetch(USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "VibeStart",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!userRes.ok) {
        throw new Error(
          `GitHub /user 조회 실패: HTTP ${userRes.status}. scope에 user:email이 포함됐는지 확인하세요.`,
        );
      }

      const user = (await userRes.json()) as GitHubUser;

      return {
        accessToken,
        refreshToken: null, // GitHub OAuth App은 기본적으로 refresh token 미발급
        scope,
        expiresAt: null, // 토큰 무기한 (앱 revoke/rotate 전까지)
        metadata: {
          providerUserId: String(user.id),
          providerUsername: user.login,
          providerDisplayName: user.name ?? user.login,
          providerAvatarUrl: user.avatar_url,
        },
      };
    },

    async createRepo(
      _accessToken: string,
      _opts: CreateRepoOptions,
    ): Promise<VcsRepo> {
      // (라)-2에서 구현. 지금 호출되면 눈에 띄는 에러로.
      throw new Error("createRepo는 아직 구현되지 않았습니다 (Phase 2a (라)-2).");
    },

    async ensureCollaborator(
      _accessToken: string,
      _repo: VcsRepo,
      _username: string,
    ): Promise<void> {
      throw new Error("ensureCollaborator는 Phase 2c 팀 기능에서 구현 예정.");
    },
  };
}

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
const REPOS_URL = "https://api.github.com/user/repos";

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

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
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
      accessToken: string,
      opts: CreateRepoOptions,
    ): Promise<VcsRepo> {
      // 빈 저장소 + auto_init README. (라)-2 결정사항: 외부 템플릿 복제나
      // 초기 파일 push는 하지 않는다. Vercel 첫 배포는 사용자가 코드를
      // push한 뒤 또는 후속 마일스톤에서 처리.
      const res = await fetch(REPOS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "VibeStart",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          name: opts.name,
          description: opts.description,
          private: opts.isPrivate,
          auto_init: true,
        }),
      });

      if (res.status === 401) {
        throw new Error("github:unauthorized");
      }
      if (res.status === 403) {
        throw new Error("github:forbidden");
      }
      if (res.status === 422) {
        // GitHub은 이름 중복도 422로 보낸다. body의 errors[].message에
        // "name already exists on this account"가 들어있으나, 사용자
        // 메시지는 i18n에서 코드로 매핑하므로 여기서는 단일 코드만.
        throw new Error("github:name_exists");
      }
      if (!res.ok) {
        throw new Error(`github:http_${res.status}`);
      }

      const repo = (await res.json()) as GitHubRepoResponse;

      return {
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        defaultBranch: repo.default_branch,
        isPrivate: repo.private,
      };
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

/**
 * GitHub repo에 파일 한 개를 push (생성 또는 업데이트). Contents API 사용.
 *
 * 파일이 이미 존재하면 422 → GET으로 기존 sha 조회 후 자동 재시도(업데이트).
 * 반환값에 sha를 담아서 이후 업데이트 시 호출자가 재사용할 수 있다.
 */
export async function pushFileToGitHub(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  commitMessage: string,
): Promise<{ sha: string }> {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "VibeStart",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const base64 = Buffer.from(content, "utf-8").toString("base64");

  // 1차 시도: sha 없이 PUT (신규 파일)
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ message: commitMessage, content: base64 }),
  });

  if (res.status === 201 || res.status === 200) {
    const data = (await res.json()) as { content: { sha: string } };
    return { sha: data.content.sha };
  }

  // 422: 파일이 이미 존재해 sha가 필요한 경우 → GET으로 기존 sha 조회
  if (res.status === 422) {
    const getRes = await fetch(url, { method: "GET", headers });
    if (!getRes.ok) {
      throw new Error(`github:http_${getRes.status}`);
    }
    const existing = (await getRes.json()) as { sha: string };
    const retryRes = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: commitMessage,
        content: base64,
        sha: existing.sha,
      }),
    });
    if (retryRes.status === 200 || retryRes.status === 201) {
      const data = (await retryRes.json()) as { content: { sha: string } };
      return { sha: data.content.sha };
    }
    throw new Error(`github:http_${retryRes.status}`);
  }

  if (res.status === 401) throw new Error("github:unauthorized");
  if (res.status === 403) throw new Error("github:forbidden");
  throw new Error(`github:http_${res.status}`);
}

/**
 * 특정 owner/name 저장소가 존재하는지 확인하고, 있으면 VcsRepo로 매핑해
 * 반환한다. 없으면 null. (라)-2 idempotent recovery 용도 — Phase 2a의
 * in-memory project_resources가 dev 재시작으로 비워졌을 때 GitHub.com에는
 * 실제로 repo가 살아있는 케이스를 구제한다.
 *
 * VcsPort에 정식으로 추가하지 않는 이유: Phase 2b에서 project_resources가
 * Supabase로 옮겨가면 이 recovery 자체가 불필요해지기 때문에 임시 헬퍼로
 * 자리잡는 게 적절.
 */
export async function fetchGitHubRepoIfExists(
  accessToken: string,
  owner: string,
  name: string,
): Promise<VcsRepo | null> {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "VibeStart",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (res.status === 404) return null;
  if (res.status === 401) throw new Error("github:unauthorized");
  if (res.status === 403) throw new Error("github:forbidden");
  if (!res.ok) throw new Error(`github:http_${res.status}`);

  const repo = (await res.json()) as GitHubRepoResponse;
  return {
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    defaultBranch: repo.default_branch,
    isPrivate: repo.private,
  };
}

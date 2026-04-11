/**
 * Vercel REST API 어댑터.
 *
 * Phase 2a (라)-3: fetchVercelUser — Personal Access Token을 검증하고
 *                  사용자 메타데이터(uid, username, name)를 반환한다.
 *
 * Vercel은 일반 사용자가 OAuth Integration을 만들 수 없도록 (Marketplace
 * 파트너 프로그램만) 변경했기 때문에 (라)-3는 PAT 붙여넣기 방식으로 동작.
 * GitHub과 달리 client_id/secret 기반 토큰 교환이 없으므로 begin/complete
 * Authorize 메서드는 (라)-3에서 정의하지 않는다. (라)-4 이후 createProject /
 * triggerDeployment 등이 추가되면 이 파일에서 같이 export해 어댑터로 성장.
 *
 * Vercel API 참고:
 *   https://vercel.com/docs/rest-api/endpoints/user
 */

import "server-only";

import { VERCEL_API_BASE } from "./vercel-env";

/**
 * `oauth_connections.metadata`에 저장할 사용자 식별 정보.
 * GitHub 어댑터의 metadata 형태와 키 이름을 맞춰서 저장 후 OAuthConnectionRow
 * 매핑에서 분기 없이 동일하게 처리되도록 한다.
 */
export interface VercelUserMeta {
  providerUserId: string;
  providerUsername: string;
  providerDisplayName: string;
  providerAvatarUrl: string | null;
}

/**
 * Vercel /v2/user 응답. Vercel은 리비전에 따라 응답을 `{ user: {...} }`로
 * 한 번 감싸기도 하고 그대로 보내기도 하므로 두 모양을 모두 받는다.
 *
 * Vercel User 객체의 식별자 필드는 `id` (과거 일부 문서에 `uid`로 표기된
 * 적이 있어 fallback도 같이 시도).
 */
interface VercelUserResponseRaw {
  id?: string;
  uid?: string;
  username?: string;
  name?: string | null;
  email?: string | null;
}
interface VercelUserResponseWrapped {
  user?: VercelUserResponseRaw;
}
type VercelUserResponse = VercelUserResponseRaw & VercelUserResponseWrapped;

/**
 * 토큰을 받아 /v2/user를 호출하고 사용자 메타데이터를 반환한다.
 * 응답 코드별 에러 메시지는 URL-safe 코드 문자열(`vercel:invalid_token` 등)
 * 으로 throw해 server action이 에러 redirect 쿼리에 그대로 실어 보낸다.
 */
export async function fetchVercelUser(
  accessToken: string,
): Promise<VercelUserMeta> {
  const res = await fetch(`${VERCEL_API_BASE}/v2/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": "VibeStart",
    },
  });

  if (res.status === 401) {
    throw new Error("vercel:invalid_token");
  }
  if (res.status === 403) {
    throw new Error("vercel:forbidden");
  }
  if (res.status >= 500) {
    throw new Error("vercel:service_unavailable");
  }
  if (!res.ok) {
    throw new Error(`vercel:http_${res.status}`);
  }

  const data = (await res.json()) as VercelUserResponse;
  const user: VercelUserResponseRaw = data.user ?? data;

  const userId = user.id ?? user.uid;
  if (!userId || !user.username) {
    throw new Error("vercel:malformed_response");
  }

  return {
    providerUserId: String(userId),
    providerUsername: user.username,
    providerDisplayName: user.name ?? user.username,
    providerAvatarUrl: null,
  };
}

// ─────────────────────────────────────────────────────────────
// (라)-4: Vercel 프로젝트 생성 + 배포 조회
// ─────────────────────────────────────────────────────────────

const VERCEL_HEADERS = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": "VibeStart",
});

/** createVercelProject 반환형. */
export interface VercelProjectResult {
  id: string;
  name: string;
}

/**
 * Vercel 프로젝트를 생성하고 GitHub repo에 연결한다. Vercel GitHub App이
 * 설치돼 있어야 한다 (미설치 시 vercel:github_app_not_installed).
 *
 * 409(프로젝트 이름 이미 존재)이면 GET으로 기존 프로젝트를 조회해 재사용.
 */
export async function createVercelProject(
  accessToken: string,
  projectName: string,
  gitRepo: string,
): Promise<VercelProjectResult> {
  const res = await fetch(`${VERCEL_API_BASE}/v10/projects`, {
    method: "POST",
    headers: VERCEL_HEADERS(accessToken),
    body: JSON.stringify({
      name: projectName,
      framework: null,
      gitRepository: { type: "github", repo: gitRepo },
    }),
  });

  if (res.ok) {
    const data = (await res.json()) as { id: string; name: string };
    return { id: data.id, name: data.name };
  }

  // 409: 이미 존재 → GET으로 기존 프로젝트 조회
  if (res.status === 409) {
    const getRes = await fetch(
      `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectName)}`,
      { method: "GET", headers: VERCEL_HEADERS(accessToken) },
    );
    if (getRes.ok) {
      const data = (await getRes.json()) as { id: string; name: string };
      return { id: data.id, name: data.name };
    }
    throw new Error(`vercel:http_${getRes.status}`);
  }

  // GitHub App 미설치 관련 에러 감지. Vercel은 여러 코드로 보낼 수 있으나
  // 본문에 "repo" 또는 "git" 키워드가 있으면 GitHub 접근 문제로 간주.
  if (res.status === 400 || res.status === 403) {
    const body = await res.text();
    if (
      body.includes("repo") ||
      body.includes("git") ||
      body.includes("installation")
    ) {
      throw new Error("vercel:github_app_not_installed");
    }
  }

  if (res.status === 402) throw new Error("vercel:plan_limit");
  if (res.status === 401) throw new Error("vercel:invalid_token");
  throw new Error(`vercel:http_${res.status}`);
}

/**
 * Vercel 프로젝트가 존재하는지 확인한다. 삭제됐으면 false.
 */
export async function vercelProjectExists(
  accessToken: string,
  projectId: string,
): Promise<boolean> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectId)}`,
    { method: "GET", headers: VERCEL_HEADERS(accessToken) },
  );
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`vercel:http_${res.status}`);
  return true;
}

/** Vercel 배포 조회 결과. */
export interface VercelDeploymentResult {
  id: string;
  /** per-deployment URL (랜덤 hash 포함, 예: my-blog-abc123-user.vercel.app) */
  url: string;
  readyState: string;
  /** production alias 목록 (예: my-blog.vercel.app). READY 이전엔 비어있을 수 있음. */
  alias: string[];
}

/**
 * 프로젝트의 최신 production 배포를 조회한다. 배포가 없으면 null.
 * Vercel이 git-link 후 자동 트리거한 배포를 찾는 용도.
 */
export async function getLatestDeployment(
  accessToken: string,
  projectId: string,
): Promise<VercelDeploymentResult | null> {
  const url = `${VERCEL_API_BASE}/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=1`;
  const res = await fetch(url, {
    method: "GET",
    headers: VERCEL_HEADERS(accessToken),
  });
  if (!res.ok) throw new Error(`vercel:http_${res.status}`);
  const data = (await res.json()) as {
    deployments: Array<{
      uid: string;
      url: string;
      readyState: string;
      alias?: string[];
    }>;
  };
  const first = data.deployments[0];
  if (!first) return null;
  return {
    id: first.uid,
    url: first.url,
    readyState: first.readyState,
    alias: first.alias ?? [],
  };
}

/**
 * 배포 ID로 상태를 조회한다. 폴링용.
 */
export async function getDeployment(
  accessToken: string,
  deploymentId: string,
): Promise<VercelDeploymentResult> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v13/deployments/${encodeURIComponent(deploymentId)}`,
    { method: "GET", headers: VERCEL_HEADERS(accessToken) },
  );
  if (!res.ok) throw new Error(`vercel:http_${res.status}`);
  const data = (await res.json()) as {
    id: string;
    url: string;
    readyState: string;
    alias?: string[];
  };
  return {
    id: data.id,
    url: data.url,
    readyState: data.readyState,
    alias: data.alias ?? [],
  };
}

/**
 * 프로젝트의 production 영역 alias 목록을 조회한다.
 *
 * Vercel은 (1) deployment-specific alias (`{name}-{hash}-{user}.vercel.app`,
 * 해당 deployment만 가리킴) 와 (2) project production alias (`{name}.vercel
 * .app`, latest production deployment를 가리킴) 두 종류를 가진다. 사용자에게
 * 보여줄 안정적인 URL은 후자.
 *
 * Vercel API의 project 응답에서 `targets.production.alias[]`를 우선 사용,
 * 없으면 top-level `alias[]`에서 PRODUCTION 타겟을 찾는다.
 */
export async function getVercelProjectProductionUrl(
  accessToken: string,
  projectIdOrName: string,
): Promise<string | null> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectIdOrName)}`,
    { method: "GET", headers: VERCEL_HEADERS(accessToken) },
  );
  if (!res.ok) {
    console.error("[getVercelProjectProductionUrl] non-ok", res.status);
    return null;
  }

  const data = (await res.json()) as Record<string, unknown>;
  const targets = data.targets as
    | {
        production?: {
          alias?: string[];
          automaticAliases?: string[];
        };
      }
    | undefined;
  const latest = data.latestDeployments as
    | Array<{ alias?: string[] }>
    | undefined;

  // 디버그: alias 배열을 풀어서 로깅 (Node가 [Array]로 축약하지 않도록)
  console.log("[getVercelProjectProductionUrl] alias detail", {
    targetsProductionAlias: targets?.production?.alias,
    targetsProductionAutomaticAliases: targets?.production?.automaticAliases,
    latestDeploymentAlias: latest?.[0]?.alias,
  });

  // Vercel은 production deployment에 여러 alias를 붙인다:
  //   - {name}.vercel.app (canonical, 다른 사람이 쓰면 Vercel이 다른 걸 배정)
  //   - {name}-{adj}-{noun}.vercel.app (subdomain 충돌 시 Vercel이 자동 배정한 canonical)
  //   - {name}-{teamSlug}.vercel.app (team auto alias)
  //   - {name}-git-{branch}-{teamSlug}.vercel.app (branch auto alias)
  //
  // 사용자가 Vercel 대시보드에서 "Domains" 섹션에 보는 canonical URL은
  // automaticAliases에 포함되지 **않은** alias이다. automaticAliases는
  // team/branch에 자동 부착되는 보조 alias 모음.
  //
  // 알고리즘: alias 중 automaticAliases에 없는 것을 우선 선택.
  // 없으면 fallback으로 가장 짧은 alias 사용.
  const allAliases = targets?.production?.alias ?? [];
  const automaticSet = new Set(
    targets?.production?.automaticAliases ?? [],
  );

  const canonical = allAliases.find((a) => !automaticSet.has(a));
  if (canonical) {
    console.log("[getVercelProjectProductionUrl] selected canonical", {
      chosen: canonical,
      automaticSkipped: [...automaticSet],
    });
    return canonical;
  }

  // Fallback: alias 또는 latestDeployment alias 중 가장 짧은 것
  const fallbackPool = [
    ...allAliases,
    ...(latest?.[0]?.alias ?? []),
  ];
  if (fallbackPool.length === 0) return null;
  const sorted = Array.from(new Set(fallbackPool)).sort(
    (a, b) => a.length - b.length,
  );
  console.log("[getVercelProjectProductionUrl] selected fallback (shortest)", {
    chosen: sorted[0],
    pool: sorted,
  });
  return sorted[0]!;
}

/**
 * Git source를 지정해 명시적으로 배포를 트리거한다.
 *
 * POST /v10/projects는 git 연결만 만들고 자동 배포를 트리거하지 않으므로
 * 별도로 POST /v13/deployments를 호출해 deployment를 만들어줘야 한다.
 * Vercel GitHub App이 해당 repo에 접근 권한이 있어야 한다 (없으면 git
 * source 검증에서 실패).
 */
export async function triggerVercelDeployment(
  accessToken: string,
  projectName: string,
  owner: string,
  repo: string,
  ref: string = "main",
): Promise<VercelDeploymentResult> {
  const res = await fetch(`${VERCEL_API_BASE}/v13/deployments`, {
    method: "POST",
    headers: VERCEL_HEADERS(accessToken),
    body: JSON.stringify({
      name: projectName,
      target: "production",
      gitSource: {
        type: "github",
        org: owner,
        repo,
        ref,
      },
    }),
  });

  if (res.ok) {
    const data = (await res.json()) as {
      id: string;
      url: string;
      readyState?: string;
      alias?: string[];
    };
    return {
      id: data.id,
      url: data.url,
      readyState: data.readyState ?? "QUEUED",
      alias: data.alias ?? [],
    };
  }

  if (res.status === 401) throw new Error("vercel:invalid_token");
  if (res.status === 402) throw new Error("vercel:plan_limit");

  // 에러 본문을 읽어 정확한 error code를 추출. Vercel은 보통 JSON으로
  // { error: { code, message } } 형태로 응답한다.
  const body = await res.text();
  console.error("[triggerVercelDeployment] error body", {
    status: res.status,
    body: body.slice(0, 500),
  });

  // GitHub App 미설치/권한 부족 관련 정확한 코드만 매칭
  if (
    body.includes("missing_github_app") ||
    body.includes("not_authorized_to_access") ||
    body.includes("forbidden_repository") ||
    body.includes("github_app_not_installed") ||
    body.includes("Resource not accessible by integration")
  ) {
    throw new Error("vercel:github_app_not_installed");
  }

  // 본문 일부를 에러 코드에 포함시켜 사용자에게 단서를 제공
  const snippet = body
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .slice(0, 60);
  throw new Error(`vercel:http_${res.status}_${snippet}`);
}

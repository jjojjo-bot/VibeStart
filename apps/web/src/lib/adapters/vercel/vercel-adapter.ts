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

/**
 * Vercel 계정에 특정 git provider (기본 github)가 연결돼 있는지 검증한다.
 *
 * 사용자가 Google/이메일만으로 Vercel 계정에 가입했다면 Vercel은 그 사용자의
 * GitHub 신원을 모른다. 그 상태로 createVercelProject에서 repo를 연결하면
 * "T-Brandon does not have a Vercel account linked to their GitHub account"
 * 식 에러가 떨어진다 — 사용자가 PAT를 붙여넣은 이 시점에 미리 막는 것이
 * 첫 배포에서 실패하는 것보다 훨씬 나은 UX.
 *
 * `/v1/integrations/git-namespaces?provider=github` 엔드포인트는 해당 토큰의
 * Vercel 계정이 접근 가능한 GitHub namespace(개인 + org) 목록을 반환한다.
 * 빈 배열이면 GitHub 연결이 없다는 뜻.
 *
 * 네트워크/권한 에러 등으로 확인 자체가 실패하면 "unknown"을 반환해
 * 호출자가 보수적으로 통과시키도록 한다 (기존 배포 에러 매핑이 복구 안내를
 * 하는 백업 레이어이므로).
 */
export async function fetchVercelGitNamespaces(
  accessToken: string,
  provider: "github" | "gitlab" | "bitbucket" = "github",
): Promise<"linked" | "not-linked" | "unknown"> {
  try {
    const res = await fetch(
      `${VERCEL_API_BASE}/v1/integrations/git-namespaces?provider=${provider}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "User-Agent": "VibeStart",
        },
      },
    );
    if (!res.ok) {
      console.warn("[fetchVercelGitNamespaces] non-OK", {
        provider,
        status: res.status,
      });
      return "unknown";
    }
    const data = (await res.json()) as unknown;
    // Vercel 응답은 배열 or { namespaces: [...] } 두 형태 모두 관측된 적 있음
    const arr: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray((data as { namespaces?: unknown[] }).namespaces)
        ? ((data as { namespaces: unknown[] }).namespaces)
        : [];
    return arr.length > 0 ? "linked" : "not-linked";
  } catch (err) {
    console.warn("[fetchVercelGitNamespaces] fetch failed", {
      provider,
      error: err instanceof Error ? err.message : String(err),
    });
    return "unknown";
  }
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
  rootDirectory?: string,
): Promise<VercelProjectResult> {
  const body: Record<string, unknown> = {
    name: projectName,
    framework: "nextjs",
    gitRepository: { type: "github", repo: gitRepo },
  };
  if (rootDirectory) {
    body.rootDirectory = rootDirectory;
  }
  const res = await fetch(`${VERCEL_API_BASE}/v10/projects`, {
    method: "POST",
    headers: VERCEL_HEADERS(accessToken),
    body: JSON.stringify(body),
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

  // 여기까지 왔으면 non-OK && non-409. 본문을 한 번만 읽어서 로그 + 에러
  // 메시지 snippet에 같이 활용한다. 이전 구현은 400/403일 때만 body를 읽고
  // 키워드 매칭 실패 시 그대로 버렸기 때문에 실제 Vercel 원문 메시지를
  // 추적할 수 없었다 (예: `vercel:http_403`만 남고 무엇이 금지됐는지 모름).
  const errBody = await res.text();
  console.error("[createVercelProject] error body", {
    status: res.status,
    body: errBody.slice(0, 500),
  });

  // GitHub App 미설치 관련 에러 감지. Vercel은 여러 코드로 보낼 수 있으나
  // 본문에 "repo" 또는 "git" 키워드가 있으면 GitHub 접근 문제로 간주.
  if (res.status === 400 || res.status === 403) {
    if (
      errBody.includes("repo") ||
      errBody.includes("git") ||
      errBody.includes("installation")
    ) {
      throw new Error("vercel:github_app_not_installed");
    }
  }

  if (res.status === 402) throw new Error("vercel:plan_limit");
  if (res.status === 401) throw new Error("vercel:invalid_token");

  // triggerVercelDeployment와 동일 패턴: 본문 일부를 에러 코드에 포함시켜
  // 사용자에게 redirect query로 단서를 전달한다. actions.ts가 메시지를 120자로
  // 자르므로 snippet은 60자면 충분.
  const snippet = errBody.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60);
  throw new Error(`vercel:http_${res.status}_${snippet}`);
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
  /** 배포 생성 epoch ms — M3 Step 4에서 "최근 N분 전 배포" 표시용. */
  createdAt: number;
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
      created: number;
    }>;
  };
  const first = data.deployments[0];
  if (!first) return null;
  return {
    id: first.uid,
    url: first.url,
    readyState: first.readyState,
    alias: first.alias ?? [],
    createdAt: first.created,
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
    createdAt?: number;
  };
  return {
    id: data.id,
    url: data.url,
    readyState: data.readyState,
    alias: data.alias ?? [],
    createdAt: data.createdAt ?? Date.now(),
  };
}

/**
 * 프로젝트의 production 영역에서 사용자에게 보여줄 canonical URL을 선택한다.
 *
 * Vercel은 하나의 production deployment에 여러 alias를 붙인다
 *
 *   - `{slug}.vercel.app` (exact, 충돌이 없으면)
 *   - `{slug}-{adj}-{noun}.vercel.app` (subdomain 충돌 시 collision-avoidance canonical, 예: `python-test-xi-eight.vercel.app`)
 *   - `{slug}-{teamSlug}.vercel.app` (team auto alias, 예: `python-test-feams.vercel.app`)
 *   - `{slug}-git-{branch}-{teamSlug}.vercel.app` (branch auto alias)
 *   - `{slug}-{hash}-{teamSlug}.vercel.app` (deployment-specific)
 *
 * 이전 구현은 `automaticAliases`가 채워져 있으면 잘 동작했지만, 실제로 그
 * 필드가 비어 있는 프로젝트가 있어 `alias[]`의 첫 항목(팀 auto)을 잘못
 * canonical로 고르는 경우가 있었다. 이번 구현은 naming 패턴 기반 스코어링
 * 으로 바꿔 API 필드 유무와 무관하게 작동한다.
 */
function scoreVercelAlias(alias: string, projectSlug: string): number {
  // HIGH score = more canonical.
  if (!alias.endsWith(".vercel.app")) return -Infinity;
  const domain = alias.slice(0, -".vercel.app".length);

  // exact match (예: `my-app.vercel.app`)
  if (domain === projectSlug) return 1000;

  if (!domain.startsWith(`${projectSlug}-`)) return -Infinity;
  const suffix = domain.slice(projectSlug.length + 1);

  // branch alias: `{slug}-git-{branch}-...` — 사용자에게 보여주면 안 됨
  if (suffix.startsWith("git-") || suffix.includes("-git-")) return -500;

  const parts = suffix.split("-");
  // deployment-specific alias: 7자+ "글자와 숫자가 섞인" 해시가 포함됨.
  // 단순히 `^[a-z0-9]{7,}$` 로만 검사하면 `ancient`(7자 영문자) 같은
  // 영단어도 false positive로 걸리므로, 반드시 숫자가 하나 이상 포함된
  // 경우에만 해시로 판단한다.
  const hasHash = parts.some(
    (p) => p.length >= 7 && /[a-z]/i.test(p) && /[0-9]/.test(p),
  );
  if (hasHash) return -300;

  // collision-avoidance canonical: `{slug}-{adj}-{noun}` (2 parts) — 우선
  if (parts.length >= 2) return 500;

  // team auto alias: `{slug}-{teamSlug}` (1 part) — 차선
  return 100;
}

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
  const projectSlug = typeof data.name === "string" ? data.name : "";
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

  const allAliases = targets?.production?.alias ?? [];
  const automaticSet = new Set(targets?.production?.automaticAliases ?? []);
  const deploymentAliases = latest?.[0]?.alias ?? [];

  console.log("[getVercelProjectProductionUrl] alias detail", {
    projectSlug,
    targetsProductionAlias: allAliases,
    targetsProductionAutomaticAliases: [...automaticSet],
    latestDeploymentAlias: deploymentAliases,
  });

  // 후보 풀: production alias 우선, 비어있으면 latest deployment alias 사용.
  const pool = allAliases.length > 0 ? allAliases : deploymentAliases;
  if (pool.length === 0) return null;

  // automaticAliases에 명시된 건 확실히 자동 alias라 제외. 단, 모두 제외돼
  // 후보가 사라지면 그냥 전체 풀을 사용.
  const filtered = pool.filter((a) => !automaticSet.has(a));
  const candidates = filtered.length > 0 ? filtered : pool;

  // naming 패턴 기반 스코어링으로 canonical 선택.
  // tie-break은 URL 길이 짧은 순.
  const scored = candidates
    .map((a) => ({ alias: a, score: scoreVercelAlias(a, projectSlug) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.alias.length - b.alias.length;
    });

  const chosen = scored[0]?.alias ?? null;
  console.log("[getVercelProjectProductionUrl] selected", {
    chosen,
    ranking: scored,
  });
  return chosen;
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
      createdAt?: number;
    };
    return {
      id: data.id,
      url: data.url,
      readyState: data.readyState ?? "QUEUED",
      alias: data.alias ?? [],
      createdAt: data.createdAt ?? Date.now(),
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

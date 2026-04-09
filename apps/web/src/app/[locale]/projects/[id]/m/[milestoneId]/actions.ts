"use server";

/**
 * 마일스톤 실행 화면의 Server Actions.
 *
 * connectGitHubAction: GitHub OAuth 플로우 시작.
 *   1. 현재 사용자 + 프로젝트 소유권 검증
 *   2. OAuth state 페이로드에 컨텍스트(projectId/milestoneId/substepId) 담기
 *   3. 서명된 state를 HttpOnly 쿠키에 저장
 *   4. GitHub authorize URL로 redirect
 *
 * 실제 토큰 교환과 substep 완료 마킹은 /auth/github/callback에서.
 *
 * createGitHubRepoAction: (라)-2 — 저장된 GitHub 토큰으로 사용자 계정에
 * private 저장소를 만들고 (auto_init=true), project_resources에 기록 후
 * substep을 완료 마킹한다. 동일 리소스가 이미 있으면 GitHub API 호출 없이
 * idempotent하게 redirect.
 *
 * connectVercelAction: (라)-3 — 사용자가 vercel.com에서 발급한 Personal
 * Access Token을 폼으로 받아 /v2/user로 검증하고, oauth_connections에
 * upsert한 뒤 substep을 완료 마킹한다. Vercel은 일반 OAuth Integration을
 * 지원하지 않아 PAT 방식.
 */

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";
import type { VcsRepo } from "@vibestart/shared-types";

import { getCurrentUser } from "@/lib/auth/dal";
import { createGitHubAdapter } from "@/lib/adapters/github/github-adapter";
import {
  createVercelProject,
  fetchVercelUser,
  getLatestDeployment,
  getVercelProjectProductionUrl,
  triggerVercelDeployment,
  type VercelUserMeta,
} from "@/lib/adapters/vercel/vercel-adapter";
import { pushFileToGitHub } from "@/lib/adapters/github/github-adapter";
import { buildLandingHtml } from "@/lib/deploy/landing-template";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
  buildPayload,
  signOAuthState,
} from "@/lib/auth/oauth-state";
import {
  getOAuthAccessToken,
  saveOAuthConnection,
} from "@/lib/auth/oauth-connections";
import {
  addProjectResource,
  getDummyProject,
  getProjectResourceByType,
  markSubstepCompleted,
} from "@/lib/projects/in-memory-store";
import { routing } from "@/i18n/routing";

function resolveLocale(raw: unknown): string {
  if (
    typeof raw === "string" &&
    (routing.locales as readonly string[]).includes(raw)
  ) {
    return raw;
  }
  return routing.defaultLocale;
}

function buildReturnTo(
  locale: string,
  projectId: string,
  milestoneId: string,
): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}/projects/${projectId}/m/${milestoneId}`;
}

export async function connectGitHubAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다");
  }

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = getDummyProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const payload = buildPayload({
    userId: user.id,
    projectId,
    milestoneId,
    substepId,
    returnTo: buildReturnTo(locale, projectId, milestoneId),
  });

  const signed = signOAuthState(payload);
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_STATE_TTL_SECONDS,
    path: "/",
  });

  // origin 계산 — request headers에서 host 추출
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/auth/github/callback`;

  const adapter = createGitHubAdapter();
  const { url } = await adapter.beginAuthorize(payload.state, redirectUri);

  redirect(url);
}

/**
 * (라)-2 — GitHub 저장소 자동 생성.
 *
 * `redirect()`는 NEXT_REDIRECT 심볼을 throw하므로 try 블록 안에서 호출하면
 * catch가 먹는다. 그래서 try 안에서는 변수만 채우고, 분기 redirect는 try
 * 밖에서 호출한다.
 */
export async function createGitHubRepoAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다");
  }

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = getDummyProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  // 카탈로그는 idempotent 분기와 신규 분기 모두에서 markSubstepCompleted를
  // 호출할 때 필요하므로 try 진입 전에 한 번 조회한다.
  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  function completeSubstep(): void {
    if (!milestone) return;
    markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  // 1) idempotent guard — 이미 만들어진 저장소가 있으면 GitHub API를
  //    건너뛰고 substep만 완료 마킹.
  const existing = getProjectResourceByType(project.id, "github_repo");
  if (existing) {
    completeSubstep();
    revalidatePath(returnTo);
    redirect(`${returnTo}?repo_created=already`);
  }

  // 2) GitHub access token 조회.
  const accessToken = await getOAuthAccessToken(user.id, "github");
  if (!accessToken) {
    redirect(`${returnTo}?create_repo_error=no_token`);
  }

  // 3) GitHub API 호출. try 블록 안에서는 변수만 채우고 redirect는 밖에서.
  let repo: VcsRepo | null = null;
  let errCode: string | null = null;
  try {
    const adapter = createGitHubAdapter();
    repo = await adapter.createRepo(accessToken, {
      name: project.slug,
      description: project.name,
      isPrivate: true,
    });
  } catch (err) {
    console.error("[createGitHubRepoAction] createRepo failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    errCode =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
  }

  if (errCode || !repo) {
    redirect(
      `${returnTo}?create_repo_error=${encodeURIComponent(errCode ?? "unknown")}`,
    );
  }

  // 4) 성공 — 리소스 저장 + substep 완료 마킹.
  addProjectResource({
    projectId: project.id,
    provider: "github",
    resourceType: "github_repo",
    externalId: repo.fullName,
    url: repo.htmlUrl,
    metadata: {
      repoId: repo.id,
      defaultBranch: repo.defaultBranch,
      cloneUrl: repo.cloneUrl,
      isPrivate: repo.isPrivate,
    },
  });
  completeSubstep();

  revalidatePath(returnTo);
  redirect(`${returnTo}?repo_created=1`);
}

/**
 * (라)-3 — Vercel Personal Access Token 연결.
 *
 * Vercel은 일반 OAuth Integration을 지원하지 않아 사용자가 vercel.com에서
 * 직접 토큰을 발급해 폼에 붙여넣는다. 우리는 그 토큰으로 /v2/user를 호출해
 * 사용자 메타데이터를 얻고, 검증이 끝나면 oauth_connections에 그대로 저장.
 *
 * (라)-2와 동일한 try/catch 함정 회피 패턴: redirect()는 NEXT_REDIRECT를
 * throw하므로 try 안에서는 변수만 채우고 redirect는 밖에서 호출.
 *
 * 보안: 토큰은 절대 console에 찍지 않는다. errCode와 userId만 로그.
 */
export async function connectVercelAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다");
  }

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));
  const vercelToken = String(formData.get("vercelToken") ?? "").trim();

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = getDummyProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  if (!vercelToken) {
    redirect(`${returnTo}?vercel_error=missing_token`);
  }

  let meta: VercelUserMeta | null = null;
  let errCode: string | null = null;
  try {
    meta = await fetchVercelUser(vercelToken);
  } catch (err) {
    console.error("[connectVercelAction] fetchVercelUser failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    errCode =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
  }

  if (errCode || !meta) {
    redirect(
      `${returnTo}?vercel_error=${encodeURIComponent(errCode ?? "unknown")}`,
    );
  }

  await saveOAuthConnection({
    userId: user.id,
    provider: "vercel",
    accessToken: vercelToken,
    refreshToken: null,
    scope: "personal-token",
    expiresAt: null,
    metadata: {
      providerUserId: meta.providerUserId,
      providerUsername: meta.providerUsername,
      providerDisplayName: meta.providerDisplayName,
      providerAvatarUrl: meta.providerAvatarUrl,
    },
  });

  // substep 완료 마킹
  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);
  if (milestone) {
    markSubstepCompleted({
      projectId: project.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?vercel_connected=1`);
}

/**
 * (라)-4 — Vercel 첫 배포 (GitHub 연동).
 *
 * 1. GitHub repo에 index.html push (랜딩 페이지)
 * 2. Vercel 프로젝트 생성 + GitHub repo git-link
 * 3. Vercel이 자동 배포한 결과를 폴링
 * 4. vercel_project 리소스 저장 + substep 완료
 *
 * 이후 GitHub에 push하면 Vercel이 자동 재배포 (실전 CI/CD).
 */
export async function firstDeployAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = getDummyProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  // 카탈로그 조회 (substep 완료 마킹용)
  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  function completeSubstep(): void {
    if (!milestone) return;
    markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  // 1) Idempotent guard — 이미 vercel_project 리소스가 있으면 skip
  const existingDeploy = getProjectResourceByType(
    project.id,
    "vercel_project",
  );
  if (existingDeploy) {
    completeSubstep();
    revalidatePath(returnTo);
    redirect(`${returnTo}?deploy_created=already`);
  }

  // 2) 선행 리소스 + 토큰 조회
  const githubRepo = getProjectResourceByType(project.id, "github_repo");
  if (!githubRepo) {
    redirect(`${returnTo}?deploy_error=no_repo`);
  }
  const ghToken = await getOAuthAccessToken(user.id, "github");
  if (!ghToken) {
    redirect(`${returnTo}?deploy_error=no_github_token`);
  }
  const vercelToken = await getOAuthAccessToken(user.id, "vercel");
  if (!vercelToken) {
    redirect(`${returnTo}?deploy_error=no_vercel_token`);
  }

  // externalId는 "owner/repo" 형태 (fullName)
  const gitRepoFullName = githubRepo.externalId;
  const [owner, repoName] = gitRepoFullName.split("/");
  if (!owner || !repoName) {
    redirect(`${returnTo}?deploy_error=invalid_repo`);
  }

  // 3) GitHub repo에 index.html push
  let errCode: string | null = null;
  try {
    const html = buildLandingHtml(project.name);
    await pushFileToGitHub(
      ghToken,
      owner,
      repoName,
      "index.html",
      html,
      "feat: add landing page via VibeStart",
    );
  } catch (err) {
    console.error("[firstDeployAction] pushFileToGitHub failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    errCode =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
  }

  if (errCode) {
    redirect(
      `${returnTo}?deploy_error=${encodeURIComponent(`push_failed:${errCode}`)}`,
    );
  }

  // 4) Vercel 프로젝트 생성 + GitHub repo 연결
  let vercelProject: { id: string; name: string } | null = null;
  try {
    vercelProject = await createVercelProject(
      vercelToken,
      project.slug,
      gitRepoFullName,
    );
  } catch (err) {
    console.error("[firstDeployAction] createVercelProject failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    errCode =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
  }

  if (errCode || !vercelProject) {
    redirect(
      `${returnTo}?deploy_error=${encodeURIComponent(errCode ?? "unknown")}`,
    );
  }

  // 5) deployment 확보 — 자동 배포 5초 대기 후 없으면 수동 trigger.
  // GitHub App 권한이 있으면 createVercelProject가 자동 배포할 수 있고
  // 그렇지 않으면 수동 trigger가 필요하다. 두 케이스를 한 번에 처리.
  const defaultBranch =
    typeof githubRepo.metadata.defaultBranch === "string"
      ? githubRepo.metadata.defaultBranch
      : "main";

  // 자동 배포 잠깐 대기 (Vercel이 webhook을 처리할 시간)
  await new Promise((r) => setTimeout(r, 5000));

  let deploymentId: string | null = null;
  let deployUrl: string | null = null;
  let finalState = "timeout";

  try {
    const auto = await getLatestDeployment(vercelToken, vercelProject.id);
    if (auto) {
      // 자동 배포 발생 — 그것을 사용
      deploymentId = auto.id;
      deployUrl = auto.url;
      console.log("[firstDeployAction] using auto deployment", { id: auto.id });
    } else {
      // 자동 배포 없음 — 수동 trigger
      console.log("[firstDeployAction] no auto deployment, triggering manually");
      const triggered = await triggerVercelDeployment(
        vercelToken,
        vercelProject.name,
        owner,
        repoName,
        defaultBranch,
      );
      deploymentId = triggered.id;
      deployUrl = triggered.url;
    }
  } catch (err) {
    console.error("[firstDeployAction] deployment trigger failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    errCode =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
  }

  if (errCode || !deploymentId) {
    redirect(
      `${returnTo}?deploy_error=${encodeURIComponent(errCode ?? "no_deployment")}`,
    );
  }

  // 6) deployment가 READY/ERROR/CANCELED에 도달할 때까지 폴링
  const POLL_INTERVAL = 3000;
  const POLL_MAX = 60000;
  const start = Date.now();

  try {
    while (Date.now() - start < POLL_MAX) {
      const current = await getLatestDeployment(
        vercelToken,
        vercelProject.id,
      );
      if (current) {
        deployUrl = current.url;
        if (current.readyState === "READY") {
          finalState = "READY";
          break;
        }
        if (
          current.readyState === "ERROR" ||
          current.readyState === "CANCELED"
        ) {
          finalState = current.readyState;
          break;
        }
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
  } catch (err) {
    console.error("[firstDeployAction] polling failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 7) 배포 실패/타임아웃 처리 — URL 저장하지 않음 (잘못된 fallback URL을
  // 사용자에게 보이지 않게).
  if (finalState === "ERROR" || finalState === "CANCELED") {
    redirect(
      `${returnTo}?deploy_error=${encodeURIComponent(`deploy_${finalState.toLowerCase()}`)}`,
    );
  }

  if (finalState === "timeout") {
    // 배포가 60초 안에 완료되지 않음. 리소스 저장하지 않고 타임아웃 안내만.
    // 사용자가 잠시 후 다시 시도하면 자동 배포가 완료돼 있을 수 있음.
    redirect(`${returnTo}?deploy_error=timeout`);
  }

  // 8) READY 상태 — 안정적인 production URL 조회 후 리소스 저장.
  let productionAlias: string | null = null;
  try {
    productionAlias = await getVercelProjectProductionUrl(
      vercelToken,
      vercelProject.id,
    );
  } catch (err) {
    console.error("[firstDeployAction] getVercelProjectProductionUrl failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // production alias > per-deployment URL. 둘 다 없으면 에러로 처리
  // (project name 기반 fallback URL은 이미 다른 사람이 쓰고 있을 수 있어 위험)
  const siteUrl = productionAlias
    ? `https://${productionAlias}`
    : deployUrl
      ? `https://${deployUrl}`
      : null;

  if (!siteUrl) {
    redirect(`${returnTo}?deploy_error=no_url`);
  }

  addProjectResource({
    projectId: project.id,
    provider: "vercel",
    resourceType: "vercel_project",
    externalId: vercelProject.id,
    url: siteUrl,
    metadata: {
      vercelProjectName: vercelProject.name,
      deploymentId,
      deployUrl,
      productionAlias,
      readyState: finalState,
    },
  });
  completeSubstep();

  revalidatePath(returnTo);
  redirect(`${returnTo}?deploy_created=1`);
}

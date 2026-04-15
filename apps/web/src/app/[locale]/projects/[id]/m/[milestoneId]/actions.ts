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

import crypto from "node:crypto";

import { getCurrentUser } from "@/lib/auth/dal";
import { createGitHubAdapter } from "@/lib/adapters/github/github-adapter";
import {
  createSupabaseMgmtAdapter,
  createSupabaseProject,
  fetchSupabaseAnonKey,
  getSupabaseProject,
  updateGoogleProvider,
  updateSupabaseSiteConfig,
} from "@/lib/adapters/supabase-mgmt/supabase-mgmt-adapter";
import {
  createVercelProject,
  fetchVercelGitNamespaces,
  fetchVercelUser,
  getLatestDeployment,
  getVercelProjectProductionUrl,
  triggerVercelDeployment,
  type VercelUserMeta,
} from "@/lib/adapters/vercel/vercel-adapter";
import {
  getFileFromGitHub,
  pushFilesToGitHub,
} from "@/lib/adapters/github/github-adapter";
import {
  addSupabaseDependency,
  buildAuthButtonComponent,
  buildSupabaseClientFile,
} from "@/lib/deploy/auth-ui-nextjs-template";
import { buildNextJsLandingFiles } from "@/lib/deploy/nextjs-landing-template";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
  buildPayload,
  signOAuthState,
} from "@/lib/auth/oauth-state";
import {
  getOAuthAccessToken,
  getOAuthConnection,
  saveOAuthConnection,
} from "@/lib/auth/oauth-connections";
import {
  addProjectResource,
  getProject,
  getProjectResourceByType,
  markSubstepCompleted,
  removeProjectResourceByType,
  unmarkSubstepCompleted,
  updateProjectResourceMetadata,
} from "@/lib/projects/project-store";
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

  const project = await getProject(projectId);
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
 * (마)-1 — Supabase Management OAuth 플로우 시작.
 *
 * connectGitHubAction과 동일한 패턴. callback은 /auth/supabase/callback이며
 * redirect_uri는 그쪽에서 다시 origin으로 재구성한다 (RFC 6749 일치 필수).
 */
export async function connectSupabaseAction(
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

  const project = await getProject(projectId);
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

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/auth/supabase/callback`;

  const adapter = createSupabaseMgmtAdapter();
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

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  // 카탈로그는 idempotent 분기와 신규 분기 모두에서 markSubstepCompleted를
  // 호출할 때 필요하므로 try 진입 전에 한 번 조회한다.
  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  async function completeSubstep(): Promise<void> {
    if (!milestone) return;
    await markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  // 1) idempotent guard — 이미 만들어진 저장소가 있으면 GitHub API를
  //    건너뛰고 substep만 완료 마킹.
  const existing = await getProjectResourceByType(project.id, "github_repo");
  if (existing) {
    await completeSubstep();
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
  await addProjectResource({
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
  await completeSubstep();

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

  const project = await getProject(projectId);
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

  // Vercel 계정에 GitHub이 실제로 연결돼 있는지 확인. Vercel에 Google/이메일
  // 로만 가입한 경우 PAT 자체는 유효하지만 GitHub 신원을 Vercel이 모르기 때문에
  // 첫 배포에서 "linked to their GitHub account" 에러가 나고 사용자는 영문도
  // 모른 채 막힌다. 여기서 미리 막아 친절한 가이드로 유도한다.
  //
  // "unknown"(네트워크/권한으로 확인 실패)은 통과시킨다 — 기존 배포 에러
  // 매핑이 백업 레이어로 동작하므로 여기서 과도하게 차단하지 않는다.
  const gitLinkStatus = await fetchVercelGitNamespaces(vercelToken, "github");
  if (gitLinkStatus === "not-linked") {
    redirect(`${returnTo}?vercel_error=no_github_link`);
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
    await markSubstepCompleted({
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

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  // 카탈로그 조회 (substep 완료 마킹용)
  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  async function completeSubstep(): Promise<void> {
    if (!milestone) return;
    await markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });

    // (라)-5: 배포 성공 직후 따라오는 verify kind substep을 자동 완료.
    // 사용자가 이미 "배포하기"를 명시적으로 눌렀고 결과 URL도 받았으므로
    // verify는 의례적인 단계. 다음 substep이 verify면 자동으로 완료 처리해
    // 마일스톤이 자연스럽게 닫히게 한다.
    const currentIdx = milestone.substeps.findIndex((s) => s.id === substepId);
    const nextSubstep = milestone.substeps[currentIdx + 1];
    if (nextSubstep && nextSubstep.kind === "verify") {
      await markSubstepCompleted({
        projectId: project!.id,
        milestoneId,
        substepId: nextSubstep.id,
        totalSubsteps: milestone.substeps.length,
        allMilestoneIds: allMilestones.map((m) => m.id),
      });
    }
  }

  // 1) Idempotent guard — 이미 vercel_project 리소스가 있으면 skip
  const existingDeploy = await getProjectResourceByType(
    project.id,
    "vercel_project",
  );
  if (existingDeploy) {
    await completeSubstep();
    revalidatePath(returnTo);
    redirect(`${returnTo}?deploy_created=already`);
  }

  // 2) 선행 리소스 + 토큰 조회
  const githubRepo = await getProjectResourceByType(project.id, "github_repo");
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

  // 3) 저장소가 비어 있으면(= m1-s3 git push를 건너뛴 경우) 최소 Next.js
  // 프로젝트 세트를 fallback으로 push한다. 정상적으로 Phase 1 프로젝트를
  // push했으면 package.json에 `next`가 이미 있으므로 건드리지 않는다.
  //
  // goal에 따라 경로 prefix 결정: frontend/backend 분리 트랙은 frontend/ 아래
  // 에 Next.js 앱이 위치하고 Vercel rootDirectory도 frontend로 맞춘다.
  const GOALS_WITH_FRONTEND_DIR = new Set(["web-python", "web-java"]);
  const useFrontendDir =
    project.goal !== null && GOALS_WITH_FRONTEND_DIR.has(project.goal);
  const pathPrefix = useFrontendDir ? "frontend/" : "";
  const rootDirectory = useFrontendDir ? "frontend" : undefined;

  // 사용자가 m1-s3에서 이미 Next.js 프로젝트를 push했는지 확인.
  // package.json이 있고 `next` 의존성이 들어있으면 정상 — 그대로 둔다.
  let existingPkgJson: string | null = null;
  try {
    existingPkgJson = await getFileFromGitHub(
      ghToken,
      owner,
      repoName,
      `${pathPrefix}package.json`,
    );
  } catch (err) {
    console.warn("[firstDeployAction] package.json read failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  const hasUserNextProject =
    existingPkgJson !== null && /"next"\s*:/.test(existingPkgJson);

  let errCode: string | null = null;
  if (!hasUserNextProject) {
    console.log("[firstDeployAction] no user Next.js project found, pushing fallback template", {
      projectId: project.id,
      pathPrefix,
    });
    try {
      const templateFiles = buildNextJsLandingFiles({
        projectName: project.name,
      });
      const filesToPush = templateFiles.map((f) => ({
        path: `${pathPrefix}${f.path}`,
        content: f.content,
      }));
      await pushFilesToGitHub(
        ghToken,
        owner,
        repoName,
        filesToPush,
        "feat: scaffold Next.js landing via VibeStart",
      );
    } catch (err) {
      console.error("[firstDeployAction] pushFilesToGitHub failed", {
        userId: user.id,
        projectId: project.id,
        error: err instanceof Error ? err.message : String(err),
      });
      errCode =
        err instanceof Error
          ? err.message.replace(/\s+/g, "_").slice(0, 120)
          : "unknown";
    }
  } else {
    console.log("[firstDeployAction] user Next.js project detected, skipping template push", {
      projectId: project.id,
      pathPrefix,
    });
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
      rootDirectory,
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

  await addProjectResource({
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
  await completeSubstep();

  revalidatePath(returnTo);
  redirect(`${returnTo}?deploy_created=1`);
}

/**
 * (마)-2 — Supabase 프로젝트 자동 생성.
 *
 * 1. (마)-1에서 저장한 organizationId와 access token 사용
 * 2. createSupabaseProject 호출 (POST /v1/projects)
 * 3. ACTIVE_HEALTHY 상태가 될 때까지 폴링 (최대 90초)
 * 4. 결과 + db_pass를 supabase_project 리소스로 저장
 * 5. substep 완료 마킹
 *
 * 주의: db_pass는 로그에 절대 찍지 않는다.
 */
export async function createSupabaseProjectAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  async function completeSubstep(): Promise<void> {
    if (!milestone) return;
    await markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  // 1) Idempotent guard — 이미 supabase_project 리소스가 있으면 skip
  const existingProject = await getProjectResourceByType(
    project.id,
    "supabase_project",
  );
  if (existingProject) {
    await completeSubstep();
    revalidatePath(returnTo);
    redirect(`${returnTo}?supabase_project_created=already`);
  }

  // 2) (마)-1 OAuth 연결에서 토큰 + organization_id 조회
  const supabaseToken = await getOAuthAccessToken(user.id, "supabase_mgmt");
  if (!supabaseToken) {
    redirect(`${returnTo}?supabase_project_error=no_token`);
  }

  const conn = await getOAuthConnection(user.id, "supabase_mgmt");
  if (!conn) {
    redirect(`${returnTo}?supabase_project_error=no_connection`);
  }

  // OAuth metadata에서 organizationId 추출 (saveOAuthConnection metadata 안에 저장됨)
  let organizationId: string | null = null;

  // 1) metadata에서 우선 추출
  if (conn.metadata && typeof conn.metadata.organizationId === "string") {
    organizationId = conn.metadata.organizationId;
  }

  // 2) metadata에 없으면 /v1/organizations API fallback
  if (!organizationId) {
    try {
      const orgsRes = await fetch("https://api.supabase.com/v1/organizations", {
        headers: {
          Authorization: `Bearer ${supabaseToken}`,
          Accept: "application/json",
          "User-Agent": "VibeStart",
        },
      });
      if (orgsRes.ok) {
        const orgs = (await orgsRes.json()) as Array<{ id?: string }>;
        organizationId = orgs[0]?.id ?? null;
      }
    } catch (err) {
      console.error("[createSupabaseProjectAction] org fetch failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!organizationId) {
    redirect(`${returnTo}?supabase_project_error=no_organization`);
  }

  // 3) DB 비밀번호 자동 생성 (32바이트 → base64) — 로그에 안 찍힘
  const dbPass = crypto.randomBytes(24).toString("base64");

  // 4) 프로젝트 생성
  let createdProject: {
    id: string;
    ref: string;
    name: string;
    status: string;
    apiUrl: string;
  } | null = null;
  let errCode: string | null = null;
  try {
    createdProject = await createSupabaseProject(supabaseToken, {
      organizationId,
      name: project.slug,
      dbPass,
      region: "ap-northeast-2",
      plan: "free",
    });
  } catch (err) {
    console.error("[createSupabaseProjectAction] createSupabaseProject failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    errCode =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
  }

  if (errCode || !createdProject) {
    redirect(
      `${returnTo}?supabase_project_error=${encodeURIComponent(errCode ?? "unknown")}`,
    );
  }

  // 5) 폴링: ACTIVE_HEALTHY 도달까지 (최대 90초)
  const POLL_INTERVAL = 5000;
  const POLL_MAX = 90000;
  const start = Date.now();
  let finalStatus = createdProject.status;

  try {
    while (Date.now() - start < POLL_MAX) {
      if (finalStatus === "ACTIVE_HEALTHY") break;
      if (
        finalStatus === "INIT_FAILED" ||
        finalStatus === "REMOVED" ||
        finalStatus === "GOING_DOWN"
      ) {
        break;
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      const polled = await getSupabaseProject(supabaseToken, createdProject.ref);
      if (polled) {
        finalStatus = polled.status;
      }
    }
  } catch (err) {
    console.error("[createSupabaseProjectAction] polling failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (finalStatus === "INIT_FAILED") {
    redirect(`${returnTo}?supabase_project_error=init_failed`);
  }

  // 6) 리소스 저장 (db_pass 포함 — 추후 (마)-4/5에서 필요)
  await addProjectResource({
    projectId: project.id,
    provider: "supabase_mgmt",
    resourceType: "supabase_project",
    externalId: createdProject.id,
    url: `https://supabase.com/dashboard/project/${createdProject.ref}`,
    metadata: {
      ref: createdProject.ref,
      name: createdProject.name,
      apiUrl: createdProject.apiUrl,
      organizationId,
      dbPass, // ⚠️ 평문 저장 — Phase 2b Vault로 이관 예정
      finalStatus,
    },
  });
  await completeSubstep();

  revalidatePath(returnTo);
  redirect(`${returnTo}?supabase_project_created=1`);
}

/**
 * (마)-3 — Google OAuth 키 저장.
 *
 * Google Cloud Console은 API로 OAuth 클라이언트를 만들 수 없어 사용자가
 * 직접 발급받은 client_id / client_secret을 폼으로 받아 저장한다. (마)-4의
 * enable Google provider 단계에서 Supabase Auth 설정에 주입될 값들.
 *
 * - 입력 검증: 비어있지 않은 trimmed string, 지나치게 긴 값 차단
 * - client_secret은 평문으로 project_resources.metadata에 저장 (⚠️ Phase 2b Vault 이관)
 * - 로그에 client_secret은 절대 찍지 않는다
 * - idempotent: 이미 저장돼 있으면 새로 쓰지 않고 redirect(already)
 */
export async function saveGoogleOAuthKeysAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  async function completeSubstep(): Promise<void> {
    if (!milestone) return;
    await markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  // Idempotent guard
  const existing = await getProjectResourceByType(project.id, "google_oauth_keys");
  if (existing) {
    await completeSubstep();
    revalidatePath(returnTo);
    redirect(`${returnTo}?google_keys_saved=already`);
  }

  // 입력 검증
  const clientIdRaw = formData.get("clientId");
  const clientSecretRaw = formData.get("clientSecret");
  const clientId =
    typeof clientIdRaw === "string" ? clientIdRaw.trim() : "";
  const clientSecret =
    typeof clientSecretRaw === "string" ? clientSecretRaw.trim() : "";

  if (!clientId || !clientSecret) {
    redirect(`${returnTo}?google_keys_error=empty`);
  }

  // Google OAuth client_id는 보통 `.apps.googleusercontent.com`으로 끝나지만
  // 형식이 바뀔 수 있으므로 엄격 검증은 피하고 길이만 제한한다.
  if (clientId.length > 256 || clientSecret.length > 256) {
    redirect(`${returnTo}?google_keys_error=too_long`);
  }

  // 저장 — externalId는 clientId를 쓴다 (동일 clientId 재저장 방지 idempotency)
  await addProjectResource({
    projectId: project.id,
    provider: "google",
    resourceType: "google_oauth_keys",
    externalId: clientId,
    url: null,
    metadata: {
      clientId,
      clientSecret, // ⚠️ 평문 저장 — Phase 2b Vault로 이관 예정
    },
  });
  await completeSubstep();

  revalidatePath(returnTo);
  redirect(`${returnTo}?google_keys_saved=1`);
}

/**
 * (마)-3 — 저장된 Google OAuth 키 리셋.
 *
 * 잘못 입력한 값을 수정할 수 있도록 in-memory 리소스를 삭제하고 m2-s3
 * substep을 unmark한다. (마)-4가 이미 완료되었다면 Supabase Auth에는 옛 키가
 * 주입된 상태이므로, 사용자에게 (마)-4를 다시 돌려야 한다는 경고는 UI에서
 * 띄운다 (resetGoogleOAuthKeysAction은 m2-s4는 건드리지 않음 — 사용자가
 * 명시적으로 재실행해야).
 */
export async function resetGoogleOAuthKeysAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  await removeProjectResourceByType(project.id, "google_oauth_keys");
  await unmarkSubstepCompleted(project.id, milestoneId, substepId);

  revalidatePath(returnTo);
  redirect(`${returnTo}?google_keys_reset=1`);
}

/**
 * (마)-4 — Supabase에 Google OAuth provider 활성화.
 *
 * 1. 선행 조건 3개 검증
 *    - supabase_project 리소스 (마)-2에서 생성됨, metadata.ref 필요
 *    - google_oauth_keys 리소스 (마)-3에서 저장됨, clientId/clientSecret 필요
 *    - supabase_mgmt access token (마)-1에서 발급됨
 * 2. PATCH /v1/projects/{ref}/config/auth로 external_google_* 필드 업데이트
 * 3. 성공 시 supabase_project.metadata.googleProviderEnabled = true 플래그 기록
 * 4. substep 완료 마킹
 *
 * idempotent: 이미 활성화돼 있어도 동일한 PATCH를 다시 보내 200을 받는다.
 * 사용자가 (마)-3에서 키를 바꾸고 (마)-4를 재실행하면 새 값으로 덮어쓰인다.
 *
 * 보안: client_secret은 로그에 절대 찍지 않는다.
 */
export async function enableGoogleProviderAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  async function completeSubstep(): Promise<void> {
    if (!milestone) return;
    await markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  // 1) 선행 리소스: Supabase 프로젝트
  const supabaseProjectResource = await getProjectResourceByType(
    project.id,
    "supabase_project",
  );
  if (!supabaseProjectResource) {
    redirect(`${returnTo}?google_provider_error=no_supabase_project`);
  }
  const supabaseRefRaw = (
    supabaseProjectResource.metadata as { ref?: unknown }
  ).ref;
  const supabaseRef =
    typeof supabaseRefRaw === "string" && supabaseRefRaw.length > 0
      ? supabaseRefRaw
      : null;
  if (!supabaseRef) {
    redirect(`${returnTo}?google_provider_error=no_supabase_ref`);
  }

  // 2) 선행 리소스: Google OAuth 키
  const googleKeysResource = await getProjectResourceByType(
    project.id,
    "google_oauth_keys",
  );
  if (!googleKeysResource) {
    redirect(`${returnTo}?google_provider_error=no_google_keys`);
  }
  const googleMeta = googleKeysResource.metadata as {
    clientId?: unknown;
    clientSecret?: unknown;
  };
  const clientId =
    typeof googleMeta.clientId === "string" ? googleMeta.clientId : "";
  const clientSecret =
    typeof googleMeta.clientSecret === "string" ? googleMeta.clientSecret : "";
  if (!clientId || !clientSecret) {
    redirect(`${returnTo}?google_provider_error=invalid_google_keys`);
  }

  // 3) 선행 토큰: Supabase Management
  const supabaseToken = await getOAuthAccessToken(user.id, "supabase_mgmt");
  if (!supabaseToken) {
    redirect(`${returnTo}?google_provider_error=no_token`);
  }

  // 4) Auth config 업데이트
  let errCode: string | null = null;
  try {
    await updateGoogleProvider(supabaseToken, supabaseRef, {
      clientId,
      clientSecret,
    });
  } catch (err) {
    // ⚠️ 의도적으로 client_secret은 로그에 포함하지 않는다.
    console.error("[enableGoogleProviderAction] updateGoogleProvider failed", {
      userId: user.id,
      projectId: project.id,
      ref: supabaseRef,
      error: err instanceof Error ? err.message : String(err),
    });
    errCode =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
  }

  if (errCode) {
    redirect(
      `${returnTo}?google_provider_error=${encodeURIComponent(errCode)}`,
    );
  }

  // 5) supabase_project metadata에 플래그 기록 — (마)-5에서 이 플래그로
  // (마)-4 완료 여부를 검증할 수 있다.
  await updateProjectResourceMetadata(project.id, "supabase_project", {
    googleProviderEnabled: true,
  });

  await completeSubstep();

  revalidatePath(returnTo);
  redirect(`${returnTo}?google_provider_enabled=1`);
}

/**
 * (마)-5 — 사용자 사이트에 Google 로그인 UI 설치.
 *
 * 순서:
 *   1. 선행 리소스 확인 (github_repo, supabase_project, vercel_project)
 *      + 선행 토큰 (github, supabase_mgmt)
 *   2. Supabase anon key 조회 후 supabase_project metadata에 캐시
 *   3. Supabase Auth의 site_url / uri_allow_list를 Vercel 배포 URL로 업데이트
 *   4. Next.js Auth 파일 빌드 (supabase client, page.tsx, callback route)
 *   5. GitHub에 파일들 push + package.json에 의존성 추가 → Vercel 자동 재배포
 *   6. supabase_project metadata에 authUiInstalled 플래그 기록
 *   7. substep 완료 (자동으로 다음 verify substep (마)-6도 완료)
 *
 * idempotent: 같은 HTML로 다시 push하면 GitHub Contents API는 sha 기반
 * 업데이트로 처리한다 (동일 내용이어도 새 커밋이 생길 수 있음). Supabase
 * 설정 업데이트도 동일 값으로 호출해도 안전.
 *
 * 보안: anon key는 공개 키라 로그에 남겨도 무방하지만, 굳이 찍을 필요가
 * 없어 메시지에서는 제외한다.
 */
export async function installAuthUiAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = resolveLocale(formData.get("locale"));

  if (!projectId || !milestoneId || !substepId) {
    throw new Error("필수 파라미터 누락");
  }

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  async function completeSubstep(): Promise<void> {
    if (!milestone) return;
    await markSubstepCompleted({
      projectId: project!.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });

    // (마)-6 (m2-s6-verify-signup)은 서버 쪽에서 자동 완료하지 않는다.
    // 사용자가 Claude Code로 실제 버튼을 코드에 끼워 넣고 git push까지 마친 뒤
    // 배포된 HTML에 data-auth-button 속성이 실제 렌더되는지 HTTP verify
    // (verifyAuthButtonAction)가 통과해야만 완료 처리된다.
  }

  // 1) 선행 리소스 + 토큰 조회
  const githubRepo = await getProjectResourceByType(project.id, "github_repo");
  if (!githubRepo) {
    redirect(`${returnTo}?install_auth_ui_error=no_repo`);
  }
  const supabaseProjectResource = await getProjectResourceByType(
    project.id,
    "supabase_project",
  );
  if (!supabaseProjectResource) {
    redirect(`${returnTo}?install_auth_ui_error=no_supabase_project`);
  }
  const vercelProjectResource = await getProjectResourceByType(
    project.id,
    "vercel_project",
  );
  if (!vercelProjectResource) {
    redirect(`${returnTo}?install_auth_ui_error=no_vercel_project`);
  }

  const supabaseMeta = supabaseProjectResource.metadata as {
    ref?: unknown;
    apiUrl?: unknown;
    anonKey?: unknown;
    googleProviderEnabled?: unknown;
  };
  const supabaseRef =
    typeof supabaseMeta.ref === "string" ? supabaseMeta.ref : null;
  const supabaseApiUrl =
    typeof supabaseMeta.apiUrl === "string" ? supabaseMeta.apiUrl : null;
  if (!supabaseRef || !supabaseApiUrl) {
    redirect(`${returnTo}?install_auth_ui_error=no_supabase_ref`);
  }

  // (마)-4가 먼저 돌았어야 하지만 엄격하게 강제하지는 않는다 — 사용자가
  // 단계를 건너뛰었어도 HTML 자체는 작동할 수 있기 때문. 다만 경고는 로그에.
  if (supabaseMeta.googleProviderEnabled !== true) {
    console.warn("[installAuthUiAction] googleProviderEnabled flag missing", {
      projectId: project.id,
    });
  }

  const vercelUrl = vercelProjectResource.url;
  if (!vercelUrl) {
    redirect(`${returnTo}?install_auth_ui_error=no_vercel_url`);
  }

  const ghToken = await getOAuthAccessToken(user.id, "github");
  if (!ghToken) {
    redirect(`${returnTo}?install_auth_ui_error=no_github_token`);
  }
  const supabaseToken = await getOAuthAccessToken(user.id, "supabase_mgmt");
  if (!supabaseToken) {
    redirect(`${returnTo}?install_auth_ui_error=no_supabase_token`);
  }

  // externalId는 "owner/repo" 형태
  const [owner, repoName] = githubRepo.externalId.split("/");
  if (!owner || !repoName) {
    redirect(`${returnTo}?install_auth_ui_error=invalid_repo`);
  }

  // 2) anon key 조회 (metadata에 이미 있으면 재사용)
  let anonKey =
    typeof supabaseMeta.anonKey === "string" && supabaseMeta.anonKey.length > 0
      ? supabaseMeta.anonKey
      : null;
  if (!anonKey) {
    try {
      anonKey = await fetchSupabaseAnonKey(supabaseToken, supabaseRef);
    } catch (err) {
      console.error("[installAuthUiAction] fetchSupabaseAnonKey failed", {
        userId: user.id,
        projectId: project.id,
        error: err instanceof Error ? err.message : String(err),
      });
      const code =
        err instanceof Error
          ? err.message.replace(/\s+/g, "_").slice(0, 120)
          : "unknown";
      redirect(
        `${returnTo}?install_auth_ui_error=${encodeURIComponent(`fetch_key_failed:${code}`)}`,
      );
    }
    // metadata에 캐시 (이후 재실행 시 API 호출 절약)
    await updateProjectResourceMetadata(project.id, "supabase_project", {
      anonKey,
    });
  }

  // 3) Supabase Auth site_url / redirect 허용 목록 업데이트
  try {
    await updateSupabaseSiteConfig(supabaseToken, supabaseRef, {
      siteUrl: vercelUrl,
      redirectUris: [
        vercelUrl,
        `${vercelUrl}/**`,
        // 로컬 개발 환경에서도 같은 Supabase 프로젝트로 테스트할 수 있게.
        "http://localhost:3000/**",
      ],
    });
  } catch (err) {
    console.error("[installAuthUiAction] updateSupabaseSiteConfig failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    const code =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
    redirect(
      `${returnTo}?install_auth_ui_error=${encodeURIComponent(`site_config_failed:${code}`)}`,
    );
  }

  // 4) Next.js Auth 파일 빌드 — 사용자 코드는 절대 건드리지 않는다.
  // 별도 /auth/callback Route Handler는 만들지 않는다 — Supabase JS v2의
  // implicit flow는 토큰을 URL 해시 프래그먼트(#access_token=...)로 돌려주고,
  // 해시는 HTTP 요청에 포함되지 않아 서버에서 읽을 수 없기 때문. 대신
  // AuthButton 컴포넌트가 redirectTo를 사이트 루트(origin)로 지정해 supabase
  // client의 detectSessionInUrl 로직(기본 true)이 해시를 읽어 세션을 자동
  // 복원한다.
  //
  // 사이트의 어디에 AuthButton을 끼워넣을지는 사용자가 Claude Code에 자연어
  // 프롬프트로 위임 — 사용자가 만든 사이트 구조가 무엇이든 LLM이 적절한
  // 위치를 판단한다. M2 완료 화면에서 추천 프롬프트를 복붙으로 제공.
  const templateInput = {
    projectName: project.name,
    supabaseUrl: supabaseApiUrl,
    supabaseAnonKey: anonKey,
  };
  const supabaseClientFile = buildSupabaseClientFile(templateInput);
  const authButtonComponent = buildAuthButtonComponent();

  // package.json에 @supabase/supabase-js 추가
  // goal에 따라 package.json 경로 결정 (frontend/ 구조 대응)
  const GOALS_WITH_FRONTEND_PKG = new Set(["web-python", "web-java"]);
  const pkgPath = project.goal && GOALS_WITH_FRONTEND_PKG.has(project.goal)
    ? "frontend/package.json"
    : "package.json";

  let updatedPackageJson: string | null = null;
  try {
    const currentPkg = await getFileFromGitHub(ghToken, owner, repoName, pkgPath);
    if (currentPkg) {
      updatedPackageJson = addSupabaseDependency(currentPkg);
    }
  } catch (err) {
    console.warn("[installAuthUiAction] package.json read failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 5) 이전 deployment ID 기록 — push 후 새 deployment와 구분용
  const vercelProjectId = vercelProjectResource.externalId;
  const vercelToken = await getOAuthAccessToken(user.id, "vercel");
  let previousDeploymentId: string | null = null;
  if (vercelToken) {
    try {
      const prev = await getLatestDeployment(vercelToken, vercelProjectId);
      previousDeploymentId = prev?.id ?? null;
    } catch {
      // non-fatal: 이전 deployment 모르면 폴링은 계속하되 구분 못함
    }
  }

  // 6) GitHub에 Next.js Auth 파일들 push
  // goal에 따라 파일 경로 prefix 결정 (frontend/backend 분리 구조 대응)
  const GOALS_WITH_FRONTEND_DIR_M2 = new Set(["web-python", "web-java"]);
  const pathPrefix = project.goal && GOALS_WITH_FRONTEND_DIR_M2.has(project.goal)
    ? "frontend/"
    : "";

  try {
    // 사용자 사이트 코드를 절대 건드리지 않고 신규 파일과 의존성만 추가한다.
    // 모든 Auth 파일을 한 커밋으로 push (Vercel 배포 1회만 트리거).
    const filesToPush: Array<{ path: string; content: string }> = [
      { path: `${pathPrefix}src/lib/supabase.ts`, content: supabaseClientFile },
      {
        path: `${pathPrefix}src/components/auth-button.tsx`,
        content: authButtonComponent,
      },
    ];
    if (updatedPackageJson) {
      filesToPush.push({
        path: `${pathPrefix}package.json`,
        content: updatedPackageJson,
      });
    }
    await pushFilesToGitHub(
      ghToken, owner, repoName,
      filesToPush,
      "feat: add Supabase auth scaffold via VibeStart",
    );
  } catch (err) {
    console.error("[installAuthUiAction] pushFilesToGitHub failed", {
      userId: user.id,
      projectId: project.id,
      error: err instanceof Error ? err.message : String(err),
    });
    const code =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
    redirect(
      `${returnTo}?install_auth_ui_error=${encodeURIComponent(`push_failed:${code}`)}`,
    );
  }

  // 7) Vercel 재배포 폴링 — firstDeployAction 패턴 재사용.
  //
  // GitHub push → Vercel webhook → 새 deployment 트리거. deployment가
  // READY에 도달할 때까지 대기하여 사용자가 "사이트 열기"를 눌렀을 때
  // 실제로 새 버전을 볼 수 있게 한다.
  //
  // 타임아웃 시에도 파일은 이미 올라갔으므로 soft-success로 처리:
  //   - READY: ?auth_ui_installed=1 (즉시 확인 가능)
  //   - timeout: ?auth_ui_installed=pending (1~2분 후 확인 안내)
  //   - ERROR/CANCELED: 에러 redirect
  let deployResult: "ready" | "pending" | "error" = "pending";

  if (vercelToken) {
    // Vercel webhook 처리 대기
    await new Promise((r) => setTimeout(r, 3000));

    // 새 deployment 감지 (최대 15초) — id가 이전과 달라지면 새 빌드
    let newDeploymentDetected = false;
    const detectStart = Date.now();
    while (Date.now() - detectStart < 15_000) {
      try {
        const latest = await getLatestDeployment(
          vercelToken,
          vercelProjectId,
        );
        if (latest && latest.id !== previousDeploymentId) {
          newDeploymentDetected = true;
          break;
        }
      } catch {
        // retry
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 새 deployment를 찾았으면 READY까지 폴링 (최대 60초)
    if (newDeploymentDetected) {
      const pollStart = Date.now();
      while (Date.now() - pollStart < 60_000) {
        try {
          const current = await getLatestDeployment(
            vercelToken,
            vercelProjectId,
          );
          if (current) {
            if (current.readyState === "READY") {
              deployResult = "ready";
              break;
            }
            if (
              current.readyState === "ERROR" ||
              current.readyState === "CANCELED"
            ) {
              deployResult = "error";
              break;
            }
          }
        } catch {
          // retry
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    } else {
      console.warn(
        "[installAuthUiAction] no new Vercel deployment detected after 15s",
        { projectId: project.id },
      );
    }
  }

  // ERROR/CANCELED — 파일은 올라갔으나 Vercel 빌드 실패
  if (deployResult === "error") {
    redirect(
      `${returnTo}?install_auth_ui_error=deploy_failed`,
    );
  }

  // 8) 플래그 저장 + substep 완료 (READY 또는 timeout — 파일은 반드시 올라감)
  await updateProjectResourceMetadata(project.id, "supabase_project", {
    authUiInstalled: true,
  });
  await completeSubstep();

  revalidatePath(returnTo);
  // READY → 즉시 확인, pending → "배포 중" 안내
  redirect(
    `${returnTo}?auth_ui_installed=${deployResult === "ready" ? "1" : "pending"}`,
  );
}

/**
 * (마)-6 — 배포된 사이트 HTML을 fetch해서 로그인 버튼이 실제로 반영됐는지 확인.
 *
 * 사용자가 M2 ClaudeCodePromptCard의 프롬프트대로 Claude Code에 git pull +
 * AuthButton 끼워넣기 + git commit/push까지 마치고 Vercel 재배포가 끝난 뒤
 * "확인하기" 버튼을 누른다. 서버가 Vercel deployedUrl을 GET해서 응답 body에
 * `data-auth-button` 속성이 있으면 (auth-ui-nextjs-template.ts가 버튼 루트
 * 요소에 주입하는 값) 성공으로 간주하고 m2-s6를 완료 마킹한다.
 *
 * 실패 케이스: deployedUrl 없음 / fetch 실패 / 속성 없음 → query param으로
 * 에러 코드 전달, 패널이 해당 메시지 표시.
 */
export async function verifyAuthButtonAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = String(formData.get("locale") ?? "ko");

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  const vercelResource = await getProjectResourceByType(
    project.id,
    "vercel_project",
  );
  const deployedUrl = vercelResource?.url;
  if (!deployedUrl) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?verify_auth_button_error=no_deployed_url`);
  }

  let html: string | null = null;
  try {
    const res = await fetch(deployedUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: { "user-agent": "VibeStart-Verifier/1.0" },
    });
    if (res.ok) {
      html = await res.text();
    } else {
      console.warn("[verifyAuthButtonAction] non-OK response", {
        deployedUrl,
        status: res.status,
      });
    }
  } catch (err) {
    console.error("[verifyAuthButtonAction] fetch failed", {
      deployedUrl,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (!html) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?verify_auth_button_error=fetch_failed`);
  }

  // auth-ui-nextjs-template.ts의 AuthButton 컴포넌트는 "use client"이며
  // 서버 렌더 시점에는 loading=true 상태로 렌더되므로, SSR HTML에는 signed-in/
  // signed-out이 아니라 data-auth-button="loading"만 들어 있다. 하이드레이션
  // 이후에만 signed-* 상태가 나타나는데, 우리 HTTP fetch는 JS 실행 없이 원본
  // 마크업만 받으므로 loading 상태를 기준으로 검증해야 한다. 세 상태 모두
  // 커버하면서 우연한 매칭은 피하기 위해 `data-auth-button="` 접두를 사용한다.
  const hasButton = html.includes('data-auth-button="');
  if (!hasButton) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?verify_auth_button_error=not_found`);
  }

  // 1단계(HTTP verify) 통과. 아직 substep 완료로 마킹하지 않는다.
  // supabase_project.metadata.authButtonHttpVerified 플래그만 세워 두고,
  // 2단계(사용자 수동 가입 테스트 확인)까지 통과하면 confirmSignupTestAction
  // 에서 markSubstepCompleted가 호출된다. 두 단계로 쪼갠 이유:
  // HTTP에 data-auth-button 속성이 있다는 건 버튼 컴포넌트가 페이지에 심어져
  // 있다는 뜻일 뿐, Supabase URL/anon key가 정확한지, Google OAuth redirect가
  // 제대로 돌아가는지, 세션이 실제로 붙는지 등 end-to-end 정상성은 검증
  // 못 한다. 사용자가 본인 계정으로 한 번 눌러봐야 silent failure가 드러난다.
  await updateProjectResourceMetadata(project.id, "supabase_project", {
    authButtonHttpVerified: true,
  });

  revalidatePath(returnTo);
  redirect(`${returnTo}?verify_auth_button=1`);
}

/**
 * (마)-6 2단계 — 사용자가 직접 본인 계정으로 Google 가입/로그인 테스트를
 * 완료했음을 확인. 1단계(verifyAuthButtonAction)가 통과한 뒤에만 호출 가능.
 *
 * 이 액션이 실제로 m2-s6-verify-signup를 markSubstepCompleted 처리해
 * 마일스톤 완료 celebration을 발동시킨다.
 */
export async function confirmSignupTestAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const substepId = String(formData.get("substepId") ?? "");
  const locale = String(formData.get("locale") ?? "ko");

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const returnTo = buildReturnTo(locale, projectId, milestoneId);

  // 1단계(authButtonHttpVerified)가 선행돼야 함을 확인. 없으면 무시하고
  // ready 상태로 돌려보낸다 (사용자가 URL 조작 등으로 스킵 시도하는 경우).
  const supabaseResource = await getProjectResourceByType(
    project.id,
    "supabase_project",
  );
  const httpVerified =
    supabaseResource &&
    typeof supabaseResource.metadata === "object" &&
    supabaseResource.metadata !== null &&
    "authButtonHttpVerified" in supabaseResource.metadata &&
    (supabaseResource.metadata as { authButtonHttpVerified?: unknown })
      .authButtonHttpVerified === true;

  if (!httpVerified) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?verify_auth_button_error=not_http_verified`);
  }

  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);
  if (milestone) {
    await markSubstepCompleted({
      projectId: project.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?signup_test_confirmed=1`);
}

/**
 * copy-paste / verify / user-action substep의 수동 완료/해제 토글.
 *
 * SubstepList 체크박스에서 호출한다. 체크 → markSubstepCompleted,
 * 언체크 → unmarkSubstepCompleted.
 */
export async function toggleSubstepAction(
  projectId: string,
  milestoneId: string,
  substepId: string,
  checked: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const catalog = createInMemoryMilestoneCatalog();
  const milestone = catalog.getMilestone(project.track, milestoneId);
  const allMilestones = catalog.listMilestones(project.track);

  if (!milestone) return;

  if (checked) {
    await markSubstepCompleted({
      projectId: project.id,
      milestoneId,
      substepId,
      totalSubsteps: milestone.substeps.length,
      allMilestoneIds: allMilestones.map((m) => m.id),
    });
  } else {
    await unmarkSubstepCompleted(project.id, milestoneId, substepId);
  }

  revalidatePath(`/projects/${projectId}/m/${milestoneId}`);
}


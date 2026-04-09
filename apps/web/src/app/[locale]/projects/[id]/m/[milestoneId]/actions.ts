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
 */

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";
import type { VcsRepo } from "@vibestart/shared-types";

import { getCurrentUser } from "@/lib/auth/dal";
import { createGitHubAdapter } from "@/lib/adapters/github/github-adapter";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
  buildPayload,
  signOAuthState,
} from "@/lib/auth/oauth-state";
import { getOAuthAccessToken } from "@/lib/auth/oauth-connections";
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

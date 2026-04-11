/**
 * GitHub OAuth callback route.
 *
 * 플로우:
 *   1. URL 쿼리에서 code + state 추출
 *   2. HttpOnly 쿠키에서 signed state 추출 및 검증
 *   3. URL state와 쿠키 payload state 대조 (CSRF 방지)
 *   4. 쿠키 페이로드의 userId 검증 (현재 세션 사용자와 일치해야 함)
 *   5. GitHub /login/oauth/access_token으로 code → token 교환
 *   6. oauth_connections에 upsert
 *   7. 해당 substep을 완료로 마킹 (마일스톤 자동 unlock 포함)
 *   8. payload.returnTo + ?github_connected=1 로 redirect
 *
 * 에러 시엔 returnTo + ?oauth_error=... 로 redirect해 UI가 안내 표시.
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createGitHubAdapter } from "@/lib/adapters/github/github-adapter";
import { getCurrentUser } from "@/lib/auth/dal";
import { saveOAuthConnection } from "@/lib/auth/oauth-connections";
import {
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "@/lib/auth/oauth-state";
import {
  getProject,
  markSubstepCompleted,
} from "@/lib/projects/project-store";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

function errorRedirect(url: URL, error: string): NextResponse {
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const urlState = url.searchParams.get("state");
  const ghError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  // 쿠키가 없으면 payload가 없어 returnTo를 모름 → 루트로
  if (!cookieToken) {
    return errorRedirect(new URL("/", url.origin), "missing_cookie");
  }

  const payload = verifyOAuthState(cookieToken);
  // 쿠키 소비 (재사용 방지). 검증 성공 여부와 무관하게 제거.
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!payload) {
    return errorRedirect(new URL("/", url.origin), "invalid_or_expired_state");
  }

  const returnTo = new URL(payload.returnTo, url.origin);

  // GitHub이 access_denied 등 에러로 보냈다면 즉시 안내
  if (ghError) {
    return errorRedirect(returnTo, `github:${ghError}`);
  }

  if (!code || !urlState) {
    return errorRedirect(returnTo, "missing_code_or_state");
  }

  if (payload.state !== urlState) {
    return errorRedirect(returnTo, "state_mismatch");
  }

  // 현재 세션 사용자와 payload의 userId가 일치해야 함
  const user = await getCurrentUser();
  if (!user || user.id !== payload.userId) {
    return errorRedirect(returnTo, "user_mismatch");
  }

  // 프로젝트 소유권 재검증
  const project = await getProject(payload.projectId);
  if (!project || project.userId !== user.id) {
    return errorRedirect(returnTo, "project_not_found");
  }

  try {
    const adapter = createGitHubAdapter();
    const result = await adapter.completeAuthorize(code, urlState);

    await saveOAuthConnection({
      userId: user.id,
      provider: "github",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      scope: result.scope,
      expiresAt: result.expiresAt,
      metadata: result.metadata,
    });

    // 해당 substep을 완료로 마킹. 전체 개수는 카탈로그에서 조회.
    const catalog = createInMemoryMilestoneCatalog();
    const milestone = catalog.getMilestone(project.track, payload.milestoneId);
    const allMilestones = catalog.listMilestones(project.track);

    if (milestone) {
      await markSubstepCompleted({
        projectId: project.id,
        milestoneId: payload.milestoneId,
        substepId: payload.substepId,
        totalSubsteps: milestone.substeps.length,
        allMilestoneIds: allMilestones.map((m) => m.id),
      });
    }
  } catch (err) {
    // 프로덕션 Vercel Function 로그에서 원인을 추적할 수 있도록 최소 로그.
    // 사용자에게는 redirect 쿼리로 요약된 코드만 노출하고, 상세 스택은 서버에.
    console.error("[oauth/github/callback] exchange_failed", {
      userId: user.id,
      projectId: project.id,
      milestoneId: payload.milestoneId,
      error: err instanceof Error ? err.message : String(err),
    });
    const msg =
      err instanceof Error
        ? err.message.replace(/\s+/g, "_").slice(0, 120)
        : "unknown";
    return errorRedirect(returnTo, `exchange_failed:${msg}`);
  }

  returnTo.searchParams.set("github_connected", "1");
  return NextResponse.redirect(returnTo);
}

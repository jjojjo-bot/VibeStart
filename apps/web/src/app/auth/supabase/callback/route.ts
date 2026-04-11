/**
 * Supabase Management OAuth callback route.
 *
 * Phase 2a (마)-1. GitHub callback과 동일한 패턴:
 *   1. URL 쿼리에서 code + state 추출
 *   2. HttpOnly 쿠키에서 signed state 추출 및 검증 + CSRF 대조
 *   3. 사용자/프로젝트 검증
 *   4. adapter.completeAuthorize(code, redirectUri) — Supabase는 redirect_uri
 *      가 token 교환에도 필요하므로 여기서 origin으로 재구성
 *   5. saveOAuthConnection upsert (provider="supabase_mgmt")
 *   6. m2-s1 substep 완료 마킹
 *   7. returnTo + ?supabase_connected=1 redirect
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMgmtAdapter } from "@/lib/adapters/supabase-mgmt/supabase-mgmt-adapter";
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
  const supError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (!cookieToken) {
    return errorRedirect(new URL("/", url.origin), "missing_cookie");
  }

  const payload = verifyOAuthState(cookieToken);
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!payload) {
    return errorRedirect(new URL("/", url.origin), "invalid_or_expired_state");
  }

  const returnTo = new URL(payload.returnTo, url.origin);

  if (supError) {
    return errorRedirect(returnTo, `supabase:${supError}`);
  }

  if (!code || !urlState) {
    return errorRedirect(returnTo, "missing_code_or_state");
  }

  if (payload.state !== urlState) {
    return errorRedirect(returnTo, "state_mismatch");
  }

  const user = await getCurrentUser();
  if (!user || user.id !== payload.userId) {
    return errorRedirect(returnTo, "user_mismatch");
  }

  const project = await getProject(payload.projectId);
  if (!project || project.userId !== user.id) {
    return errorRedirect(returnTo, "project_not_found");
  }

  // beginAuthorize에서 사용한 redirect_uri와 정확히 동일해야 한다.
  const redirectUri = `${url.origin}/auth/supabase/callback`;

  try {
    const adapter = createSupabaseMgmtAdapter();
    const result = await adapter.completeAuthorize(code, redirectUri);

    await saveOAuthConnection({
      userId: user.id,
      provider: "supabase_mgmt",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      scope: result.scope,
      expiresAt: result.expiresAt,
      metadata: result.metadata,
    });

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
    console.error("[oauth/supabase/callback] exchange_failed", {
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

  returnTo.searchParams.set("supabase_connected", "1");
  return NextResponse.redirect(returnTo);
}

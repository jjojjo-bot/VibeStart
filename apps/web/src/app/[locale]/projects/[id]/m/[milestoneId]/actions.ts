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
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/dal";
import { createGitHubAdapter } from "@/lib/adapters/github/github-adapter";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
  buildPayload,
  signOAuthState,
} from "@/lib/auth/oauth-state";
import { getDummyProject } from "@/lib/projects/in-memory-store";
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

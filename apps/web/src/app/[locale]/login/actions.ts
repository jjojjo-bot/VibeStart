"use server";

/**
 * Phase 2 — 로그인 Server Actions.
 *
 * Google OAuth URL을 Supabase에서 발급받아 사용자를 리다이렉트한다. 성공 시
 * Google → /auth/callback?code=... 로 돌아오고, callback route handler가
 * 세션 쿠키를 심은 뒤 /dashboard로 보낸다.
 */

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";

import { createSupabaseAuthAdapter } from "@/lib/auth/supabase-auth.adapter";
import { getCurrentUser } from "@/lib/auth/dal";
import { PHASE1_DATA_COOKIE } from "@/lib/auth/phase1-cookie";
import { routing } from "@/i18n/routing";

const VALID_GOALS = [
  "web-nextjs",
  "web-python",
  "web-java",
  "mobile",
  "data-ai",
  "not-sure",
] as const;
type ValidGoal = (typeof VALID_GOALS)[number];
const PHASE2_UNSUPPORTED_GOALS = new Set<ValidGoal>(["data-ai", "mobile"]);

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const rawLocale = formData.get("locale");
  const locale =
    typeof rawLocale === "string" &&
    (routing.locales as readonly string[]).includes(rawLocale)
      ? rawLocale
      : routing.defaultLocale;

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const adapter = createSupabaseAuthAdapter();
  const { url } = await adapter.signInWithGoogle(
    `${origin}/auth/callback?locale=${locale}`,
  );

  redirect(url);
}

/**
 * /complete 페이지에서 호출. Phase 1 데이터(os, goal, project)를
 * 쿠키에 저장한 뒤 Google OAuth를 시작한다. 콜백에서 쿠키를 읽어
 * 프로젝트를 자동 생성한다.
 */
export async function signInFromCompleteAction(
  formData: FormData,
): Promise<void> {
  const rawLocale = formData.get("locale");
  const locale =
    typeof rawLocale === "string" &&
    (routing.locales as readonly string[]).includes(rawLocale)
      ? rawLocale
      : routing.defaultLocale;

  // Phase 1 데이터를 쿠키에 저장 (5분 TTL)
  const phase1Data = {
    os: formData.get("os") ?? "windows",
    goal: formData.get("goal") ?? "web-nextjs",
    project: formData.get("project") ?? "my-first-app",
  };

  const jar = await cookies();
  jar.set(PHASE1_DATA_COOKIE, JSON.stringify(phase1Data), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300, // 5분
    path: "/",
  });

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const adapter = createSupabaseAuthAdapter();
  const { url } = await adapter.signInWithGoogle(
    `${origin}/auth/callback?locale=${locale}`,
  );

  redirect(url);
}

/**
 * `/complete`에서 "이미 계정이 있어요" 버튼이 호출한다.
 *
 * Phase 1 데이터를 쿠키에 실어 Phase 2 진입점으로 redirect한다. Phase 1 goal
 * 은 기술 스택(java/python/nextjs)이고 Phase 2 track은 제품 유형(포트폴리오/
 * 블로그·SaaS/AI/이커머스)이라 서로 orthogonal하다. goal에서 track을 자동
 * 유도하지 않고 사용자가 직접 `/projects/new`에서 트랙을 선택하게 한다.
 *
 * - 미로그인: `/login`으로 보내고, OAuth 후 `/auth/callback`이 쿠키를 유지한
 *   채로 `/projects/new`로 보낸다.
 * - 이미 로그인: `/projects/new`로 바로 보내서 트랙 선택 + 프로젝트 생성.
 * - data-ai/mobile goal: Phase 2 마일스톤(Vercel 배포/Auth UI)이 맞지 않아
 *   프로젝트 자동 생성을 건너뛰고 `/dashboard`로 보낸다. 쿠키는 삭제.
 */
export async function goToDashboardWithPhase1Action(
  formData: FormData,
): Promise<void> {
  const osRaw = String(formData.get("os") ?? "windows");
  const goalRaw = String(formData.get("goal") ?? "web-nextjs");
  const projectRaw = String(formData.get("project") ?? "my-first-app");

  const goal: ValidGoal | null = (VALID_GOALS as readonly string[]).includes(
    goalRaw,
  )
    ? (goalRaw as ValidGoal)
    : null;
  const projectName =
    projectRaw.trim().length > 0 ? projectRaw.trim() : "my-first-app";

  const jar = await cookies();

  // Phase 2가 지원하지 않는 goal — 쿠키 세팅 없이 대시보드로.
  if (goal && PHASE2_UNSUPPORTED_GOALS.has(goal)) {
    jar.delete(PHASE1_DATA_COOKIE);
    redirect("/dashboard");
  }

  // Phase 1 데이터 쿠키 저장 (로그인/미로그인 공통)
  jar.set(
    PHASE1_DATA_COOKIE,
    JSON.stringify({ os: osRaw, goal: goalRaw, project: projectName }),
    {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    },
  );

  const user = await getCurrentUser();
  if (!user) {
    // OAuth 후 callback에서 쿠키를 유지한 채 /projects/new로 보내진다.
    redirect("/login");
  }

  // 로그인돼 있으면 바로 트랙 선택 페이지로.
  redirect("/projects/new");
}

export async function signOutAction(): Promise<void> {
  const adapter = createSupabaseAuthAdapter();
  await adapter.signOut();
  redirect("/login");
}

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
import { createProject } from "@/lib/projects/project-store";
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
 * 이미 로그인된 상태라면 Server Action 안에서 프로젝트를 즉시 생성하고 해당
 * 프로젝트 페이지로 redirect한다. Server Component인 `/dashboard`에서는 쿠키
 * 수정이 금지(Next.js 16)되어 있어 과거에 쓰던 "쿠키 세팅 후 dashboard가
 * 처리" 패턴이 런타임 에러를 냈다. 이제 생성/삭제 모두 Server Action에서
 * 완결시켜 dashboard는 쿠키를 건드리지 않는다.
 *
 * 아직 로그인 전이라면 Phase 1 데이터를 쿠키에 실어 `/login`으로 보낸다.
 * 로그인 후 `/auth/callback` Route Handler가 쿠키를 읽어 프로젝트를 만든다.
 */
export async function goToDashboardWithPhase1Action(
  formData: FormData,
): Promise<void> {
  const osRaw = String(formData.get("os") ?? "windows");
  const goalRaw = String(formData.get("goal") ?? "web-nextjs");
  const projectRaw = String(formData.get("project") ?? "my-first-app");

  const os: "windows" | "macos" | null =
    osRaw === "windows" || osRaw === "macos" ? osRaw : null;
  const goal: ValidGoal | null = (VALID_GOALS as readonly string[]).includes(
    goalRaw,
  )
    ? (goalRaw as ValidGoal)
    : null;
  const projectName =
    projectRaw.trim().length > 0 ? projectRaw.trim() : "my-first-app";

  const user = await getCurrentUser();

  // 미로그인 — 쿠키에 Phase 1 데이터 저장하고 /login으로. OAuth 후
  // /auth/callback이 쿠키를 픽업해 프로젝트를 만든다.
  if (!user) {
    const jar = await cookies();
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
    redirect("/login");
  }

  // 이미 로그인됨 — data-ai/mobile은 Phase 2 마일스톤이 없어 프로젝트
  // 자동 생성을 건너뛰고 대시보드로 보낸다.
  if (goal && PHASE2_UNSUPPORTED_GOALS.has(goal)) {
    redirect("/dashboard");
  }

  const project = await createProject({
    userId: user.id,
    track: "static",
    name: projectName,
    os,
    goal,
  });

  redirect(`/projects/${project.id}`);
}

export async function signOutAction(): Promise<void> {
  const adapter = createSupabaseAuthAdapter();
  await adapter.signOut();
  redirect("/login");
}

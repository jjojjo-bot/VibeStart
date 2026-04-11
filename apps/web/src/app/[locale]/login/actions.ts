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
import { PHASE1_DATA_COOKIE } from "@/lib/auth/phase1-cookie";
import { routing } from "@/i18n/routing";

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

export async function signOutAction(): Promise<void> {
  const adapter = createSupabaseAuthAdapter();
  await adapter.signOut();
  redirect("/login");
}

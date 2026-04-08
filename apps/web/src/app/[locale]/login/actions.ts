"use server";

/**
 * Phase 2 — 로그인 Server Actions.
 *
 * Google OAuth URL을 Supabase에서 발급받아 사용자를 리다이렉트한다. 성공 시
 * Google → /auth/callback?code=... 로 돌아오고, callback route handler가
 * 세션 쿠키를 심은 뒤 /dashboard로 보낸다.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseAuthAdapter } from "@/lib/auth/supabase-auth.adapter";
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

export async function signOutAction(): Promise<void> {
  const adapter = createSupabaseAuthAdapter();
  await adapter.signOut();
  redirect("/login");
}

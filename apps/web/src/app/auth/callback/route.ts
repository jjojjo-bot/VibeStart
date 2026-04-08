/**
 * Phase 2 — Supabase OAuth 콜백 Route Handler.
 *
 * Google OAuth가 끝나면 사용자가 여기로 돌아온다. 쿼리 파라미터:
 *   - code: Supabase가 세션으로 교환할 OAuth 코드
 *   - locale: 로그인 시작 시점의 사용자 언어 (next-intl 프리픽스에 사용)
 *
 * 이 경로는 next-intl 프리픽스가 붙지 않는 최상위 /auth/callback 경로에
 * 위치해 모든 locale의 OAuth 리다이렉트를 공통으로 받는다.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAuthAdapter } from "@/lib/auth/supabase-auth.adapter";
import { routing } from "@/i18n/routing";

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawLocale = url.searchParams.get("locale");

  const locale =
    rawLocale && (routing.locales as readonly string[]).includes(rawLocale)
      ? rawLocale
      : routing.defaultLocale;

  // 기본 리다이렉트: 로그인 후 대시보드로. 에러 시 로그인 페이지로 돌아가며
  // 메시지를 쿼리스트링으로 전달한다.
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const successUrl = new URL(`${localePrefix}/dashboard`, url.origin);
  const errorUrl = new URL(`${localePrefix}/login`, url.origin);

  if (!code) {
    errorUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const adapter = createSupabaseAuthAdapter();
    await adapter.exchangeCode(code);
  } catch (err) {
    errorUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "exchange_failed",
    );
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(successUrl);
}

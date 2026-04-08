import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { hasAuthSupabaseEnv } from "./lib/supabase/auth-env";
import { createAuthProxyClient } from "./lib/supabase/auth-proxy";

const intlMiddleware = createMiddleware(routing);

/**
 * Next.js 16 proxy (구 middleware).
 *
 * 두 가지 책임:
 *   1. next-intl locale 라우팅 (한국어는 "/", 나머지는 "/en/" 등 프리픽스)
 *   2. Supabase 세션 쿠키 리프레시 — @supabase/ssr 패턴에 따라 매 요청마다
 *      createServerClient → getUser() 호출해야 토큰 리프레시가 쿠키에 반영됨
 *
 * 병합 전략: Supabase가 쓴 쿠키를 intl 응답에 옮겨 붙인다. 순서가 중요하다 —
 * Supabase 쿠키 갱신은 반드시 intl 응답 생성보다 먼저 완료되어야 한다.
 *
 * Phase 2 Supabase env가 없으면 (개발 초기, 아직 셋업 안 됨) intl만 돌린다.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (hasAuthSupabaseEnv()) {
    const { supabase, response: supabaseResponse } =
      createAuthProxyClient(request);

    // 토큰 리프레시는 getUser() 호출 시 일어난다. 이 호출을 생략하면
    // 응답이 커밋된 뒤에 리프레시가 일어나 새 쿠키가 소실된다.
    await supabase.auth.getUser();

    const intlResponse = intlMiddleware(request);

    // Supabase가 심은 Set-Cookie 헤더를 intl 응답에 복제한다.
    for (const cookie of supabaseResponse.cookies.getAll()) {
      intlResponse.cookies.set(cookie);
    }
    return intlResponse;
  }

  return intlMiddleware(request) as NextResponse;
}

export const config = {
  matcher: [
    "/((?!api|auth/callback|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opengraph-image).*)",
  ],
};
